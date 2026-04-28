import { getSupabase } from "@/lib/supabase";
import type { NotaFiscalDB } from "@/lib/types";
import DashboardContent from "./dashboard-content";

// ─── Server Component: busca dados do Supabase no servidor ────────────────────

export default async function Dashboard() {
  const supabase = getSupabase();

  // Supabase não configurado — mostra dashboard vazio
  if (!supabase) {
    return <DashboardContent notas={[]} avisoConexao="Supabase não configurado. Configure as variáveis de ambiente para ver as notas salvas." />;
  }

  try {
    const { data, error } = await supabase
      .from("notas_fiscais")
      .select("*")
      .order("criado_em", { ascending: false })
      .limit(100);

    if (error) {
      return <DashboardContent notas={[]} avisoConexao={`Erro ao carregar notas: ${error.message}`} />;
    }

    return <DashboardContent notas={(data as NotaFiscalDB[]) ?? []} />;
  } catch {
    // Falha de conexão (URL inválida, rede, etc.) — mostra dashboard vazio em vez de erro
    return <DashboardContent notas={[]} avisoConexao="Não foi possível conectar ao banco de dados. Verifique suas credenciais do Supabase no arquivo .env.local." />;
  }
}