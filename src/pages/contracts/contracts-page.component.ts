import { Component, signal, computed, output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contract, ContractStatus } from '../../models/contract.model';
import { ContractCardComponent } from '../../components/contract-card/contract-card.component';
import { ContractListViewComponent } from '../../components/contract-list-view/contract-list-view.component';
import { ContractFormComponent } from '../../components/contract-form/contract-form.component';
import { ContractService } from '../../services/contract.service';
import { AppContextService } from '../../services/app-context.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-contracts-page',
  standalone: true,
  imports: [CommonModule, ContractCardComponent, ContractListViewComponent, ContractFormComponent, FormsModule],
  templateUrl: './contracts-page.component.html',
})
export class ContractsPageComponent implements OnInit, OnDestroy {
  private contractService = inject(ContractService);
  private appContext = inject(AppContextService);

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

  // ── Debounce para busca global ──────────────────────────────────────────

  private searchSubject = new Subject<string>();
  private searchSubscription: any;

  ngOnInit() {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(query => this.searchQuery.set(query));
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  // ── Computed Properties ─────────────────────────────────────────────────

  /** Indica se há algum filtro ativo */
  hasActiveFilters = computed(() => {
    return this.filterStatus().length > 0 ||
      !!this.filterSupplier() ||
      !!this.filterNumber();
  });

  /** Estado de loading do service */
  isLoading = computed(() => this.contractService.loading());

  /**
   * Lista filtrada de contratos.
   *
   * A filtragem segue esta ordem:
   * 1. **Sobreposição de exercício**: (data_inicio <= fimAno) E (data_fim_efetiva >= inicioAno)
   * 2. **Status/View mode**: Vigentes vs Histórico
   * 3. **Filtros específicos**: fornecedor, número
   * 4. **Busca global**: texto livre
   *
   * Reage automaticamente a mudanças em `appContext.anoExercicio()`.
   */
  filteredContracts = computed(() => {
    const allContracts = this.contractService.contracts();

    // ── 0. Datas-limite do ano de exercício selecionado ──
    const anoSelecionado = this.appContext.anoExercicio();
    const inicioAno = new Date(anoSelecionado, 0, 1);
    const fimAno = new Date(anoSelecionado, 11, 31, 23, 59, 59);

    const globalQuery = this.searchQuery().toLowerCase().trim();
    const mode = this.viewMode();

    // Advanced filters
    const selectedStatuses = this.filterStatus();
    const supQuery = this.filterSupplier().toLowerCase().trim();
    const numQuery = this.filterNumber().toLowerCase().trim();

    const hasStatusFilter = selectedStatuses.length > 0;

    return allContracts.filter(c => {
      // ── 1. Sobreposição com o ano de exercício ──
      // Um contrato tem intersecção com o ano se:
      //   data_inicio <= fimAno  E  data_fim_efetiva >= inicioAno
      const contratoInicio = new Date(c.data_inicio);
      const contratoFim = new Date(c.data_fim_efetiva);

      if (contratoInicio > fimAno || contratoFim < inicioAno) {
        return false; // Sem sobreposição — exclui
      }

      // ── 2. Status/View Logic ──
      const effectiveStatus = c.statusEfetivo;
      const days = c.daysRemaining;
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

      // ── 3. Specific Field Filters ──
      const matchesSupplier = !supQuery || c.contratada.toLowerCase().includes(supQuery);
      const matchesNumber = !numQuery || c.contrato.toLowerCase().includes(numQuery);

      // ── 4. Global Search ──
      const matchesGlobalSearch = !globalQuery ||
        c.contrato.toLowerCase().includes(globalQuery) ||
        c.contratada.toLowerCase().includes(globalQuery) ||
        effectiveStatus.toLowerCase().includes(globalQuery);

      return matchesStatus && matchesSupplier && matchesNumber && matchesGlobalSearch;
    });
  });

  activeCount = computed(() => this.filteredContracts().length);

  // Actions
  setLayoutMode(mode: 'grid' | 'list') {
    this.layoutMode.set(mode);
  }

  /**
   * Busca com debounce: alimenta o Subject ao invés do signal diretamente.
   */
  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
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