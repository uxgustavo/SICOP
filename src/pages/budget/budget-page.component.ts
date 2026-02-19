import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';
import { ContractService } from '../../services/contract.service';
import { Dotacao, calcularSaldoDotacao, getUnidadeBadgeClass, UnidadeOrcamentaria } from '../../models/budget.model';
import { Transaction, getTransactionTypeLabel, getTransactionTypeColorClass, getTransactionIcon, getTransactionIconBgClass } from '../../models/transaction.model';

@Component({
  selector: 'app-budget-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, DecimalPipe, FormsModule],
  templateUrl: './budget-page.component.html'
})
export class BudgetPageComponent {
  private budgetService = inject(BudgetService);
  private contractService = inject(ContractService);

  // Layout State
  layoutMode = signal<'grid' | 'list'>('grid');

  // Search
  searchQuery = signal('');
  
  // Advanced Filter State
  isFilterPanelOpen = signal(false);
  filterUnit = signal<UnidadeOrcamentaria | 'ALL'>('ALL');
  filterNoBalance = signal<boolean>(false);
  filterMinBalance = signal<number | null>(null);

  // Selection State (Side Panel)
  selectedBudget = signal<Dotacao | null>(null);
  selectedBudgetHistory = signal<Transaction[]>([]);

  // Helpers
  calcSaldo = calcularSaldoDotacao;
  getBadgeClass = getUnidadeBadgeClass;

  // Transaction Helpers
  getTypeLabel = getTransactionTypeLabel;
  getTypeClass = getTransactionTypeColorClass;
  getIcon = getTransactionIcon;
  getIconClass = getTransactionIconBgClass;

  // Helper to get contract info
  getContract(id: string) {
    return this.contractService.getContractById(id);
  }

  // Computed Logic
  filteredDotacoes = computed(() => {
    const all = this.budgetService.dotacoes();
    const query = this.searchQuery().toLowerCase();
    
    // Filters
    const unit = this.filterUnit();
    const noBalance = this.filterNoBalance();
    const minBalance = this.filterMinBalance();

    return all.filter(d => {
      const saldo = calcularSaldoDotacao(d);
      const contract = this.getContract(d.contractId);
      const contractName = contract?.supplierName || '';

      // 1. Text Search
      const matchesSearch = !query || 
        d.descricao.toLowerCase().includes(query) ||
        contractName.toLowerCase().includes(query) ||
        d.linkSei.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 2. Unit Filter
      if (unit !== 'ALL' && d.unidadeOrcamentaria !== unit) return false;

      // 3. No Balance Filter (Strictly 0 or less)
      if (noBalance && saldo > 0) return false;

      // 4. Min Balance Filter (Upper limit / "Below X")
      // User asks for "saldo abaixo de determinado valor". 
      // If user enters 1000, we show items with saldo < 1000.
      if (minBalance !== null && saldo >= minBalance) return false;

      return true;
    });
  });

  // Actions
  setLayoutMode(mode: 'grid' | 'list') {
    this.layoutMode.set(mode);
  }

  toggleFilterPanel() {
    this.isFilterPanelOpen.update(v => !v);
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }
  
  clearFilters() {
    this.filterUnit.set('ALL');
    this.filterNoBalance.set(false);
    this.filterMinBalance.set(null);
    this.searchQuery.set('');
  }

  // Selection Logic
  openDetails(dotacao: Dotacao) {
    this.selectedBudget.set(dotacao);
    const history = this.budgetService.getHistoryForBudget(dotacao);
    this.selectedBudgetHistory.set(history);
  }

  closeDetails() {
    this.selectedBudget.set(null);
    this.selectedBudgetHistory.set([]);
  }

  getBalanceColor(dotacao: Dotacao): string {
    const saldo = this.calcSaldo(dotacao);
    if (saldo <= 0) return 'text-red-600 dark:text-red-400 font-bold';
    return 'text-green-600 dark:text-green-400 font-bold';
  }
}