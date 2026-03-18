import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContractStatus } from '../../../../shared/models/contract.model';
import { Supplier, getSupplierStatusClass, getSupplierStatusLabel, SupplierStatus } from '../../../../shared/models/supplier.model';
import { ContractService } from '../../../contracts/services/contract.service';
import { SupplierFormComponent } from '../../components/supplier-form/supplier-form.component';

import { SupplierService } from '../../services/supplier.service';

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, SupplierFormComponent],
  templateUrl: './suppliers-page.component.html'
})
export class SuppliersPageComponent {
  private supplierService = inject(SupplierService);
  private contractService = inject(ContractService);

  // Layout & State
  layoutMode = signal<'grid' | 'list'>('grid');
  searchQuery = signal('');
  filterStatus = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Drawer / Editing State
  selectedSupplier = signal<Supplier | null>(null);
  isEditing = signal(false);
  isCreating = signal(false);

  // Helpers
  getStatusClass = getSupplierStatusClass;
  getStatusLabel = getSupplierStatusLabel;

  // --- Computed Data ---

  filteredSuppliers = computed(() => {
    const all = this.supplierService.suppliers();
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();

    return all.filter(s => {
      // 1. Search
      const matchesSearch = !query ||
        s.razao_social.toLowerCase().includes(query) ||
        (s.nome_fantasia?.toLowerCase() || '').includes(query) ||
        s.cnpj.includes(query);

      // 2. Status
      const matchesStatus = status === 'ALL' || s.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  // Get contracts linked to the selected supplier
  // Note: Linking by Name string for now as per current Contract Model
  linkedContracts = computed(() => {
    const supplier = this.selectedSupplier();
    if (!supplier) return [];

    return this.contractService.contracts().filter(c =>
      c.contratada.toLowerCase() === supplier.razao_social.toLowerCase() ||
      c.contratada.toLowerCase().includes(supplier.nome_fantasia?.toLowerCase() || '')
    );
  });

  // --- Actions ---

  setLayoutMode(mode: 'grid' | 'list') {
    this.layoutMode.set(mode);
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  setFilterStatus(status: 'ALL' | 'ACTIVE' | 'INACTIVE') {
    this.filterStatus.set(status);
  }

  // --- Drawer / Detail Actions ---

  openCreate() {
    this.selectedSupplier.set(null);
    this.isEditing.set(false);
    this.isCreating.set(true);
  }

  openDetails(supplier: Supplier) {
    this.selectedSupplier.set(supplier);
    this.isEditing.set(false);
    this.isCreating.set(false);
  }

  closeDetails() {
    this.selectedSupplier.set(null);
    this.isEditing.set(false);
    this.isCreating.set(false);
  }

  toggleEditMode() {
    const current = this.selectedSupplier();
    if (!current) return;

    this.isEditing.set(!this.isEditing());
  }

  saveChanges(data: Partial<Supplier>) {
    if (this.isCreating()) {
      // Create new supplier
      this.supplierService.addSupplier(data as Omit<Supplier, 'id'>).then(() => {
        this.closeDetails();
      });
    } else if (this.isEditing() && this.selectedSupplier()) {
      // Update existing supplier
      const id = this.selectedSupplier()!.id;
      this.supplierService.updateSupplier(id, data).then(() => {
        // Update local selected state to reflect changes immediately in UI
        this.selectedSupplier.update(current => current ? { ...current, ...data } : null);
        this.isEditing.set(false);
      });
    }
  }

  getContractStatusClass(status: ContractStatus) {
    if (status === ContractStatus.VIGENTE) return 'bg-green-100 text-green-800';
    if (status === ContractStatus.RESCINDIDO) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  }
}