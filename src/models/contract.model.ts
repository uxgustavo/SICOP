export enum ContractStatus {
  VIGENTE = 'VIGENTE',
  RESCINDIDO = 'RESCINDIDO',
  FINALIZANDO = 'FINALIZANDO'
}

export interface Contract {
  id: string;
  number: string; // Ex: "124/2024"
  supplierName: string;
  status: ContractStatus;
  endDate: Date;
  
  // Financial data for future use
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
 * Even if status is VIGENTE, if days < 90 it might effectively be FINALIZANDO for UI purposes.
 */
export function getEffectiveStatus(contract: Contract, daysRemaining: number): ContractStatus {
  if (contract.status === ContractStatus.RESCINDIDO) {
    return ContractStatus.RESCINDIDO;
  }
  
  // Rule: Less than 90 days triggers "Finalizando" alert visual
  if (daysRemaining <= 90 && daysRemaining >= 0) {
    return ContractStatus.FINALIZANDO;
  }
  
  if (daysRemaining < 0) {
     // Could be expired, but we'll stick to provided statuses. 
     // If it's passed date and not rescinded, maybe it's still finalizing/expired.
     // For this UI, we treat < 0 as Finalizando/Alert or keep Vigente but with negative days.
     // Let's assume < 90 days logic covers it.
     return ContractStatus.FINALIZANDO; 
  }

  return ContractStatus.VIGENTE;
}