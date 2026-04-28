"use client";

import { useMemo } from "react";
import type { NotaFiscalDB } from "@/lib/types";
import { formatBRL, formatarData } from "@/lib/formatters";

// ─── Client Component: renderização interativa do dashboard ───────────────────

interface DashboardContentProps {
  notas: NotaFiscalDB[];
}

export default function DashboardContent({ notas }: DashboardContentProps) {
  // Cálculos memorizados para evitar recomputação desnecessária a cada render
  const estatisticas = useMemo(() => {
    const totalValor = notas.reduce(
      (total, nota) => total + (nota.valor_total || 0),
      0
    );
    const notasValidas = notas.filter(
      (nota) => nota.validacoes?.chaveValida
    ).length;
    const notasComErros = notas.filter(
      (nota) => (nota.validacoes?.erros?.length ?? 0) > 0
    ).length;

    return { totalValor, notasValidas, notasComErros };
  }, [notas]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Cabeçalho com navegação */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Contábil</h1>
            <p className="text-gray-600 mt-2">
              Visualize todas as notas fiscais processadas
            </p>
          </div>
          <a
            href="/"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            ⬆️ Upload de Nota
          </a>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{notas.length}</div>
            <div className="text-gray-600">Total de Notas</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {formatBRL(estatisticas.totalValor)}
            </div>
            <div className="text-gray-600">Valor Total</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {estatisticas.notasValidas}
            </div>
            <div className="text-gray-600">Notas Válidas</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {estatisticas.notasComErros}
            </div>
            <div className="text-gray-600">Com Erros</div>
          </div>
        </div>

        {/* Tabela de notas */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Notas Fiscais Recentes</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número/Série
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Emissão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emitente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destinatário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notas.map((nota) => (
                  <tr key={nota.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {nota.numero}-{nota.serie}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatarData(nota.data_emissao)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {nota.emitente_nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {nota.destinatario_nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatBRL(nota.valor_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(nota.validacoes?.erros?.length ?? 0) > 0 ? (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Erros
                        </span>
                      ) : nota.validacoes?.chaveValida ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Válida
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Pendente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {notas.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma nota encontrada</h3>
              <p className="text-gray-600">
                Faça upload de algumas notas fiscais para começar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
