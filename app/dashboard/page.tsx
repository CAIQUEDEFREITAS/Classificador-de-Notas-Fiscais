import { getSupabase } from "@/lib/supabase";
import type { NotaFiscalDB } from "@/lib/types";
import DashboardContent from "./dashboard-content";

// ─── Server Component: busca dados do Supabase no servidor ────────────────────

export default async function Dashboard() {
  const supabase = getSupabase();

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Erro</h1>
          <p className="text-gray-600">
            Configuração do Supabase não encontrada. Configure as variáveis de ambiente.
          </p>
        </div>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("notas_fiscais")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Erro</h1>
          <p className="text-gray-600">Erro ao carregar notas: {error.message}</p>
        </div>
      </div>
    );
  }

  return <DashboardContent notas={(data as NotaFiscalDB[]) ?? []} />;
}