export enum ContractStatus {
  VIGENTE = 'VIGENTE',
  RESCINDIDO = 'RESCINDIDO',
  FINALIZANDO = 'FINALIZANDO'
}

export type TipoAditivo = 'ALTERACAO' | 'PRORROGACAO';

export interface Aditivo {
  id?: string;
  numero_contrato: string;
  numero_aditivo: string;
  tipo: TipoAditivo;
  data_assinatura?: Date;
  nova_vigencia?: Date;
  valor_aditivo?: number;
}

export interface Dotacao {
  id?: string;
  dotacao: string;
  numero_contrato: string;
  unid_gestora: string;
  valor_dotacao: number;
}

export interface Contract {
  id?: string;
  contrato: string;
  contratada: string;
  data_inicio: Date;
  data_fim: Date;
  status: ContractStatus;
  valor_anual: number;
  setor_id?: string;
  objeto?: string;

  // Computed/Relationship properties
  aditivos?: Aditivo[];
  dotacoes?: Dotacao[];

  // Computed values
  daysRemaining?: number;
  statusEfetivo?: ContractStatus;

  // Legacy/Compatibility properties to prevent breaking UI components
  number?: string;
  supplierName?: string;
  endDate?: Date;
  valorTotal?: number;
}

/**
 * Calculates the number of days between now and the end date.
 * Returns negative if past due.
 */
export function calculateDaysRemaining(endDate: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffDays = Math.round((end.getTime() - today.getTime()) / oneDay);
  return diffDays;
}

/**
 * Determines the effective status based on business rules.
 * Rule: Contracts with less than 90 days remaining are shown as FINALIZANDO.
 */
export function getEffectiveStatus(contract: Contract, daysRemaining: number): ContractStatus {
  if (contract.status === ContractStatus.RESCINDIDO) {
    return ContractStatus.RESCINDIDO;
  }

  // Rule: Less than 90 days triggers "Finalizando" alert visual
  if (daysRemaining <= 90) {
    return ContractStatus.FINALIZANDO;
  }

  return ContractStatus.VIGENTE;
}