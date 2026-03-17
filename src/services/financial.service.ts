import { inject, Injectable } from '@angular/core';
import { Transaction, TransactionType } from '../models/transaction.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private supabaseService = inject(SupabaseService);

  async getTransactionsByContractId(contractId: string): Promise<Transaction[]> {
    const { data, error } = await this.supabaseService.client
      .from('transacoes')
      .select('*')
      .eq('contract_id', contractId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações financeiras:', error);
      throw error;
    }

    return (data || []).map((raw: any) => ({
      id: raw.id,
      contract_id: raw.contract_id,
      description: raw.description,
      commitment_id: raw.commitment_id,
      date: new Date(raw.date),
      type: raw.type as TransactionType,
      amount: Number(raw.amount) || 0,
      department: raw.department,
      budget_description: raw.budget_description,
    }));
  }
}