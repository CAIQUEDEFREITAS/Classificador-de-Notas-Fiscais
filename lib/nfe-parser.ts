import { XMLParser } from "fast-xml-parser";

export interface NFeProduto {
  codigo: string;
  descricao: string;
  quantidade: string;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  cfop: string;
}

export interface NFeTotais {
  valorNota: number;
  valorICMS: number;
  valorIPI: number;
  valorPIS: number;
  valorCOFINS: number;
  valorFrete: number;
  valorDesconto: number;
}

export interface NFePagamentoDetalhe {
  formaPagamento: string;
  formaPagamentoDescricao: string;
  valor: number;
}

export interface NFeDestinatario {
  cnpj?: string;
  cpf?: string;
  nome: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface NFeEmitente {
  cnpj: string;
  nome: string;
  nomeFantasia?: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface NFe {
  chave: string;
  numero: string;
  serie: string;
  dataEmissao: string;
  tipoOperacao: string;
  emitente: NFeEmitente;
  destinatario: NFeDestinatario;
  produtos: NFeProduto[];
  totais: NFeTotais;
  pagamento: { detalhes: NFePagamentoDetalhe[] };
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  parseTagValue: false,
});

function first<T>(value: T | T[] | undefined | null): T | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

function arrayify<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function parseNumber(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0;
  const number = Number(String(value).replace(/[^0-9.,-]/g, "").replace(/,/g, "."));
  return Number.isFinite(number) ? number : 0;
}

function parseText(value: unknown): string {
  return value === undefined || value === null ? "" : String(value).trim();
}

function getRawNfe(parsed: any): any {
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.nfeProc?.NFe) return parsed.nfeProc.NFe;
  if (parsed.NFe) return parsed.NFe;
  if (parsed.nfe) return parsed.nfe;
  return parsed;
}

function getInfNFe(rawNfe: any): any {
  if (!rawNfe || typeof rawNfe !== "object") return null;
  return rawNfe.infNFe ?? rawNfe.infnfe ?? rawNfe;
}

export function parseNfeXml(xml: string): NFe {
  const parsed = parser.parse(xml);
  const rawNfe = getRawNfe(parsed);
  const infNFe = getInfNFe(rawNfe);

  if (!infNFe || typeof infNFe !== "object") {
    throw new Error("XML inválido ou sem NF-e reconhecível.");
  }

  const ide = infNFe.ide ?? {};
  const emit = infNFe.emit ?? {};
  const dest = infNFe.dest ?? {};
  const total = infNFe.total ?? {};
  const pag = infNFe.pag ?? {};
  const dets = arrayify(infNFe.det ?? []);

  const produtos = dets.map((det): NFeProduto => {
    const prod = det.prod ?? {};
    return {
      codigo: parseText(prod.cProd ?? prod.cprod),
      descricao: parseText(prod.xProd ?? prod.xprod),
      quantidade: parseText(prod.qCom ?? prod.qcom ?? ""),
      unidade: parseText(prod.uCom ?? prod.ucom ?? ""),
      valorUnitario: parseNumber(prod.vUnCom ?? prod.vuncom ?? 0),
      valorTotal: parseNumber(prod.vProd ?? prod.vprod ?? 0),
      cfop: parseText(prod.CFOP ?? prod.cfop ?? ""),
    };
  });

  const pagamentoDetalhes = arrayify(pag.detPag ?? pag.detpag ?? []).map((item) => ({
    formaPagamento: parseText(item.tPag ?? item.tpag ?? ""),
    formaPagamentoDescricao: parseText(item.xPag ?? item.xpag ?? item.tPag ?? item.tpag ?? ""),
    valor: parseNumber(item.vPag ?? item.vpag ?? 0),
  }));

  return {
    chave: parseText(rawNfe?.infNFe?.Id ?? infNFe?.Id ?? rawNfe?.infNFe?.id ?? "").replace(/^NFe/i, ""),
    numero: parseText(ide.nNF ?? ide.nnf ?? ""),
    serie: parseText(ide.serie ?? ide.Serie ?? ""),
    dataEmissao:
      parseText(ide.dhEmi ?? ide.dhSaiEnt ?? ide.dEmi ?? ide.demi ?? "") || "",
    tipoOperacao: parseText(ide.tpNF ?? ide.tpNf ?? ""),
    emitente: {
      cnpj: parseText(emit.CNPJ ?? emit.cnpj ?? ""),
      nome: parseText(emit.xNome ?? emit.xnome ?? ""),
      nomeFantasia: parseText(emit.xFant ?? emit.xfant ?? ""),
      logradouro: parseText(emit.enderEmit?.xLgr ?? emit.enderEmit?.xlgr ?? emit.enderEmit?.xLgr ?? ""),
      numero: parseText(emit.enderEmit?.nro ?? emit.enderEmit?.nro ?? ""),
      bairro: parseText(emit.enderEmit?.xBairro ?? emit.enderEmit?.xbairro ?? ""),
      cidade: parseText(emit.enderEmit?.xMun ?? emit.enderEmit?.xmun ?? ""),
      uf: parseText(emit.enderEmit?.UF ?? emit.enderEmit?.uf ?? ""),
    },
    destinatario: {
      cnpj: parseText(dest.CNPJ ?? dest.cnpj ?? ""),
      cpf: parseText(dest.CPF ?? dest.cpf ?? ""),
      nome: parseText(dest.xNome ?? dest.xnome ?? ""),
      logradouro: parseText(dest.enderDest?.xLgr ?? dest.enderDest?.xlgr ?? ""),
      numero: parseText(dest.enderDest?.nro ?? ""),
      bairro: parseText(dest.enderDest?.xBairro ?? dest.enderDest?.xbairro ?? ""),
      cidade: parseText(dest.enderDest?.xMun ?? dest.enderDest?.xmun ?? ""),
      uf: parseText(dest.enderDest?.UF ?? dest.enderDest?.uf ?? ""),
    },
    produtos,
    totais: {
      valorNota: parseNumber(total.ICMSTot?.vNF ?? total.icmsTot?.vnf ?? total.vNF ?? total.vnf ?? 0),
      valorICMS: parseNumber(total.ICMSTot?.vICMS ?? total.icmsTot?.vicms ?? 0),
      valorIPI: parseNumber(total.ICMSTot?.vIPI ?? total.icmsTot?.vipi ?? 0),
      valorPIS: parseNumber(total.ICMSTot?.vPIS ?? total.icmsTot?.vpis ?? 0),
      valorCOFINS: parseNumber(total.ICMSTot?.vCOFINS ?? total.icmsTot?.vcofins ?? 0),
      valorFrete: parseNumber(total.ICMSTot?.vFrete ?? total.icmsTot?.vfrete ?? 0),
      valorDesconto: parseNumber(total.ICMSTot?.vDesc ?? total.icmsTot?.vdesc ?? 0),
    },
    pagamento: {
      detalhes: pagamentoDetalhes,
    },
  };
}

function normalizePdfText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\t]+/g, " ")
    .replace(/·/g, " ")
    .replace(/ +/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function matchFirst(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return "";
}

function parseMoneyFromText(value: string): number {
  return parseNumber(value.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(/,/g, "."));
}

export function parseNfePdfText(text: string): NFe {
  const normalized = normalizePdfText(text);
  const lines = normalized.split(/\n|\r/).map((line) => line.trim()).filter(Boolean);

  const chave = matchFirst(normalized, [/(\d{44})/]);
  const numero = matchFirst(normalized, [/nNF[:\s]*(\d+)/i, /Número da Nota[:\s]*(\d+)/i]);
  const serie = matchFirst(normalized, [/serie[:\s]*(\d+)/i, /Série[:\s]*(\d+)/i]);
  const dataEmissao = matchFirst(normalized, [/([0-3]\d\/[01]\d\/[12]\d{3})/]);
  const tipoOperacao = /Sa[ií]da/i.test(normalized) ? "1" : /Entrada/i.test(normalized) ? "0" : "";
  const emitenteCNPJ = matchFirst(normalized, [/Emitente[\s\S]{0,120}?CNPJ[:\s]*([0-9.\/\-]+)/i, /CNPJ[:\s]*([0-9.\/\-]+)(?=.*?IE|.*?Inscrição Estadual|.*?xNome)/i, /CNPJ[:\s]*([0-9.\/\-]+)/i]);
  const emitenteNome = matchFirst(normalized, [/Emitente[:\s]*([^0-9]{3,})/i, /xNome[:\s]*([^0-9]{3,})/i, /CNPJ[:\s]*[0-9.\/\-]+\s+([^0-9]{3,})/i]);
  const destinatarioCNPJ = matchFirst(normalized, [/Destinat[aá]rio[\s\S]{0,120}?CNPJ[:\s]*([0-9.\/\-]+)/i, /CNPJ[:\s]*([0-9.\/\-]+)(?=.*?Destinat[aá]rio)/i]);
  const destinatarioCPF = matchFirst(normalized, [/Destinat[aá]rio[\s\S]{0,120}?CPF[:\s]*([0-9.\-]+)/i, /CPF[:\s]*([0-9.\-]+)(?=.*?Destinat[aá]rio)/i]);
  const destinatarioNome = matchFirst(normalized, [/Destinat[aá]rio[:\s]*([^0-9]{3,})/i, /xNome[:\s]*([^0-9]{3,})/i]);

  const valorNota = parseMoneyFromText(matchFirst(normalized, [/Valor Total[:\s]*R\$?\s*([0-9.,-]+)/i, /Total da Nota[:\s]*R\$?\s*([0-9.,-]+)/i, /vNF[:\s]*([0-9.,-]+)/i]));
  const valorICMS = parseMoneyFromText(matchFirst(normalized, [/ICMS[:\s]*R\$?\s*([0-9.,-]+)/i, /vICMS[:\s]*([0-9.,-]+)/i]));
  const valorIPI = parseMoneyFromText(matchFirst(normalized, [/IPI[:\s]*R\$?\s*([0-9.,-]+)/i, /vIPI[:\s]*([0-9.,-]+)/i]));
  const valorPIS = parseMoneyFromText(matchFirst(normalized, [/PIS[:\s]*R\$?\s*([0-9.,-]+)/i, /vPIS[:\s]*([0-9.,-]+)/i]));
  const valorCOFINS = parseMoneyFromText(matchFirst(normalized, [/COFINS[:\s]*R\$?\s*([0-9.,-]+)/i, /vCOFINS[:\s]*([0-9.,-]+)/i]));
  const valorFrete = parseMoneyFromText(matchFirst(normalized, [/Frete[:\s]*R\$?\s*([0-9.,-]+)/i, /vFrete[:\s]*([0-9.,-]+)/i]));
  const valorDesconto = parseMoneyFromText(matchFirst(normalized, [/Desconto[:\s]*R\$?\s*([0-9.,-]+)/i, /vDesc[:\s]*([0-9.,-]+)/i]));

  const produtos: NFeProduto[] = [];
  for (const line of lines) {
    const match = line.match(/^(.+?)\s+(\d+[.,]?\d*)\s+R?\$?\s*([0-9.,-]+)\s+R?\$?\s*([0-9.,-]+)$/);
    if (match) {
      produtos.push({
        codigo: "",
        descricao: match[1].trim(),
        quantidade: match[2].replace(/,/g, "."),
        unidade: "",
        valorUnitario: parseMoneyFromText(match[3]),
        valorTotal: parseMoneyFromText(match[4]),
        cfop: "",
      });
    }
  }

  if (produtos.length === 0) {
    produtos.push({
      codigo: "",
      descricao: "Produtos extraídos do PDF podem não estar completos",
      quantidade: "",
      unidade: "",
      valorUnitario: 0,
      valorTotal: valorNota,
      cfop: "",
    });
  }

  return {
    chave,
    numero,
    serie,
    dataEmissao: dataEmissao || "",
    tipoOperacao: tipoOperacao || "",
    emitente: {
      cnpj: emitenteCNPJ,
      nome: emitenteNome || "",
      nomeFantasia: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "",
      uf: "",
    },
    destinatario: {
      cnpj: destinatarioCNPJ,
      cpf: destinatarioCPF,
      nome: destinatarioNome || "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "",
      uf: "",
    },
    produtos,
    totais: {
      valorNota,
      valorICMS,
      valorIPI,
      valorPIS,
      valorCOFINS,
      valorFrete,
      valorDesconto,
    },
    pagamento: {
      detalhes: [],
    },
  };
}

// Re-exporta formatBRL do módulo centralizado para manter compatibilidade
export { formatBRL } from "@/lib/formatters";
