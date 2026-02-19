import { Injectable, signal, computed } from '@angular/core';
import { Contract, ContractStatus, Aditivo, TransacaoFinanceira, getEffectiveStatus, calculateDaysRemaining } from '../models/contract.model';

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private today = new Date();

  private addDays(days: number): Date {
    const result = new Date(this.today);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Helper to parse strings to Date if needed, or return Date as is
  private parseDate(date: Date | string): Date {
    return new Date(date);
  }

  /**
   * Adapter / Sanitizer to transform raw data into a valid Contract
   * Handles business rules:
   * - Calculates valorAtualizado from original + aditivos
   * - Calculates dataFimVigente from aditivos
   * - Calculates financial totals from transactions
   * - Maps legacy fields
   */
  private sanitize(raw: any): Contract {
    const aditivos: Aditivo[] = raw.aditivos || [];
    const transacoes: TransacaoFinanceira[] = raw.transacoes || [];

    // 1. Calculate Updated Value (Immutability Rule)
    const totalAditivosValor = aditivos.reduce((sum, aditivo) => {
      // Only sum if type implies value change? Map says "sum(Aditivos.acrescimoValor)". 
      // Assuming details are in 'acrescimoValor' and it might be 0 for PRAZO only aditivos.
      return sum + (aditivo.acrescimoValor || 0);
    }, 0);
    const valorAtualizado = (raw.valorAnualOriginal || 0) + totalAditivosValor;

    // 2. Calculate Effective End Date (Aditivos Rule)
    // "novaDataFim do aditivo de prazo mais recente"
    // We sort aditivos by novaDataFim descending if they exist
    const aditivosComPrazo = aditivos.filter(a => a.novaDataFim);

    // Sort logic needs care with Dates. 
    aditivosComPrazo.sort((a, b) => {
      const dateA = new Date(a.novaDataFim!).getTime();
      const dateB = new Date(b.novaDataFim!).getTime();
      return dateB - dateA; // Descending
    });

    const dataFimVigente = aditivosComPrazo.length > 0
      ? this.parseDate(aditivosComPrazo[0].novaDataFim!)
      : this.parseDate(raw.dataFimOriginal);

    // 3. Financial Calculations (Read-Only Motor)
    const empenhos = transacoes.filter(t => t.tipo === 'EMPENHO').reduce((sum, t) => sum + t.valor, 0);
    const cancelamentos = transacoes.filter(t => t.tipo === 'CANCELAMENTO').reduce((sum, t) => sum + t.valor, 0);
    const pagamentos = transacoes.filter(t => t.tipo === 'PAGAMENTO').reduce((sum, t) => sum + t.valor, 0);

    const totalEmpenhado = empenhos - cancelamentos;
    const totalPago = pagamentos;
    const saldoEmpenho = totalEmpenhado - totalPago;

    // Mapping for legacy 'saldoDotacao'. Map didn't specify formula, assuming it's related to budget.
    // For now using a placeholder or raw value if exists, else 0.
    const saldoDotacao = raw.saldoDotacao || 0;

    // 4. Construct the Contract object
    const contract: Contract = {
      id: raw.id,
      numeroContrato: raw.numeroContrato,
      cnpjContratada: raw.cnpjContratada,
      nomeContratada: raw.nomeContratada,
      dataInicio: this.parseDate(raw.dataInicio),
      dataFimOriginal: this.parseDate(raw.dataFimOriginal),
      valorAnualOriginal: raw.valorAnualOriginal,
      status: raw.status as ContractStatus,

      // Computed
      valorAtualizado: valorAtualizado,
      dataFimVigente: dataFimVigente,
      daysRemaining: calculateDaysRemaining(dataFimVigente),

      // Relationships
      aditivos: aditivos,
      transacoes: transacoes,

      // Legacy Mappings
      number: raw.numeroContrato,
      supplierName: raw.nomeContratada,
      endDate: dataFimVigente,
      valorTotal: valorAtualizado, // Using updated value as total value for legacy views
      saldoEmpenho: saldoEmpenho,
      saldoDotacao: saldoDotacao
    };

    return contract;
  }

  // Centralized Mock Data with "Raw-ish" structure but compliant with new requirements
  // We use the sanitize function to process these into full contracts
  private rawContracts: any[] = [
    {
      id: '1',
      numeroContrato: '124/2024',
      nomeContratada: 'Gartner do Brasil Serviços de Pesquisa Ltda.',
      status: ContractStatus.RESCINDIDO,
      dataInicio: this.addDays(-365),
      dataFimOriginal: this.addDays(-30),
      valorAnualOriginal: 500000,
      aditivos: [],
      transacoes: []
    },
    {
      id: '2',
      numeroContrato: '087/2025',
      nomeContratada: 'Intelliway Tecnologia Ltda',
      status: ContractStatus.VIGENTE,
      dataInicio: this.addDays(-100),
      dataFimOriginal: this.addDays(180),
      valorAnualOriginal: 100000,
      aditivos: [
        { id: 'ad1', contratoId: '2', tipo: 'VALOR', acrescimoValor: 20000 }
      ],
      transacoes: [
        { id: 't1', contratoId: '2', tipo: 'EMPENHO', valor: 50000, dataTransacao: new Date(), dotacaoCodigo: 'D001' },
        { id: 't2', contratoId: '2', tipo: 'PAGAMENTO', valor: 30000, dataTransacao: new Date(), dotacaoCodigo: 'D001' }
      ]
    },
    {
      id: '3',
      numeroContrato: '074/2025',
      nomeContratada: 'MOL Mediação Online Assessoria',
      status: ContractStatus.VIGENTE,
      dataInicio: this.addDays(-50),
      dataFimOriginal: this.addDays(310),
      valorAnualOriginal: 85000,
      transacoes: [
        { id: 't3', contratoId: '3', tipo: 'EMPENHO', valor: 85000, dataTransacao: new Date(), dotacaoCodigo: 'D002' }
      ]
    },
    {
      id: '4',
      numeroContrato: '0080/2025',
      nomeContratada: 'Starlink Telespazio Brasil S/A',
      status: ContractStatus.VIGENTE,
      dataInicio: this.addDays(-20),
      dataFimOriginal: this.addDays(720),
      valorAnualOriginal: 2500000,
      saldoDotacao: 2000000 // Legacy override if needed
    },
    {
      id: '5',
      numeroContrato: '121/2022',
      nomeContratada: 'Lebre Tecnologia e Informática',
      status: ContractStatus.VIGENTE,
      dataInicio: this.addDays(-1000),
      dataFimOriginal: this.addDays(-50), // Was originally ending, but extended
      valorAnualOriginal: 50000,
      aditivos: [
        { id: 'ad2', contratoId: '5', tipo: 'PRAZO', novaDataFim: this.addDays(15), acrescimoValor: 10000 }
      ],
      transacoes: [
        { id: 't4', contratoId: '5', tipo: 'EMPENHO', valor: 60000, dataTransacao: new Date(), dotacaoCodigo: 'D003' }
      ]
    },
    {
      id: '6',
      numeroContrato: '064/2025',
      nomeContratada: 'Sistemas Convex Locações',
      status: ContractStatus.VIGENTE,
      dataInicio: this.addDays(-60),
      dataFimOriginal: this.addDays(300),
      valorAnualOriginal: 45000
    },
    {
      id: '7',
      numeroContrato: '135/2021',
      nomeContratada: 'Technocopy Ltda.',
      status: ContractStatus.VIGENTE,
      dataInicio: this.addDays(-500),
      dataFimOriginal: this.addDays(120),
      valorAnualOriginal: 15000
    },
    {
      id: '8',
      numeroContrato: '007/2025',
      nomeContratada: 'Telefônica Brasil S/A (Vivo)',
      status: ContractStatus.VIGENTE,
      dataInicio: this.addDays(-10),
      dataFimOriginal: this.addDays(400),
      valorAnualOriginal: 980000
    },
    {
      id: '9',
      numeroContrato: '099/2026',
      nomeContratada: 'Leistung Equipamentos',
      status: ContractStatus.VIGENTE,
      dataInicio: this.addDays(10),
      dataFimOriginal: this.addDays(500),
      valorAnualOriginal: 272000.00
    },
    {
      id: '10',
      numeroContrato: '101/2026',
      nomeContratada: 'DB3 Telecom',
      status: ContractStatus.VIGENTE,
      dataInicio: this.addDays(50),
      dataFimOriginal: this.addDays(600),
      valorAnualOriginal: 895815.00
    }
  ];

  // Expose contracts as a signal, processed through the adapter
  contracts = signal<Contract[]>(this.rawContracts.map(raw => this.sanitize(raw)));

  getContractById(id: string): Contract | undefined {
    return this.contracts().find(c => c.id === id);
  }
}