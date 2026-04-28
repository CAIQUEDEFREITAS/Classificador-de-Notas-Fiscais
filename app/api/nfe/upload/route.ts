import { NextResponse } from "next/server";
import { parseNfeXml, parseNfePdfText } from "@/lib/nfe-parser";
import type { NFe } from "@/lib/nfe-parser";
import type { ValidacoesNFe } from "@/lib/types";
import { validarCNPJ, validarCPF, validarChaveAcesso } from "@/lib/validators";
import { normalizarDataISO } from "@/lib/formatters";
import { getSupabase } from "@/lib/supabase";

// Tamanho máximo de arquivo: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File)) {
    return NextResponse.json(
      { ok: false, erro: "Nenhum arquivo enviado. Faça upload de um XML ou PDF de NF-e." },
      { status: 400 }
    );
  }

  // Validação de tamanho de arquivo
  if (arquivo.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { ok: false, erro: "Arquivo muito grande. Tamanho máximo: 10 MB." },
      { status: 413 }
    );
  }

  const nomeArquivo = arquivo.name.toLowerCase();
  const isXml = arquivo.type.includes("xml") || nomeArquivo.endsWith(".xml");
  const isPdf = arquivo.type.includes("pdf") || nomeArquivo.endsWith(".pdf");

  if (!isXml && !isPdf) {
    return NextResponse.json(
      {
        ok: false,
        erro: "Este endpoint aceita apenas arquivos XML ou PDF de NF-e.",
      },
      { status: 415 }
    );
  }

  let dados: NFe;
  let textoBruto = "";
  let aviso = "";
  const fonte = isPdf ? "pdf" : "xml";

  try {
    if (isXml) {
      const xml = await arquivo.text();
      textoBruto = xml;
      dados = parseNfeXml(xml);
    } else {
      // Importação dinâmica para evitar erro de ESM/CJS no Next.js
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require("pdf-parse");
      const buffer = Buffer.from(await arquivo.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      const texto = pdfData.text ?? "";
      textoBruto = texto;

      if (/<?xml|<nfeProc|<NFe/i.test(texto)) {
        dados = parseNfeXml(texto);
        aviso = "PDF contém XML embutido e foi convertido como XML.";
      } else {
        dados = parseNfePdfText(texto);
        aviso = "PDF processado por extração de texto; verifique campos críticos.";
      }
    }

    const validacoes = validarNfe(dados);
    const salvo = await salvarNfe(dados, textoBruto, validacoes);

    return NextResponse.json({
      ok: true,
      dados: { ...dados, textoBruto, aviso, fonte },
      validacoes,
      salvo,
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro ao analisar o arquivo.";
    return NextResponse.json({ ok: false, erro: mensagem }, { status: 422 });
  }
}

// ─── Validações fiscais específicas para contabilidade ────────────────────────

function validarNfe(nfe: NFe): ValidacoesNFe {
  const validacoes: ValidacoesNFe = {
    chaveValida: false,
    cnpjEmitenteValido: false,
    cnpjDestinatarioValido: false,
    dataEmissaoValida: false,
    totaisCorretos: false,
    erros: [],
    avisos: [],
  };

  // Validação da chave de acesso (44 dígitos)
  if (validarChaveAcesso(nfe.chave)) {
    validacoes.chaveValida = true;
  } else {
    validacoes.erros.push("Chave de acesso inválida");
  }

  // Validação CNPJ emitente
  if (nfe.emitente.cnpj && validarCNPJ(nfe.emitente.cnpj)) {
    validacoes.cnpjEmitenteValido = true;
  } else {
    validacoes.erros.push("CNPJ do emitente inválido");
  }

  // Validação CNPJ/CPF destinatário
  if (nfe.destinatario.cnpj && validarCNPJ(nfe.destinatario.cnpj)) {
    validacoes.cnpjDestinatarioValido = true;
  } else if (nfe.destinatario.cpf && validarCPF(nfe.destinatario.cpf)) {
    validacoes.cnpjDestinatarioValido = true;
  } else {
    validacoes.erros.push("CPF/CNPJ do destinatário inválido");
  }

  // Validação data de emissão
  if (nfe.dataEmissao) {
    const dataISO = normalizarDataISO(nfe.dataEmissao);
    if (dataISO) {
      const data = new Date(dataISO);
      const hoje = new Date();
      const umAnoAtras = new Date();
      umAnoAtras.setFullYear(hoje.getFullYear() - 1);

      if (data >= umAnoAtras && data <= hoje) {
        validacoes.dataEmissaoValida = true;
      } else {
        validacoes.avisos.push("Data de emissão fora do período esperado (último ano)");
      }
    } else {
      validacoes.avisos.push("Data de emissão não pôde ser interpretada");
    }
  }

  // Validação totais — considera frete, desconto, IPI
  const somaProdutos = nfe.produtos.reduce(
    (total, prod) => total + (prod.valorTotal || 0),
    0
  );
  const totalNota = nfe.totais.valorNota || 0;
  const totalCalculado =
    somaProdutos +
    (nfe.totais.valorFrete || 0) +
    (nfe.totais.valorIPI || 0) -
    (nfe.totais.valorDesconto || 0);

  // Tolerância de R$ 0,10 para arredondamentos
  if (Math.abs(totalCalculado - totalNota) < 0.10) {
    validacoes.totaisCorretos = true;
  } else {
    validacoes.erros.push(
      `Totais não conferem: calculado ${totalCalculado.toFixed(2)} ≠ nota ${totalNota.toFixed(2)}`
    );
  }

  return validacoes;
}

// ─── Salvar NF-e no Supabase (com upsert para evitar duplicatas) ──────────────

async function salvarNfe(
  dados: NFe,
  xmlBruto: string,
  validacoes: ValidacoesNFe
): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    // Normalizar data antes de salvar
    const dataEmissaoISO = normalizarDataISO(dados.dataEmissao) || null;

    const registro = {
      chave_acesso: dados.chave || null,
      numero: dados.numero,
      serie: dados.serie,
      data_emissao: dataEmissaoISO,
      tipo_operacao: dados.tipoOperacao,
      emitente_cnpj: dados.emitente.cnpj,
      emitente_nome: dados.emitente.nome,
      destinatario_cnpj: dados.destinatario.cnpj,
      destinatario_cpf: dados.destinatario.cpf,
      destinatario_nome: dados.destinatario.nome,
      valor_total: dados.totais.valorNota,
      valor_icms: dados.totais.valorICMS,
      valor_ipi: dados.totais.valorIPI,
      valor_pis: dados.totais.valorPIS,
      valor_cofins: dados.totais.valorCOFINS,
      xml_bruto: xmlBruto,
      validacoes: validacoes,
      atualizado_em: new Date().toISOString(),
    };

    // Usar upsert para evitar erro em notas duplicadas (chave_acesso UNIQUE)
    if (dados.chave) {
      const { error } = await supabase
        .from("notas_fiscais")
        .upsert(registro, { onConflict: "chave_acesso" });

      if (error) {
        console.error("Erro ao salvar NF-e:", error);
        return false;
      }
    } else {
      // Sem chave de acesso (ex: PDF), faz insert normal
      const { error } = await supabase
        .from("notas_fiscais")
        .insert({ ...registro, criado_em: new Date().toISOString() });

      if (error) {
        console.error("Erro ao salvar NF-e:", error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Erro ao salvar NF-e:", error);
    return false;
  }
}
