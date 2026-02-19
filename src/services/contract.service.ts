import { Injectable, signal } from '@angular/core';
import { Contract, ContractStatus } from '../models/contract.model';

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

  // Centralized Mock Data
  private contractsMock: Contract[] = [
    {
      id: '1',
      number: '124/2024',
      supplierName: 'Gartner do Brasil Serviços de Pesquisa Ltda.',
      status: ContractStatus.RESCINDIDO,
      endDate: this.addDays(-30),
      valorTotal: 500000,
      saldoDotacao: 0,
      saldoEmpenho: 0
    },
    {
      id: '2',
      number: '087/2025',
      supplierName: 'Intelliway Tecnologia Ltda',
      status: ContractStatus.VIGENTE,
      endDate: this.addDays(180),
      valorTotal: 120000,
      saldoDotacao: 50000,
      saldoEmpenho: 20000
    },
    {
      id: '3',
      number: '074/2025',
      supplierName: 'MOL Mediação Online Assessoria',
      status: ContractStatus.VIGENTE,
      endDate: this.addDays(310),
      valorTotal: 85000,
      saldoDotacao: 85000,
      saldoEmpenho: 0
    },
    {
      id: '4',
      number: '0080/2025',
      supplierName: 'Starlink Telespazio Brasil S/A',
      status: ContractStatus.VIGENTE,
      endDate: this.addDays(720),
      valorTotal: 2500000,
      saldoDotacao: 2000000,
      saldoEmpenho: 500000
    },
    {
      id: '5',
      number: '121/2022',
      supplierName: 'Lebre Tecnologia e Informática',
      status: ContractStatus.VIGENTE,
      endDate: this.addDays(15),
      valorTotal: 60000,
      saldoDotacao: 1000,
      saldoEmpenho: 60000
    },
    {
      id: '6',
      number: '064/2025',
      supplierName: 'Sistemas Convex Locações',
      status: ContractStatus.VIGENTE,
      endDate: this.addDays(300),
      valorTotal: 45000,
      saldoDotacao: 20000,
      saldoEmpenho: 10000
    },
    {
      id: '7',
      number: '135/2021',
      supplierName: 'Technocopy Ltda.',
      status: ContractStatus.VIGENTE,
      endDate: this.addDays(120),
      valorTotal: 15000,
      saldoDotacao: 5000,
      saldoEmpenho: 5000
    },
    {
      id: '8',
      number: '007/2025',
      supplierName: 'Telefônica Brasil S/A (Vivo)',
      status: ContractStatus.VIGENTE,
      endDate: this.addDays(400),
      valorTotal: 980000,
      saldoDotacao: 400000,
      saldoEmpenho: 100000
    },
    // Added to support Budget Page requirements
    {
      id: '9',
      number: '099/2026',
      supplierName: 'Leistung Equipamentos',
      status: ContractStatus.VIGENTE,
      endDate: this.addDays(500),
      valorTotal: 272000.00,
      saldoDotacao: 152000,
      saldoEmpenho: 120000
    },
    {
      id: '10',
      number: '101/2026',
      supplierName: 'DB3 Telecom',
      status: ContractStatus.VIGENTE,
      endDate: this.addDays(600),
      valorTotal: 895815.00,
      saldoDotacao: 895815.00,
      saldoEmpenho: 0
    }
  ];

  contracts = signal<Contract[]>(this.contractsMock);

  getContractById(id: string): Contract | undefined {
    return this.contracts().find(c => c.id === id);
  }
}