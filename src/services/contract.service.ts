import { Injectable, signal, computed } from '@angular/core';
import { Contract, ContractStatus, Aditivo, Dotacao, calculateDaysRemaining, getEffectiveStatus } from '../models/contract.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  // Signals 
  contracts = signal<Contract[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private supabaseService: SupabaseService) { }

  // Helper to parse strings to Date
  private parseDate(date: any): Date {
    return new Date(date);
  }

  // Parse strings to Number
  private parseNumeric(value: any): number {
    return Number(value) || 0;
  }

  /**
   * Fetches contracts from Supabase and updates the signal
   */
  async loadContracts() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabaseService.client
        .from('contratos')
        .select('*');

      if (error) throw error;

      const rawData = data || [];

      // Map raw data from DB to our Contract Interface ensuring types
      const parsedContracts: Contract[] = rawData.map((raw: any) => {
        const contract: Contract = {
          id: raw.id,
          contrato: raw.contrato,
          contratada: raw.contratada,
          data_inicio: this.parseDate(raw.data_inicio),
          data_fim: this.parseDate(raw.data_fim),
          valor_anual: this.parseNumeric(raw.valor_anual),
          status: raw.status as ContractStatus,
          setor_id: raw.setor_id,

          // Legacy fallbacks for UI
          number: raw.contrato,
          supplierName: raw.contratada,
          endDate: this.parseDate(raw.data_fim),
          valorTotal: this.parseNumeric(raw.valor_anual)
        };

        // Calculate effective status and remaining days
        contract.daysRemaining = calculateDaysRemaining(contract.data_fim);
        contract.statusEfetivo = getEffectiveStatus(contract, contract.daysRemaining);

        return contract;
      });

      this.contracts.set(parsedContracts);
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      this.error.set(err.message || 'Erro ao carregar contratos');
      this.contracts.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  getContractById(id: string): Contract | undefined {
    return this.contracts().find(c => c.id === id || c.contrato === id);
  }

  /**
   * Fetches aditivos for a specific contract
   */
  async getAditivosPorContrato(numero_contrato: string): Promise<Aditivo[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('aditivos')
        .select('*')
        .eq('numero_contrato', numero_contrato);

      if (error) throw error;

      return (data || []).map(raw => ({
        id: raw.id,
        numero_contrato: raw.numero_contrato,
        numero_aditivo: raw.numero_aditivo,
        tipo: raw.tipo,
        data_assinatura: raw.data_assinatura ? this.parseDate(raw.data_assinatura) : undefined,
        nova_vigencia: raw.nova_vigencia ? this.parseDate(raw.nova_vigencia) : undefined,
        valor_aditivo: raw.valor_aditivo ? this.parseNumeric(raw.valor_aditivo) : undefined
      }));
    } catch (err) {
      console.error('Error fetching aditivos:', err);
      return [];
    }
  }

  /**
   * Fetches dotacoes for a specific contract
   */
  async getDotacoesPorContrato(numero_contrato: string): Promise<Dotacao[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('dotacoes')
        .select('*')
        .eq('numero_contrato', numero_contrato);

      if (error) throw error;

      return (data || []).map(raw => ({
        id: raw.id,
        dotacao: raw.dotacao,
        numero_contrato: raw.numero_contrato,
        unid_gestora: raw.unid_gestora,
        valor_dotacao: this.parseNumeric(raw.valor_dotacao)
      }));
    } catch (err) {
      console.error('Error fetching dotacoes:', err);
      return [];
    }
  }
}