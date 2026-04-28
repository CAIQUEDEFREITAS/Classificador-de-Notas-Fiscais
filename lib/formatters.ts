// ─── Funções de formatação ────────────────────────────────────────────────────

/**
 * Formata um CNPJ: 12345678000199 → 12.345.678/0001-99
 */
export function formatCNPJ(cnpj: string): string {
  const n = cnpj.replace(/\D/g, "");
  if (n.length !== 14) return cnpj;
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
}

/**
 * Formata um CPF: 12345678901 → 123.456.789-01
 */
export function formatCPF(cpf: string): string {
  const n = cpf.replace(/\D/g, "");
  if (n.length !== 11) return cpf;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

/**
 * Formata uma data ISO para o formato brasileiro (dd/mm/aaaa).
 */
export function formatarData(dataISO: string): string {
  if (!dataISO) return "—";
  try {
    return new Date(dataISO).toLocaleDateString("pt-BR");
  } catch {
    return dataISO.slice(0, 10);
  }
}

/**
 * Formata um número como moeda brasileira (R$ 1.234,56).
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Normaliza uma data vinda de PDF (dd/mm/yyyy) ou ISO para formato ISO 8601.
 * Retorna string ISO ou string vazia se inválida.
 */
export function normalizarDataISO(data: string): string {
  if (!data) return "";

  // Já está em formato ISO (2024-01-15 ou 2024-01-15T...)
  if (/^\d{4}-\d{2}-\d{2}/.test(data)) {
    const parsed = new Date(data);
    return isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  }

  // Formato brasileiro dd/mm/yyyy
  const brMatch = data.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    const [, dia, mes, ano] = brMatch;
    const parsed = new Date(`${ano}-${mes}-${dia}T00:00:00`);
    return isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  }

  return "";
}
