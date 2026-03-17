/**
 * @fileoverview Modelo de dados de Contratos do SICOP.
 *
 * As interfaces refletem diretamente as colunas do banco de dados Supabase.
 * Propriedades computadas (`daysRemaining`, `statusEfetivo`) são calculadas
 * uma única vez no mapper do service e consumidas como leitura pelos componentes.
 */

// ─── Result Pattern ──────────────────────────────────────────────────────────

/**
 * Padrão de retorno tipado para operações assíncronas.
 * Elimina try/catch espalhados nos componentes.
 */
export interface Result<T> {
  data: T | null;
  error: string | null;
}

// ─── Enums & Types ───────────────────────────────────────────────────────────

export enum ContractStatus {
  VIGENTE = 'VIGENTE',
  RESCINDIDO = 'RESCINDIDO',
  FINALIZANDO = 'FINALIZANDO'
}

export type TipoAditivo = 'ALTERACAO' | 'PRORROGACAO';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Aditivo {
  id?: string;
  contract_id: string;
  numero_aditivo: string;
  tipo: TipoAditivo;
  data_assinatura?: Date;
  nova_vigencia?: Date;
  valor_aditivo?: number;
}



export interface Contract {
  id: string;
  contrato: string;
  contratada: string;
  data_inicio: Date;
  data_fim: Date;
  valor_anual: number;
  status: ContractStatus;
  setor_id: string;
  objeto: string;
  data_fim_efetiva?: Date;
  dias_restantes?: number;
  status_efetivo?: ContractStatus;
}

// ─── Funções Utilitárias ─────────────────────────────────────────────────────

/**
 * Calcula a quantidade de dias entre hoje e a data de término.
 *
 * @param dataFim - Data de término da vigência do contrato.
 * @returns Número de dias restantes. Negativo se o contrato já venceu.
 *
 * @example
 * ```ts
 * const dias = calculateDaysRemaining(new Date('2026-06-15'));
 * // Se hoje for 2026-03-05 → retorna ~102
 * ```
 */
export function calculateDaysRemaining(dataFim: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(dataFim);
  end.setHours(0, 0, 0, 0);

  return Math.round((end.getTime() - today.getTime()) / oneDay);
}

/**
 * Determina o status efetivo do contrato conforme regras de negócio.
 *
 * **Regra de Negócio — Gatilho de 90 dias:**
 * Contratos vigentes cujo término é ≤ 90 dias recebem o status visual
 * `FINALIZANDO` para alertar a equipe sobre a necessidade de renovação
 * ou nova licitação. Contratos rescindidos mantêm seu status original
 * independentemente dos dias restantes.
 *
 * @param contract - Contrato a ser avaliado.
 * @param daysRemaining - Dias restantes até o término (pré-calculado).
 * @returns O status efetivo para exibição na UI.
 */
export function getEffectiveStatus(contract: Pick<Contract, 'status'>, daysRemaining: number): ContractStatus {
  if (contract.status === ContractStatus.RESCINDIDO) {
    return ContractStatus.RESCINDIDO;
  }

  if (daysRemaining <= 90) {
    return ContractStatus.FINALIZANDO;
  }

  return ContractStatus.VIGENTE;
}