import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinancialService } from '../../services/financial.service';
import { 
  Transaction, 
  TransactionType, 
  getTransactionTypeLabel, 
  getTransactionTypeColorClass, 
  getTransactionIcon,
  getTransactionIconBgClass
} from '../../models/transaction.model';

@Component({
  selector: 'app-financial-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './financial-page.component.html'
})
export class FinancialPageComponent {
  public financialService = inject(FinancialService);

  // Signals
  searchQuery = signal('');
  activeTab = signal<'ALL' | 'PAYMENTS' | 'COMMITMENTS'>('ALL');

  // Helpers for Template
  getTypeLabel = getTransactionTypeLabel;
  getTypeClass = getTransactionTypeColorClass;
  getIcon = getTransactionIcon;
  getIconClass = getTransactionIconBgClass;

  // Logic
  filteredTransactions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const tab = this.activeTab();
    // Obtém transações do serviço (já filtradas pelo Contexto de Ano)
    const transactions = this.financialService.transactions();

    return transactions.filter(t => {
      // Tab Filter
      if (tab === 'PAYMENTS' && t.type !== TransactionType.LIQUIDATION) return false;
      if (tab === 'COMMITMENTS' && t.type !== TransactionType.COMMITMENT) return false;

      // Text Search
      if (!query) return true;
      return (
        t.description.toLowerCase().includes(query) ||
        t.contractId.toLowerCase().includes(query) ||
        t.commitmentId.toLowerCase().includes(query)
      );
    });
  });

  // Actions
  setTab(tab: 'ALL' | 'PAYMENTS' | 'COMMITMENTS') {
    this.activeTab.set(tab);
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }
}