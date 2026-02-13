import { Component, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  // Signals
  searchQuery = signal('');
  activeTab = signal<'ALL' | 'PAYMENTS' | 'COMMITMENTS'>('ALL');

  // Helpers for Template
  getTypeLabel = getTransactionTypeLabel;
  getTypeClass = getTransactionTypeColorClass;
  getIcon = getTransactionIcon;
  getIconClass = getTransactionIconBgClass;

  // Mock Data (Matching the image exactly)
  mockTransactions: Transaction[] = [
    {
      id: '1',
      description: 'Pagamento Fornecedor',
      contractId: '087/2024',
      commitmentId: '2025NE000195',
      date: new Date(2025, 11, 12), // 12/12/2025
      type: TransactionType.LIQUIDATION,
      amount: 196.14,
      department: 'FADEP'
    },
    {
      id: '2',
      description: 'Cancelamento Saldo',
      contractId: '087/2024',
      commitmentId: '2025NE000472',
      date: new Date(2025, 11, 12), // 12/12/2025
      type: TransactionType.CANCELLATION,
      amount: 43503.41,
      department: 'FADEP'
    },
    {
      id: '3',
      description: 'Empenho Inicial',
      contractId: '124/2024',
      commitmentId: '2025NE000183',
      date: new Date(2025, 6, 31), // 31/07/2025
      type: TransactionType.COMMITMENT,
      amount: 92925.00,
      department: 'FADEP'
    },
    {
      id: '4',
      description: 'Reforço de Dotação',
      contractId: '074/2024',
      commitmentId: '2025NE000398',
      date: new Date(2025, 10, 27), // 27/11/2025
      type: TransactionType.REINFORCEMENT,
      amount: 23231.25,
      department: 'FADEP'
    },
    {
      id: '5',
      description: 'Pagamento Fornecedor',
      contractId: '074/2024',
      commitmentId: '2025NE000183',
      date: new Date(2025, 11, 2), // 02/12/2025
      type: TransactionType.LIQUIDATION,
      amount: 23231.25,
      department: 'FADEP'
    }
  ];

  // Logic
  filteredTransactions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const tab = this.activeTab();

    return this.mockTransactions.filter(t => {
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