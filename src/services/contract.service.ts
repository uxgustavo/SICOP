import { Injectable, signal, inject } from '@angular/core';
import {
  Contract, ContractStatus, Aditivo, Dotacao, Result,
  calculateDaysRemaining, getEffectiveStatus
} from '../models/contract.model';
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
   * Busca TODOS os contratos do Supabase e calcula `data_fim_efetiva`
   * usando aditivos de prorrogação carregados em batch.
   *
   * **Nota:** Não há filtro por ano no servidor. A filtragem por exercício
   * é feita nos componentes via sobreposição de intervalos.
   */
  async loadContracts(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // 1. Buscar todos os contratos
      const { data: rawContracts, error: contractsError } = await this.supabaseService.client
        .from('contratos')
        .select('*');

      if (contractsError) throw contractsError;

      // 2. Buscar todos os aditivos de PRORROGACAO em batch
      const { data: rawAditivos, error: aditivosError } = await this.supabaseService.client
        .from('aditivos')
        .select('*')
        .eq('tipo', 'PRORROGACAO')
        .not('nova_vigencia', 'is', null)
        .order('nova_vigencia', { ascending: false });

      // Aditivos são opcionais — erro não impede a carga de contratos
      if (aditivosError) {
        console.warn('Aviso: Não foi possível carregar aditivos de prorrogação:', aditivosError);
      }

      // 3. Construir mapa: numero_contrato → nova_vigencia mais recente
      const prorrogacaoMap = this.buildProrrogacaoMap(rawAditivos || []);

      // 4. Mapear contratos com data_fim_efetiva
      const contracts = (rawContracts || []).map((raw: any) =>
        this.mapRawToContract(raw, prorrogacaoMap)
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
   * @param numeroContrato - Número do contrato (ex: "124/2024")
   * @returns Result tipado com array de Aditivo ou mensagem de erro.
   */
  async getAditivosPorContrato(numeroContrato: string): Promise<Result<Aditivo[]>> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('aditivos')
        .select('*')
        .eq('numero_contrato', numeroContrato)
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
   * Busca dotações de um contrato.
   *
   * @param numeroContrato - Número do contrato.
   * @returns Result tipado com array de Dotacao ou mensagem de erro.
   */
  async getDotacoesPorContrato(numeroContrato: string): Promise<Result<Dotacao[]>> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('dotacoes')
        .select('*')
        .eq('numero_contrato', numeroContrato);

      if (error) throw error;

      const dotacoes: Dotacao[] = (data || []).map((raw: any) => ({
        id: raw.id,
        dotacao: raw.dotacao ?? '',
        numero_contrato: raw.numero_contrato ?? '',
        unid_gestora: raw.unid_gestora ?? '',
        valor_dotacao: this.parseNumeric(raw.valor_dotacao)
      }));

      return { data: dotacoes, error: null };
    } catch (err: any) {
      console.error('Erro ao buscar dotações:', err);
      return { data: null, error: err.message || 'Erro ao carregar dotações' };
    }
  }

  // ── Mappers Privados (Data Transformation Layer) ────────────────────────

  /**
   * Constrói um mapa de numero_contrato → nova_vigencia mais recente
   * a partir dos aditivos PRORROGACAO.
   *
   * Como os aditivos já vêm ordenados por nova_vigencia DESC,
   * o primeiro de cada contrato é o mais recente.
   */
  private buildProrrogacaoMap(rawAditivos: any[]): Map<string, Date> {
    const map = new Map<string, Date>();

    for (const raw of rawAditivos) {
      const numContrato = raw.numero_contrato;
      // Pega apenas o primeiro (mais recente) de cada contrato
      if (numContrato && !map.has(numContrato)) {
        map.set(numContrato, this.parseDate(raw.nova_vigencia));
      }
    }

    return map;
  }

  /**
   * Converte um registro bruto do Supabase em um objeto `Contract` imutável.
   * Usa o mapa de prorrogações para calcular `data_fim_efetiva`.
   *
   * @param raw - Registro bruto do Supabase
   * @param prorrogacaoMap - Mapa de numero_contrato → nova_vigencia mais recente
   */
  private mapRawToContract(raw: any, prorrogacaoMap: Map<string, Date>): Contract {
    const dataFimOriginal = this.parseDate(raw.data_fim);
    const status = (raw.status as ContractStatus) || ContractStatus.VIGENTE;

    // data_fim_efetiva: usa prorrogação se existir e for posterior à data original
    const prorrogacao = prorrogacaoMap.get(raw.contrato);
    const dataFimEfetiva = (prorrogacao && prorrogacao > dataFimOriginal)
      ? prorrogacao
      : dataFimOriginal;

    const daysRemaining = calculateDaysRemaining(dataFimEfetiva);

    return {
      id: raw.id,
      contrato: raw.contrato ?? '',
      contratada: raw.contratada ?? '',
      data_inicio: this.parseDate(raw.data_inicio),
      data_fim: dataFimOriginal,
      data_fim_efetiva: dataFimEfetiva,
      valor_anual: this.parseNumeric(raw.valor_anual),
      status,
      setor_id: raw.setor_id ?? undefined,
      objeto: raw.objeto ?? undefined,
      daysRemaining,
      statusEfetivo: getEffectiveStatus({ status }, daysRemaining)
    };
  }

  /**
   * Converte um registro bruto de aditivo em um objeto `Aditivo` tipado.
   */
  private mapRawToAditivo(raw: any): Aditivo {
    return {
      id: raw.id,
      numero_contrato: raw.numero_contrato ?? '',
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