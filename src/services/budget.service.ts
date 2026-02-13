import { Injectable, signal, inject } from '@angular/core';
import { Dotacao } from '../models/budget.model';
import { Transaction } from '../models/transaction.model';
import { FinancialService } from './financial.service';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private financialService = inject(FinancialService);
  
  // Link to budgets via IDs defined in ContractService
  // Contract ID 3 -> MOL (074/2025)
  // Contract ID 2 -> Intelliway (087/2025)
  // Contract ID 9 -> Leistung (099/2026)
  // Contract ID 10 -> DB3 (101/2026)

  // Master Variable for Budgets
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
   * Retorna o histórico de transações filtrando do serviço financeiro centralizado
   */
  getHistoryForBudget(budget: Dotacao): Transaction[] {
    // Filtra diretamente da fonte única de verdade no FinancialService
    // Usa a descrição da dotação como chave de vínculo (conforme definido no FinancialService)
    return this.financialService.getTransactionsByBudget(budget.descricao);
  }

  /**
   * Retorna todas as dotações vinculadas a um contrato específico
   */
  getBudgetsByContractId(contractId: string): Dotacao[] {
    return this.dotacoes().filter(d => d.contractId === contractId);
  }
}