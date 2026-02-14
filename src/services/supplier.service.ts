import { Injectable, signal } from '@angular/core';
import { Supplier } from '../models/supplier.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  
  // Mock Data matching the names in ContractService
  private _suppliers = signal<Supplier[]>([
    {
      id: '1',
      name: 'Gartner do Brasil Serviços de Pesquisa Ltda.',
      tradeName: 'Gartner',
      cnpj: '02.511.233/0001-90',
      email: 'contato@gartner.com',
      phone: '(11) 3000-0000',
      status: 'INACTIVE',
      category: 'Consultoria',
      since: new Date(2022, 1, 10)
    },
    {
      id: '2',
      name: 'Intelliway Tecnologia Ltda',
      tradeName: 'Intelliway',
      cnpj: '12.345.678/0001-90',
      email: 'comercial@intelliway.com.br',
      phone: '(61) 3333-4444',
      status: 'ACTIVE',
      category: 'Tecnologia',
      since: new Date(2023, 5, 15)
    },
    {
      id: '3',
      name: 'MOL Mediação Online Assessoria',
      tradeName: 'MOL Mediação',
      cnpj: '23.506.000/0001-50',
      email: 'financeiro@mol.com.br',
      phone: '(11) 99999-8888',
      status: 'ACTIVE',
      category: 'Serviços Jurídicos',
      since: new Date(2024, 0, 5)
    },
    {
      id: '4',
      name: 'Starlink Telespazio Brasil S/A',
      tradeName: 'Starlink',
      cnpj: '44.555.666/0001-11',
      email: 'enterprise@starlink.com',
      phone: '0800 123 4567',
      status: 'ACTIVE',
      category: 'Telecomunicações',
      since: new Date(2024, 2, 20)
    },
    {
      id: '5',
      name: 'Leistung Equipamentos',
      tradeName: 'Leistung',
      cnpj: '98.765.432/0001-10',
      email: 'vendas@leistung.com.br',
      phone: '(47) 3333-2222',
      status: 'ACTIVE',
      category: 'Equipamentos',
      since: new Date(2024, 6, 1)
    },
    {
      id: '6',
      name: 'DB3 Telecom',
      tradeName: 'DB3',
      cnpj: '11.222.333/0001-44',
      email: 'contato@db3.com.br',
      phone: '(85) 3300-1010',
      status: 'ACTIVE',
      category: 'Telecomunicações',
      since: new Date(2025, 0, 10)
    },
    {
      id: '7',
      name: 'Telefônica Brasil S/A (Vivo)',
      tradeName: 'Vivo Empresas',
      cnpj: '02.558.157/0001-62',
      email: 'gov@vivo.com.br',
      phone: '103 15',
      status: 'ACTIVE',
      category: 'Telecomunicações',
      since: new Date(2020, 0, 1)
    }
  ]);

  suppliers = this._suppliers.asReadonly();

  updateSupplier(id: string, data: Partial<Supplier>) {
    this._suppliers.update(current => 
      current.map(s => s.id === id ? { ...s, ...data } : s)
    );
  }

  addSupplier(supplier: Supplier) {
    this._suppliers.update(current => [...current, supplier]);
  }
}