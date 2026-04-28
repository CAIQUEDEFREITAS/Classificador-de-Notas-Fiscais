// ─── Funções de validação fiscal ──────────────────────────────────────────────

/**
 * Calcula o dígito verificador para CNPJ/CPF.
 */
function calcularDigito(str: string, pesos: number[]): number {
  let soma = 0;
  for (let i = 0; i < str.length; i++) {
    soma += parseInt(str[i]) * pesos[i];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Valida um CNPJ (14 dígitos) usando o algoritmo oficial da Receita Federal.
 */
export function validarCNPJ(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/\D/g, "");
  if (cnpjLimpo.length !== 14) return false;

  // Rejeitar CNPJs com todos os dígitos iguais (ex: 11.111.111/1111-11)
  if (/^(\d)\1+$/.test(cnpjLimpo)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digito1 = calcularDigito(cnpjLimpo.substring(0, 12), pesos1);
  const digito2 = calcularDigito(cnpjLimpo.substring(0, 13), pesos2);

  return (
    digito1 === parseInt(cnpjLimpo[12]) &&
    digito2 === parseInt(cnpjLimpo[13])
  );
}

/**
 * Valida um CPF (11 dígitos) usando o algoritmo oficial da Receita Federal.
 */
export function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, "");
  if (cpfLimpo.length !== 11) return false;

  // Rejeitar CPFs com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1+$/.test(cpfLimpo)) return false;

  const pesos1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  const digito1 = calcularDigito(cpfLimpo.substring(0, 9), pesos1);
  const digito2 = calcularDigito(cpfLimpo.substring(0, 10), pesos2);

  return (
    digito1 === parseInt(cpfLimpo[9]) &&
    digito2 === parseInt(cpfLimpo[10])
  );
}

/**
 * Valida a chave de acesso de uma NF-e (deve conter exatamente 44 dígitos numéricos).
 */
export function validarChaveAcesso(chave: string): boolean {
  if (!chave) return false;
  const limpa = chave.replace(/\D/g, "");
  return limpa.length === 44;
}
