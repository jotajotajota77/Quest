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
                // v11.2: cookie persistente 1 ano pra manter logado.
                maxAge: options?.maxAge ?? 60 * 60 * 24 * 365,
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
