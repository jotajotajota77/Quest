"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para componentes client-side.
 *
 * v11.9: força cookieOptions com maxAge = 1 ano. Sem isso o browser cria
 * cookie de sessão (sem maxAge), que some ao fechar a aba — obrigando o
 * usuário a logar toda vez. Middleware/server-side só corrigem o cookie
 * DEPOIS do refresh; se o cookie original já sumiu, nem chega no refresh.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        sameSite: "lax",
        secure: typeof window !== "undefined" && window.location.protocol === "https:",
      },
    },
  );
}
