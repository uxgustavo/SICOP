export type UnidadeOrcamentaria = 'FADEP' | 'DEFENSORIA';

export interface Dotacao {
  id: string;
  descricao: string; // Ex: "Dotação 2026 - MOL"
  linkSei: string;
  cnpj: string; // Novo campo
  data: Date;
  valorTotal: number;
  valorUtilizado: number;
  unidadeOrcamentaria: UnidadeOrcamentaria;
  contratoVinculado: string; // Nome do contrato para exibição
}

/**
 * Calcula o saldo disponível da dotação.
 */
export function calcularSaldoDotacao(dotacao: Dotacao): number {
  return dotacao.valorTotal - dotacao.valorUtilizado;
}

/**
 * Retorna classes CSS para badges de unidade orçamentária
 */
export function getUnidadeBadgeClass(unidade: UnidadeOrcamentaria): string {
  switch (unidade) {
    case 'FADEP':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    case 'DEFENSORIA':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
}