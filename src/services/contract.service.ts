import { Injectable, signal, inject } from '@angular/core';
import {
  Contract, ContractStatus, Aditivo, Result
} from '../models/contract.model';
import { Dotacao } from '../models/budget.model';
import { SupabaseService } from './supabase.service';
import { AppContextService } from './app-context.service';

/**
 * @description Serviço central de contratos do SICOP.
 *
 * Responsabilidades:
 * - Buscar todos os contratos do Supabase (filtragem por exercício é client-side)
 * - Carregar aditivos PRORROGACAO em batch para calcular `data_fim_efetiva`
 * - Mapear dados brutos em objetos `Contract` imutáveis
 * - Expor estado reativo via signals readonly
 *
 * @usageNotes
 * A filtragem por ano de exercício é feita nos **componentes** via `computed`,
 * usando sobreposição de intervalos: `(data_inicio <= fimAno) && (data_fim_efetiva >= inicioAno)`.
 * Isso permite que um contrato vigente de 2024 a 2026 apareça em 2024, 2025 e 2026.
 */
@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private supabaseService = inject(SupabaseService);

  // ── Estado Interno (privado e mutável) ──────────────────────────────────

  private _contracts = signal<Contract[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // ── Estado Público (somente leitura) ────────────────────────────────────

  /** Lista completa de contratos (sem filtro de ano — componentes filtram) */
  readonly contracts = this._contracts.asReadonly();

  /** Indica se uma busca está em andamento */
  readonly loading = this._loading.asReadonly();

  /** Mensagem de erro da última operação, ou null se sucesso */
  readonly error = this._error.asReadonly();

  constructor() {
    // Carrega todos os contratos uma única vez na inicialização
    this.loadContracts();
  }

  // ── Data Fetching ───────────────────────────────────────────────────────

  /**
   * Busca TODOS os contratos a partir da view vw_contratos_vigencia.
   * A view já calcula `data_fim_efetiva`, `dias_restantes` e `status_efetivo`.
   */
  async loadContracts(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const { data: rawContracts, error: contractsError } = await this.supabaseService.client
        .from('vw_contratos_vigencia')
        .select('*');

      if (contractsError) throw contractsError;

      const contracts = (rawContracts || []).map((raw: any) =>
        this.mapRawToContract(raw)
      );

      this._contracts.set(contracts);
    } catch (err: any) {
      console.error('Erro ao buscar contratos:', err);
      this._error.set(err.message || 'Erro ao carregar contratos');
      this._contracts.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Busca um contrato por ID ou número.
   */
  getContractById(id: string): Contract | undefined {
    return this.contracts().find(c => c.id === id || c.contrato === id);
  }

  /**
   * Busca aditivos de um contrato, tipados e ordenados por data de assinatura
   * (mais recente primeiro).
   *
   * @param contractId - ID do contrato (UUID)
   * @returns Result tipado com array de Aditivo ou mensagem de erro.
   */
  async getAditivosPorContractId(contractId: string): Promise<Result<Aditivo[]>> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('aditivos')
        .select('*')
        .eq('contract_id', contractId)
        .order('data_assinatura', { ascending: false });

      if (error) throw error;

      const aditivos: Aditivo[] = (data || []).map((raw: any) => this.mapRawToAditivo(raw));

      return { data: aditivos, error: null };
    } catch (err: any) {
      console.error('Erro ao buscar aditivos:', err);
      return { data: null, error: err.message || 'Erro ao carregar aditivos' };
    }
  }



  /**
   * Adiciona um novo aditivo ao Supabase.
   */
  async addAditivo(aditivo: Partial<Aditivo>): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('aditivos')
      .insert(aditivo);

    if (error) {
      console.error('Erro ao adicionar aditivo:', error);
      throw error;
    }
  }

  // ── Mappers Privados (Data Transformation Layer) ────────────────────────

  /**
   * Converte um registro bruto da view vw_contratos_vigencia em um objeto `Contract`.
   */
  private mapRawToContract(raw: any): Contract {
    return {
      id: raw.id,
      contrato: raw.contrato ?? '',
      contratada: raw.contratada ?? '',
      data_inicio: this.parseDate(raw.data_inicio),
      data_fim: this.parseDate(raw.data_fim),
      valor_anual: this.parseNumeric(raw.valor_anual),
      status: (raw.status as ContractStatus) || ContractStatus.VIGENTE,
      setor_id: raw.setor_id ?? undefined,
      objeto: raw.objeto ?? undefined,
      data_fim_efetiva: raw.data_fim_efetiva ? this.parseDate(raw.data_fim_efetiva) : undefined,
      dias_restantes: raw.dias_restantes != null ? Number(raw.dias_restantes) : undefined,
      status_efetivo: (raw.status_efetivo as ContractStatus) || undefined
    };
  }

  /**
   * Converte um registro bruto de aditivo em um objeto `Aditivo` tipado.
   */
  private mapRawToAditivo(raw: any): Aditivo {
    return {
      id: raw.id,
      contract_id: raw.contract_id ?? '',
      numero_aditivo: raw.numero_aditivo ?? '',
      tipo: raw.tipo ?? 'ALTERACAO',
      data_assinatura: raw.data_assinatura ? this.parseDate(raw.data_assinatura) : undefined,
      nova_vigencia: raw.nova_vigencia ? this.parseDate(raw.nova_vigencia) : undefined,
      valor_aditivo: raw.valor_aditivo != null ? this.parseNumeric(raw.valor_aditivo) : undefined
    };
  }

  // ── Helpers de Parsing ──────────────────────────────────────────────────

  private parseDate(value: any): Date {
    return value ? new Date(value) : new Date();
  }

  private parseNumeric(value: any): number {
    return Number(value) || 0;
  }
}