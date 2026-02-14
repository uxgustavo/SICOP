import { Injectable, signal, computed, inject } from '@angular/core';
import { Transaction, TransactionType } from '../models/transaction.model';
import { AppContextService } from './app-context.service';

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private appContext = inject(AppContextService);
  
  // Master Variable for Transactions (simulating API response)
  // Standardized with ContractService and BudgetService data
  // Renamed to _transactions to keep raw data private
  private _transactions = signal<Transaction[]>([
    // --- Lançamentos Vinculados ao Orçamento 02/2026 (Intelliway - Contrato 087/2025) ---
    {
      id: '1',
      description: 'Pagamento Fornecedor',
      contractId: '087/2025',
      commitmentId: '2025NE000195',
      date: new Date(2025, 11, 12),
      type: TransactionType.LIQUIDATION,
      amount: 196.14,
      department: 'FADEP',
      budgetDescription: '02/2026 - Intelliway Tecnologia'
    },
    {
      id: '2',
      description: 'Cancelamento Saldo',
      contractId: '087/2025',
      commitmentId: '2025NE000472',
      date: new Date(2025, 11, 12),
      type: TransactionType.CANCELLATION,
      amount: 43503.41,
      department: 'FADEP',
      budgetDescription: '02/2026 - Intelliway Tecnologia'
    },
    {
      id: 't4', // Migrado do BudgetService antigo
      description: 'Empenho Estimativo',
      contractId: '087/2025',
      commitmentId: '2026NE055',
      date: new Date(2026, 0, 10),
      type: TransactionType.COMMITMENT,
      amount: 50000.00,
      department: 'FADEP',
      budgetDescription: '02/2026 - Intelliway Tecnologia'
    },
    {
      id: 't5', // Migrado do BudgetService antigo
      description: 'Reforço de Dotação',
      contractId: '087/2025',
      commitmentId: 'N/A',
      date: new Date(2026, 1, 10),
      type: TransactionType.REINFORCEMENT,
      amount: 244078.40,
      department: 'FADEP',
      budgetDescription: '02/2026 - Intelliway Tecnologia'
    },

    // --- Lançamentos Vinculados ao Orçamento 01/2025 (MOL - Contrato 074/2025) ---
    {
      id: 't1', // Migrado do BudgetService antigo (Empenho Inicial)
      description: 'Empenho Inicial Global',
      contractId: '074/2025',
      commitmentId: '2025NE001',
      date: new Date(2025, 0, 15),
      type: TransactionType.COMMITMENT,
      amount: 92925.00,
      department: 'FADEP',
      budgetDescription: '01/2025 - MOL Mediação Online'
    },
    {
      id: '3',
      description: 'Reforço de Dotação',
      contractId: '074/2025',
      commitmentId: '2025NE000398',
      date: new Date(2025, 10, 27),
      type: TransactionType.REINFORCEMENT,
      amount: 23231.25,
      department: 'FADEP',
      budgetDescription: '01/2025 - MOL Mediação Online'
    },
    {
      id: '5',
      description: 'Pagamento Fornecedor',
      contractId: '074/2025',
      commitmentId: '2025NE000183',
      date: new Date(2025, 11, 2),
      type: TransactionType.LIQUIDATION,
      amount: 23231.25,
      department: 'FADEP',
      budgetDescription: '01/2025 - MOL Mediação Online'
    },
    {
      id: 't2',
      description: 'Pagamento Nota Fiscal 001',
      contractId: '074/2025',
      commitmentId: '2025NE001',
      date: new Date(2025, 1, 5),
      type: TransactionType.LIQUIDATION,
      amount: 40000.00,
      department: 'FADEP',
      budgetDescription: '01/2025 - MOL Mediação Online'
    },
    
    // --- Outros ---
    {
      id: '6',
      description: 'Empenho Inicial',
      contractId: '124/2024',
      commitmentId: '2025NE000183',
      date: new Date(2025, 6, 31),
      type: TransactionType.COMMITMENT,
      amount: 92925.00,
      department: 'FADEP',
      budgetDescription: '01/2025 - Outros' // Exemplo genérico
    }
  ]);

  // Reactive Computed Signal: Filters transactions by Global Fiscal Year
  transactions = computed(() => {
    const selectedYear = this.appContext.anoExercicio();
    const allTransactions = this._transactions();
    
    return allTransactions.filter(t => t.date.getFullYear() === selectedYear);
  });

  /**
   * Filter transactions by budget description
   * Used by Budget Page to show history
   */
  getTransactionsByBudget(budgetDescription: string): Transaction[] {
    return this.transactions().filter(t => t.budgetDescription === budgetDescription);
  }

  /**
   * Filter transactions by contract number (e.g., '074/2025')
   * Used by Contract Details Page
   */
  getTransactionsByContractNumber(contractNumber: string): Transaction[] {
    // Normalize comparison
    const target = contractNumber.trim().toLowerCase();
    return this.transactions().filter(t => t.contractId.toLowerCase() === target);
  }
}