"use client";
// components/NfeUpload.tsx
// Componente de upload de NF-e com visualização dos dados extraídos

import { useState, useCallback } from "react";
import type { NFe } from "@/lib/nfe-parser";
import { formatBRL } from "@/lib/nfe-parser";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

type Status = "idle" | "carregando" | "sucesso" | "erro";

interface RespostaApi {
  ok: boolean;
  dados?: NFe & { textoBruto?: string; aviso?: string; fonte?: string };
  fonte?: string;
  erro?: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function NfeUpload() {
  const [status, setStatus] = useState<Status>("idle");
  const [nfe, setNfe] = useState<NFe | null>(null);
  const [erro, setErro] = useState<string>("");
  const [aviso, setAviso] = useState<string>("");
  const [arrastando, setArrastando] = useState(false);

  // ── Upload ──────────────────────────────────────────────────────────────────

  async function enviarArquivo(arquivo: File) {
    setStatus("carregando");
    setErro("");
    setAviso("");
    setNfe(null);

    const form = new FormData();
    form.append("arquivo", arquivo);

    try {
      const res = await fetch("/api/nfe/upload", {
        method: "POST",
        body: form,
      });

      const resposta: RespostaApi = await res.json();

      if (!resposta.ok || !resposta.dados) {
        setErro(resposta.erro ?? "Erro desconhecido ao processar o arquivo.");
        setStatus("erro");
        return;
      }

      // Aviso para PDF/imagem (OCR, menor precisão)
      if (resposta.dados.aviso) {
        setAviso(resposta.dados.aviso);
      }

      setNfe(resposta.dados as NFe);
      setStatus("sucesso");
    } catch {
      setErro("Falha na conexão com o servidor. Verifique se ele está rodando.");
      setStatus("erro");
    }
  }

  // ── Drag & Drop ─────────────────────────────────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    const arquivo = e.dataTransfer.files[0];
    if (arquivo) enviarArquivo(arquivo);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(true);
  };

  const onDragLeave = () => setArrastando(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) enviarArquivo(arquivo);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Leitor de Nota Fiscal
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Suporta XML (NF-e), PDF (DANFE) e foto da nota
        </p>
      </div>

      {/* ── Área de upload ── */}
      <label
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          arrastando
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          type="file"
          accept=".xml,.pdf,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={onInputChange}
          disabled={status === "carregando"}
        />

        {status === "carregando" ? (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Processando arquivo...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium">Arraste o arquivo aqui</p>
            <p className="text-xs text-gray-400">ou clique para selecionar</p>
            <p className="text-xs text-gray-400">.xml · .pdf · .png · .jpg</p>
          </div>
        )}
      </label>

      {/* ── Erro ── */}
      {status === "erro" && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <span>⚠️</span>
          <span>{erro}</span>
        </div>
      )}

      {/* ── Aviso OCR ── */}
      {aviso && (
        <div className="flex gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
          <span>ℹ️</span>
          <span>{aviso}</span>
        </div>
      )}

      {/* ── Resultado ── */}
      {status === "sucesso" && nfe && (
        <div className="space-y-4">

          {/* Cabeçalho da nota */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CartaoInfo label="Número" valor={`${nfe.numero}-${nfe.serie}`} />
            <CartaoInfo label="Data Emissão" valor={formatarData(nfe.dataEmissao)} />
            <CartaoInfo
              label="Tipo"
              valor={nfe.tipoOperacao === "1" ? "Saída" : "Entrada"}
              destaque={nfe.tipoOperacao === "1" ? "blue" : "green"}
            />
            <CartaoInfo
              label="Total"
              valor={formatBRL(nfe.totais.valorNota)}
              destaque="purple"
            />
          </div>

          {/* Emitente */}
          <Secao titulo="Emitente">
            <Grade>
              <Campo label="CNPJ" valor={formatCNPJ(nfe.emitente.cnpj)} />
              <Campo label="Razão Social" valor={nfe.emitente.nome} />
              {nfe.emitente.nomeFantasia && (
                <Campo label="Nome Fantasia" valor={nfe.emitente.nomeFantasia} />
              )}
              <Campo
                label="Endereço"
                valor={`${nfe.emitente.logradouro}, ${nfe.emitente.numero} — ${nfe.emitente.cidade}/${nfe.emitente.uf}`}
              />
            </Grade>
          </Secao>

          {/* Destinatário */}
          <Secao titulo="Destinatário">
            <Grade>
              <Campo
                label={nfe.destinatario.cnpj ? "CNPJ" : "CPF"}
                valor={
                  nfe.destinatario.cnpj
                    ? formatCNPJ(nfe.destinatario.cnpj)
                    : formatCPF(nfe.destinatario.cpf ?? "")
                }
              />
              <Campo label="Nome" valor={nfe.destinatario.nome} />
              <Campo
                label="Endereço"
                valor={`${nfe.destinatario.logradouro}, ${nfe.destinatario.numero} — ${nfe.destinatario.cidade}/${nfe.destinatario.uf}`}
              />
            </Grade>
          </Secao>

          {/* Produtos */}
          <Secao titulo={`Produtos (${nfe.produtos.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Descrição</th>
                    <th className="pb-2 font-medium text-right">Qtd</th>
                    <th className="pb-2 font-medium text-right">Vlr Unit.</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {nfe.produtos.map((prod, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2 pr-4">
                        <p className="font-medium text-gray-900">{prod.descricao}</p>
                        <p className="text-xs text-gray-400">{prod.codigo} · CFOP {prod.cfop}</p>
                      </td>
                      <td className="py-2 text-right text-gray-600 whitespace-nowrap">
                        {prod.quantidade} {prod.unidade}
                      </td>
                      <td className="py-2 text-right text-gray-600 whitespace-nowrap">
                        {formatBRL(prod.valorUnitario)}
                      </td>
                      <td className="py-2 text-right font-medium text-gray-900 whitespace-nowrap">
                        {formatBRL(prod.valorTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Secao>

          {/* Totais */}
          <Secao titulo="Totais e Impostos">
            <Grade>
              {nfe.totais.valorICMS > 0 && (
                <Campo label="ICMS" valor={formatBRL(nfe.totais.valorICMS)} />
              )}
              {nfe.totais.valorIPI > 0 && (
                <Campo label="IPI" valor={formatBRL(nfe.totais.valorIPI)} />
              )}
              {nfe.totais.valorPIS > 0 && (
                <Campo label="PIS" valor={formatBRL(nfe.totais.valorPIS)} />
              )}
              {nfe.totais.valorCOFINS > 0 && (
                <Campo label="COFINS" valor={formatBRL(nfe.totais.valorCOFINS)} />
              )}
              {nfe.totais.valorFrete > 0 && (
                <Campo label="Frete" valor={formatBRL(nfe.totais.valorFrete)} />
              )}
              {nfe.totais.valorDesconto > 0 && (
                <Campo label="Desconto" valor={`- ${formatBRL(nfe.totais.valorDesconto)}`} />
              )}
              <Campo
                label="TOTAL DA NOTA"
                valor={formatBRL(nfe.totais.valorNota)}
              />
            </Grade>
          </Secao>

          {/* Pagamento */}
          {nfe.pagamento.detalhes.length > 0 && (
            <Secao titulo="Pagamento">
              <div className="flex flex-wrap gap-2">
                {nfe.pagamento.detalhes.map((det, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm"
                  >
                    <span className="text-gray-600">{det.formaPagamentoDescricao}</span>
                    <span className="font-medium text-gray-900">{formatBRL(det.valor)}</span>
                  </div>
                ))}
              </div>
            </Secao>
          )}

          {/* Chave de acesso */}
          {nfe.chave && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Chave de Acesso</p>
              <p className="text-xs font-mono text-gray-700 break-all">{nfe.chave}</p>
            </div>
          )}

          {/* Botão nova nota */}
          <button
            onClick={() => { setStatus("idle"); setNfe(null); }}
            className="w-full py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Carregar outra nota
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {titulo}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Grade({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
  );
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{valor || "—"}</p>
    </div>
  );
}

function CartaoInfo({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string;
  destaque?: "blue" | "green" | "purple";
}) {
  const cores = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
  };
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-base font-semibold mt-0.5 ${destaque ? cores[destaque] : "text-gray-900"}`}>
        {valor}
      </p>
    </div>
  );
}

// ─── Utilitários de formatação ────────────────────────────────────────────────

function formatCNPJ(cnpj: string): string {
  const n = cnpj.replace(/\D/g, "");
  if (n.length !== 14) return cnpj;
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
}

function formatCPF(cpf: string): string {
  const n = cpf.replace(/\D/g, "");
  if (n.length !== 11) return cpf;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

function formatarData(dataISO: string): string {
  if (!dataISO) return "—";
  try {
    return new Date(dataISO).toLocaleDateString("pt-BR");
  } catch {
    return dataISO.slice(0, 10);
  }
}