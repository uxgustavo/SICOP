export enum ContractStatus {
  VIGENTE = 'VIGENTE',
  RESCINDIDO = 'RESCINDIDO',
  FINALIZANDO = 'FINALIZANDO'
}

export type TipoAditivo = 'PRAZO' | 'VALOR' | 'AMBOS';

export interface Aditivo {
  id: string;
  contratoId: string;
  tipo: TipoAditivo;
  acrescimoValor: number;
  novaDataFim?: Date;
}

export type TipoTransacao = 'EMPENHO' | 'PAGAMENTO' | 'CANCELAMENTO';

export interface TransacaoFinanceira {
  id: string;
  contratoId: string;
  tipo: TipoTransacao;
  valor: number;
  dataTransacao: Date;
  dotacaoCodigo: string;
}

export interface Contract {
  id: string;

  // Fields from Notion Architecture Map
  numeroContrato: string;
  cnpjContratada?: string; // Optional as not always available in legacy data
  nomeContratada: string;
  dataInicio: Date;
  dataFimOriginal: Date;
  valorAnualOriginal: number;
  status: ContractStatus;

  // Computed/Effective values (properties populated by the Adapter/Service logic)
  valorAtualizado?: number;
  dataFimVigente?: Date;

  // Relationship data (often loaded with the contract)
  aditivos?: Aditivo[];
  transacoes?: TransacaoFinanceira[];

  // Legacy/Compatibility fields (mapped to new fields)
  number: string;       // Alias for numeroContrato
  supplierName: string; // Alias for nomeContratada
  endDate: Date;        // Alias for dataFimVigente (effective end date)

  // Legacy financial fields (kept for backward compatibility, mapped to TransacaoFinanceira calculations if possible)
  valorTotal: number;
  saldoDotacao: number;
  saldoEmpenho: number;

  // Calculated properties (optional in interface, handled via helper or computed)
  daysRemaining?: number;
}

/**
 * Calculates the number of days between now and the end date.
 * Returns negative if past due.
 */
export function calculateDaysRemaining(endDate: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
  const today = new Date();
  // Reset time to midnight for accurate day calculation
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffDays = Math.round((end.getTime() - today.getTime()) / oneDay);
  return diffDays;
}

/**
 * Determines the effective status based on business rules.
 * Even if status is VIGENTE, if days < 120 it might effectively be FINALIZANDO for UI purposes.
 */
export function getEffectiveStatus(contract: Contract, daysRemaining: number): ContractStatus {
  if (contract.status === ContractStatus.RESCINDIDO) {
    return ContractStatus.RESCINDIDO;
  }

  // Rule: Less than 120 days triggers "Finalizando" alert visual (as per architecture map)
  if (daysRemaining <= 120 && daysRemaining >= 0) {
    return ContractStatus.FINALIZANDO;
  }

  if (daysRemaining < 0) {
    // For this UI, we treat < 0 as Finalizando/Alert or keep Vigente but with negative days.
    return ContractStatus.FINALIZANDO;
  }

  return ContractStatus.VIGENTE;
}