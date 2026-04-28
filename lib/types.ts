// ─── Tipos compartilhados do sistema de NF-e ──────────────────────────────────

export interface ValidacoesNFe {
  chaveValida: boolean;
  cnpjEmitenteValido: boolean;
  cnpjDestinatarioValido: boolean;
  dataEmissaoValida: boolean;
  totaisCorretos: boolean;
  erros: string[];
  avisos: string[];
}

export interface NotaFiscalDB {
  id: number;
  chave_acesso: string;
  numero: string;
  serie: string;
  data_emissao: string;
  tipo_operacao: string;
  emitente_cnpj: string;
  emitente_nome: string;
  destinatario_cnpj: string;
  destinatario_cpf: string;
  destinatario_nome: string;
  valor_total: number;
  valor_icms: number;
  valor_ipi: number;
  valor_pis: number;
  valor_cofins: number;
  xml_bruto: string;
  validacoes: ValidacoesNFe | null;
  criado_em: string;
  atualizado_em: string;
}
