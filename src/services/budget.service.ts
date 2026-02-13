import { Injectable, signal, inject } from '@angular/core';
import { Dotacao } from '../models/budget.model';
import { Transaction, TransactionType } from '../models/transaction.model';
import { ContractService } from './contract.service';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  
  // Link to budgets via IDs defined in ContractService
  // Contract ID 3 -> MOL
  // Contract ID 2 -> Intelliway
  // Contract ID 9 -> Leistung
  // Contract ID 10 -> DB3

  dotacoes = signal<Dotacao[]>([
    {
      id: '1',
      descricao: '01/2025 - MOL Mediação Online',
      linkSei: '0000949.110000931.0.2025',
      cnpj: '23.506.000/0001-50',
      data: new Date(2025, 0, 15),
      valorTotal: 92925.00,
      valorUtilizado: 92925.00, 
      unidadeOrcamentaria: 'FADEP',
      contractId: '3' 
    },
    {
      id: '2',
      descricao: '02/2026 - Intelliway Tecnologia',
      linkSei: '0000950.110000932.0.2026',
      cnpj: '12.345.678/0001-90',
      data: new Date(2026, 0, 10),
      valorTotal: 294078.40,
      valorUtilizado: 50000.00,
      unidadeOrcamentaria: 'FADEP',
      contractId: '2'
    },
    {
      id: '3',
      descricao: '03/2026 - Leistung Equipamentos',
      linkSei: '0000951.110000933.0.2026',
      cnpj: '98.765.432/0001-10',
      data: new Date(2026, 1, 20),
      valorTotal: 272000.00,
      valorUtilizado: 120000.00,
      unidadeOrcamentaria: 'DEFENSORIA',
      contractId: '9'
    },
    {
      id: '4',
      descricao: '04/2026 - DB3 Telecom',
      linkSei: '0000952.110000934.0.2026',
      cnpj: '11.222.333/0001-44',
      data: new Date(2026, 2, 5),
      valorTotal: 895815.00,
      valorUtilizado: 0.00, 
      unidadeOrcamentaria: 'DEFENSORIA',
      contractId: '10'
    }
  ]);

  /**
   * Retorna o histórico de transações simulado para uma dotação específica
   */
  getHistoryForBudget(budget: Dotacao): Transaction[] {
    const baseDate = new Date(budget.data);
    
    if (budget.id === '1') {
      return [
        {
          id: 't1',
          description: 'Empenho Inicial Global',
          contractId: '074/2025',
          commitmentId: '2025NE001',
          date: baseDate,
          type: TransactionType.COMMITMENT,
          amount: 92925.00,
          department: 'FADEP',
          budgetDescription: budget.descricao
        },
        {
          id: 't2',
          description: 'Pagamento Nota Fiscal 001',
          contractId: '074/2025',
          commitmentId: '2025NE001',
          date: new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 5),
          type: TransactionType.LIQUIDATION,
          amount: 40000.00,
          department: 'FADEP',
          budgetDescription: budget.descricao
        },
        {
          id: 't3',
          description: 'Pagamento Nota Fiscal 002',
          contractId: '074/2025',
          commitmentId: '2025NE001',
          date: new Date(baseDate.getFullYear(), baseDate.getMonth() + 2, 5),
          type: TransactionType.LIQUIDATION,
          amount: 52925.00,
          department: 'FADEP',
          budgetDescription: budget.descricao
        }
      ];
    } else if (budget.id === '2') {
       return [
        {
          id: 't4',
          description: 'Empenho Estimativo',
          contractId: '087/2025',
          commitmentId: '2026NE055',
          date: baseDate,
          type: TransactionType.COMMITMENT,
          amount: 50000.00,
          department: 'FADEP',
          budgetDescription: budget.descricao
        },
        {
          id: 't5',
          description: 'Reforço de Dotação',
          contractId: '087/2025',
          commitmentId: 'N/A',
          date: new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 10),
          type: TransactionType.REINFORCEMENT,
          amount: 244078.40,
          department: 'FADEP',
          budgetDescription: budget.descricao
        }
      ];
    }
    
    return [];
  }
}