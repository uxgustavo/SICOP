import { Component, signal, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ContractsPageComponent } from './pages/contracts/contracts-page.component';
import { ContractFormComponent } from './components/contract-form/contract-form.component';
import { FinancialPageComponent } from './pages/financial/financial-page.component';
import { BudgetPageComponent } from './pages/budget/budget-page.component';
import { ContractDetailsPageComponent } from './pages/contract-details/contract-details-page.component';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';

registerLocaleData(localePt);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    ContractsPageComponent, 
    ContractFormComponent, 
    FinancialPageComponent,
    BudgetPageComponent,
    ContractDetailsPageComponent,
    DashboardPageComponent
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './app.component.html',
})
export class AppComponent {
  // Navigation State
  view = signal<'dashboard' | 'list' | 'form' | 'financial' | 'budget' | 'contract-details'>('dashboard');
  selectedContractId = signal<string | null>(null);
  
  sidebarOpen = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  showDashboard() {
    this.view.set('dashboard');
    this.selectedContractId.set(null);
  }

  showForm() {
    this.view.set('form');
  }

  showList() {
    this.view.set('list');
    this.selectedContractId.set(null);
  }

  showFinancial() {
    this.view.set('financial');
  }

  showBudget() {
    this.view.set('budget');
  }

  openContractDetails(id: string) {
    this.selectedContractId.set(id);
    this.view.set('contract-details');
  }

  handleDashboardNavigation(target: 'contracts' | 'financial' | 'budget') {
    if (target === 'contracts') this.showList();
    if (target === 'financial') this.showFinancial();
    if (target === 'budget') this.showBudget();
  }
}