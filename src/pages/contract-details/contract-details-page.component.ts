import { Component, inject, input, computed, signal, output } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ContractService } from '../../services/contract.service';
import { BudgetService } from '../../services/budget.service';
import { FinancialService } from '../../services/financial.service';
import { ContractStatus, calculateDaysRemaining, getEffectiveStatus } from '../../models/contract.model';
import { getTransactionTypeLabel, getTransactionTypeColorClass, getTransactionIcon, getTransactionIconBgClass } from '../../models/transaction.model';
import { getUnidadeBadgeClass } from '../../models/budget.model';

@Component({
  selector: 'app-contract-details-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './contract-details-page.component.html',
})
export class ContractDetailsPageComponent {
  private contractService = inject(ContractService);
  private budgetService = inject(BudgetService);
  private financialService = inject(FinancialService);

  // Inputs & Outputs
  contractId = input.required<string>();
  back = output<void>();

  // Active Tab State
  activeTab = signal<'OVERVIEW' | 'BUDGETS' | 'FINANCIAL'>('OVERVIEW');

  // Computed Contract
  contract = computed(() => {
    return this.contractService.getContractById(this.contractId());
  });

  // Computed Status Helpers
  daysRemaining = computed(() => {
    const c = this.contract();
    return c ? calculateDaysRemaining(c.endDate) : 0;
  });

  statusLabel = computed(() => {
    const c = this.contract();
    if (!c) return '---';
    return getEffectiveStatus(c, this.daysRemaining());
  });

  statusClass = computed(() => {
    const s = this.statusLabel();
    if (s === ContractStatus.RESCINDIDO) return 'bg-red-50 text-red-600 border-red-200';
    if (s === ContractStatus.FINALIZANDO) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-green-50 text-green-700 border-green-200';
  });

  // Computed Related Data
  budgets = computed(() => {
    return this.budgetService.getBudgetsByContractId(this.contractId());
  });

  transactions = computed(() => {
    const c = this.contract();
    if (!c) return [];
    return this.financialService.getTransactionsByContractNumber(c.number);
  });

  // Computed Financial Summaries
  financialSummary = computed(() => {
    const trans = this.transactions();
    
    // Sum Liquidations (Payments)
    const totalPaid = trans
      .filter(t => t.type === 'LIQUIDATION')
      .reduce((sum, t) => sum + t.amount, 0);
      
    // Sum Commitments (Empenhos)
    const totalCommitted = trans
      .filter(t => t.type === 'COMMITMENT')
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalPaid, totalCommitted };
  });

  // Helpers for Template
  getTypeLabel = getTransactionTypeLabel;
  getTypeClass = getTransactionTypeColorClass;
  getIcon = getTransactionIcon;
  getIconClass = getTransactionIconBgClass;
  getBadgeClass = getUnidadeBadgeClass;
}