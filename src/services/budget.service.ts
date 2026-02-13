import { Injectable, signal } from '@angular/core';
import { Dotacao } from '../models/budget.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  // Mock Data Signal
  dotacoes = signal<Dotacao[]>([
    {
      id: '1',
      descricao: '01/2025 - MOL Mediação Online',
      linkSei: '0000949.110000931.0.2025',
      cnpj: '23.506.000/0001-50',
      data: new Date(2025, 0, 15),
      valorTotal: 92925.00,
      valorUtilizado: 92925.00, // Totalmente utilizado
      unidadeOrcamentaria: 'FADEP',
      contratoVinculado: 'MOL Mediação Online'
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
      contratoVinculado: 'Intelliway Tecnologia'
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
      contratoVinculado: 'Leistung Equipamentos'
    },
    {
      id: '4',
      descricao: '04/2026 - DB3 Telecom',
      linkSei: '0000952.110000934.0.2026',
      cnpj: '11.222.333/0001-44',
      data: new Date(2026, 2, 5),
      valorTotal: 895815.00,
      valorUtilizado: 0.00, // Nada utilizado ainda
      unidadeOrcamentaria: 'DEFENSORIA',
      contratoVinculado: 'DB3 Telecom'
    }
  ]);
}