import { Component, signal, computed, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contract, ContractStatus, calculateDaysRemaining, getEffectiveStatus } from '../../models/contract.model';
import { ContractCardComponent } from '../../components/contract-card/contract-card.component';
import { ContractListViewComponent } from '../../components/contract-list-view/contract-list-view.component';
import { ContractFormComponent } from '../../components/contract-form/contract-form.component';
import { ContractService } from '../../services/contract.service';

@Component({
  selector: 'app-contracts-page',
  standalone: true,
  imports: [CommonModule, ContractCardComponent, ContractListViewComponent, ContractFormComponent, FormsModule],
  templateUrl: './contracts-page.component.html',
})
export class ContractsPageComponent {
  private contractService = inject(ContractService);

  // Navigation Event
  createContract = output<void>();
  openContractDetails = output<string>();

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

  // Computed Properties for Logic
  
  filteredContracts = computed(() => {
    const allContracts = this.contractService.contracts();
    const globalQuery = this.searchQuery().toLowerCase().trim();
    const mode = this.viewMode();
    
    // Advanced filters
    const selectedStatuses = this.filterStatus();
    const supQuery = this.filterSupplier().toLowerCase().trim();
    const numQuery = this.filterNumber().toLowerCase().trim();
    
    const hasStatusFilter = selectedStatuses.length > 0;

    return allContracts.filter(c => {
      const days = calculateDaysRemaining(c.endDate);
      const effectiveStatus = getEffectiveStatus(c, days);
      
      // 1. Status/View Logic
      let matchesStatus = false;

      if (hasStatusFilter) {
        matchesStatus = selectedStatuses.includes(effectiveStatus);
      } else {
        const isExpired = days < 0;
        const isRescinded = c.status === ContractStatus.RESCINDIDO;
        
        if (mode === 'active') {
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
    console.log('Main Page received saved data:', data);
    this.closeForm();
  }

  handleSelect(contractId: string) {
    this.openContractDetails.emit(contractId);
  }
}