import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';
import { Dotacao, calcularSaldoDotacao, getUnidadeBadgeClass, UnidadeOrcamentaria } from '../../models/budget.model';

@Component({
  selector: 'app-budget-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, DecimalPipe, FormsModule],
  templateUrl: './budget-page.component.html'
})
export class BudgetPageComponent {
  private budgetService = inject(BudgetService);

  // State
  searchQuery = signal('');
  activeUnitFilter = signal<'ALL' | UnidadeOrcamentaria>('ALL');

  // Helpers
  calcSaldo = calcularSaldoDotacao;
  getBadgeClass = getUnidadeBadgeClass;

  // Computed Logic
  filteredDotacoes = computed(() => {
    const all = this.budgetService.dotacoes();
    const query = this.searchQuery().toLowerCase();
    const unit = this.activeUnitFilter();

    return all.filter(d => {
      // 1. Unit Filter
      if (unit !== 'ALL' && d.unidadeOrcamentaria !== unit) {
        return false;
      }

      // 2. Text Search
      if (!query) return true;
      return (
        d.descricao.toLowerCase().includes(query) ||
        d.contratoVinculado.toLowerCase().includes(query) ||
        d.linkSei.toLowerCase().includes(query)
      );
    });
  });

  // Actions
  setUnitFilter(filter: 'ALL' | UnidadeOrcamentaria) {
    this.activeUnitFilter.set(filter);
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  // Visual helper for balance text color
  getBalanceColor(dotacao: Dotacao): string {
    const saldo = this.calcSaldo(dotacao);
    if (saldo <= 0) return 'text-red-600 dark:text-red-400 font-bold';
    return 'text-green-600 dark:text-green-400 font-bold';
  }
}