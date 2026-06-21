import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Mantém a sessão Supabase fresca e protege rotas. Usuário não-logado vai para
 * /login; as demais rotas exigem sessão.
 *
 * Resiliência: o middleware NUNCA pode derrubar o site inteiro (todo request
 * passa por aqui). Se a config do Supabase faltar ou a chamada de auth falhar,
 * degradamos com graça — deixamos rotas públicas carregarem e mandamos o resto
 * para /login — em vez de estourar MIDDLEWARE_INVOCATION_FAILED.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const path = request.nextUrl.pathname;
  const publico =
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    path.startsWith("/api/spotify/callback") ||
    // Link mágico que cai na raiz com `?code=` precisa passar para a troca
    // de sessão acontecer (senão o middleware bounce para /login perde o code).
    request.nextUrl.searchParams.has("code");

  const url = request.nextUrl.clone();
  url.pathname = "/login";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Config ausente: não dá para autenticar. Não derruba o site — só protege.
  if (!supabaseUrl || !supabaseKey) {
    return publico ? response : NextResponse.redirect(url);
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !publico) {
      return NextResponse.redirect(url);
    }

    return response;
  } catch {
    // Falha de auth (rede, token, config inválida): falha fechada para rotas
    // protegidas (→ login) e aberta para públicas. Sem 500 global.
    return publico ? response : NextResponse.redirect(url);
  }
}
