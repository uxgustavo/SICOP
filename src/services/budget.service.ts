import { inject, Injectable } from '@angular/core';
import { Dotacao } from '../models/budget.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private supabaseService = inject(SupabaseService);

  /**
   * Retorna todas as dotações vinculadas a um contrato específico via view vw_saldo_dotacoes
   */
  async getBudgetsByContractId(contractId: string): Promise<Dotacao[]> {
    const { data, error } = await this.supabaseService.client
      .from('vw_saldo_dotacoes')
      .select('*')
      .eq('contract_id', contractId);

    if (error) {
      console.error('Erro ao buscar dotações do contrato:', error);
      throw error;
    }

    return (data || []).map((raw: any) => ({
      id: raw.id,
      contract_id: raw.contract_id,
      dotacao: raw.dotacao,
      unid_gestora: raw.unid_gestora,
      valor_dotacao: Number(raw.valor_dotacao) || 0,
      total_empenhado: Number(raw.total_empenhado) || 0,
      total_cancelado: Number(raw.total_cancelado) || 0,
      total_pago: Number(raw.total_pago) || 0,
      saldo_disponivel: Number(raw.saldo_disponivel) || 0,
    }));
  }

  /**
   * Adiciona uma nova dotação vinculada a um contrato na tabela real dotacoes.
   */
  async addDotacao(dotacao: any): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('dotacoes')
      .insert(dotacao);

    if (error) {
      console.error('Erro ao adicionar dotação:', error);
      throw error;
    }
  }
}