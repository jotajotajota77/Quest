// Entrada do app. Pós-login cai SEMPRE no hub de seleção (TRAVA de UX),
// nunca direto na home. Sem sessão → /login.
//
// Resiliência: se um link mágico cair aqui na raiz com `?code=` (acontece
// quando o Site URL do Supabase aponta para a raiz), trocamos o code por
// sessão aqui mesmo antes de decidir o destino — assim o login não se perde.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Index({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const supabase = createClient();

  if (searchParams.code) {
    await supabase.auth.exchangeCodeForSession(searchParams.code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  redirect("/hub");
}
