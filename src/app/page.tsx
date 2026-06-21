// Entrada do app. Pós-login cai SEMPRE no hub de seleção (TRAVA de UX),
// nunca direto na home. Sem sessão → /login.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Index() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  redirect("/hub");
}
