import { Component, signal, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ContractsPageComponent } from './pages/contracts/contracts-page.component';
import { ContractFormComponent } from './components/contract-form/contract-form.component';
import { FinancialPageComponent } from './pages/financial/financial-page.component';
import { BudgetPageComponent } from './pages/budget/budget-page.component';

registerLocaleData(localePt);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    ContractsPageComponent, 
    ContractFormComponent, 
    FinancialPageComponent,
    BudgetPageComponent
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './app.component.html',
})
export class AppComponent {
  // Navigation State
  // Updated types to include 'financial' and 'budget'
  view = signal<'list' | 'form' | 'financial' | 'budget'>('list');
  sidebarOpen = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  showForm() {
    this.view.set('form');
  }

  showList() {
    this.view.set('list');
  }

  showFinancial() {
    this.view.set('financial');
  }

  showBudget() {
    this.view.set('budget');
  }
}