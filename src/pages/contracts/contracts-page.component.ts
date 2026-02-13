import { Component, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contract, ContractStatus, calculateDaysRemaining, getEffectiveStatus } from '../../models/contract.model';
import { ContractCardComponent } from '../../components/contract-card/contract-card.component';
import { ContractListViewComponent } from '../../components/contract-list-view/contract-list-view.component';
import { ContractFormComponent } from '../../components/contract-form/contract-form.component';

@Component({
  selector: 'app-contracts-page',
  standalone: true,
  imports: [CommonModule, ContractCardComponent, ContractListViewComponent, ContractFormComponent, FormsModule],
  templateUrl: './contracts-page.component.html',
})
export class ContractsPageComponent {
  // Navigation Event - Kept for backward compatibility with AppComponent but unused locally
  createContract = output<void>();

  // Modal State
  isFormOpen = signal(false);

  // Layout State
  layoutMode = signal<'grid' | 'list'>('grid');

  // Signals for Filter State
  searchQuery = signal<string>('');
  viewMode = signal<'active' | 'history'>('active');
  
  // Advanced Filter State
  isFilterPanelOpen = signal(false);
  filterStatus = signal<ContractStatus[]>([]);
  filterSupplier = signal<string>('');
  filterNumber = signal<string>('');

  ContractStatus = ContractStatus; // For template access

  // Mock Data Generation
  private today = new Date();

  // Helper to create dates relative to today
  private addDays(days: number): Date {
    const result = new Date(this.today);
    result.setDate(result.getDate() + days);
    return result;
  }

  mockContracts: Contract[] = [
    {
      id: '1',
      number: '124/2024',
      supplierName: 'Gartner do Brasil Serviços de Pesquisa Ltda.',
      status: ContractStatus.RESCINDIDO,
      endDate: this.addDays(-30), // Already ended
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
      status: ContractStatus.VIGENTE, // Business logic will convert to FINALIZANDO due to < 90 days
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
    }
  ];

  // Computed Properties for Logic
  
  filteredContracts = computed(() => {
    const globalQuery = this.searchQuery().toLowerCase().trim();
    const mode = this.viewMode();
    
    // Advanced filters
    const selectedStatuses = this.filterStatus();
    const supQuery = this.filterSupplier().toLowerCase().trim();
    const numQuery = this.filterNumber().toLowerCase().trim();
    
    const hasStatusFilter = selectedStatuses.length > 0;

    return this.mockContracts.filter(c => {
      const days = calculateDaysRemaining(c.endDate);
      const effectiveStatus = getEffectiveStatus(c, days);
      
      // 1. Status/View Logic
      let matchesStatus = false;

      if (hasStatusFilter) {
        // If manual filters are selected, they override the "Tab" logic
        matchesStatus = selectedStatuses.includes(effectiveStatus);
      } else {
        // Fallback to Tab logic
        const isExpired = days < 0;
        const isRescinded = c.status === ContractStatus.RESCINDIDO;
        
        if (mode === 'active') {
          // Active means not rescinded and not fully expired (though expired < 0 might be considered finalizing/expired in history depending on rule)
          // Based on previous logic:
          matchesStatus = !isRescinded && !isExpired; 
        } else {
          matchesStatus = isRescinded || isExpired;
        }
      }

      // 2. Specific Field Filters
      const matchesSupplier = !supQuery || c.supplierName.toLowerCase().includes(supQuery);
      const matchesNumber = !numQuery || c.number.toLowerCase().includes(numQuery);

      // 3. Global Search Logic
      const matchesGlobalSearch = !globalQuery || 
        c.number.toLowerCase().includes(globalQuery) || 
        c.supplierName.toLowerCase().includes(globalQuery) ||
        effectiveStatus.toLowerCase().includes(globalQuery);

      return matchesStatus && matchesSupplier && matchesNumber && matchesGlobalSearch;
    });
  });

  activeCount = computed(() => this.filteredContracts().length);

  // Actions
  setLayoutMode(mode: 'grid' | 'list') {
    this.layoutMode.set(mode);
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  setViewMode(mode: 'active' | 'history') {
    this.viewMode.set(mode);
    // Clear status filters when switching tabs to avoid confusion
    this.filterStatus.set([]);
  }
  
  toggleFilterPanel() {
    this.isFilterPanelOpen.update(v => !v);
  }

  toggleStatusFilter(status: ContractStatus) {
    this.filterStatus.update(current => {
      if (current.includes(status)) {
        return current.filter(s => s !== status);
      } else {
        return [...current, status];
      }
    });
  }
  
  clearFilters() {
    this.filterStatus.set([]);
    this.filterSupplier.set('');
    this.filterNumber.set('');
    this.searchQuery.set('');
  }

  // Modal Actions
  openForm() {
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
  }

  handleSave(data: any) {
    // In a real app, we would add to the list or refresh data here.
    console.log('Main Page received saved data:', data);
    this.closeForm();
  }
}