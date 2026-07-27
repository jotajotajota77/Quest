import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Cliente Supabase para Server Components / Route Handlers (lê cookies). */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                // v11.6: FORÇA 1 ano — igual ao middleware. O ?? não
                // preenchia porque Supabase sempre seta maxAge curto do
                // access token.
                maxAge: 60 * 60 * 24 * 365,
                path: options?.path ?? "/",
                sameSite: options?.sameSite ?? "lax",
              }),
            );
          } catch {
            // Chamado de um Server Component — middleware cuida do refresh.
          }
        },
      },
    },
  );
}
