import { Component, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Contract, ContractStatus, calculateDaysRemaining, getEffectiveStatus } from '../../models/contract.model';

@Component({
  selector: 'app-contract-list-view',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nº Contrato</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fornecedor</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Término</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Global</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-card-dark divide-y divide-gray-200 dark:divide-gray-700">
            @for (contract of contracts(); track contract.id) {
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <!-- Number -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                    {{ contract.number }}
                  </div>
                </td>

                <!-- Supplier -->
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 dark:text-gray-200 line-clamp-1 max-w-[250px]" [title]="contract.supplierName">
                    {{ contract.supplierName }}
                  </div>
                </td>

                <!-- Status Badge -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                    [class]="getStatusClass(contract)">
                    {{ getStatusLabel(contract) }}
                  </span>
                </td>

                <!-- Validity (Termino) -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-col">
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      {{ contract.endDate | date:'dd/MM/yyyy' }}
                    </span>
                    <span class="text-xs font-medium" [class]="getDaysClass(contract)">
                      {{ getDaysLabel(contract) }}
                    </span>
                  </div>
                </td>

                <!-- Value -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    R$ {{ contract.valorTotal | number:'1.2-2':'pt-BR' }}
                  </div>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button class="text-gray-400 hover:text-sco-blue transition-colors">
                    <span class="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ContractListViewComponent {
  contracts = input.required<Contract[]>();

  // Helper to determine status efficiently inside the loop
  private getStatusInfo(contract: Contract) {
    const days = calculateDaysRemaining(contract.endDate);
    const status = getEffectiveStatus(contract, days);
    return { status, days };
  }

  getStatusClass(contract: Contract): string {
    const { status } = this.getStatusInfo(contract);
    
    switch (status) {
      case ContractStatus.RESCINDIDO:
        return 'bg-red-50 text-red-600 border-red-100 dark:border-red-900/30 dark:bg-red-900/20';
      case ContractStatus.FINALIZANDO:
        return 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:border-yellow-900/30 dark:bg-yellow-900/20';
      case ContractStatus.VIGENTE:
      default:
        return 'bg-green-50 text-sco-green border-green-100 dark:border-green-900/30 dark:bg-green-900/20';
    }
  }

  getStatusLabel(contract: Contract): string {
    const { status } = this.getStatusInfo(contract);
    return status;
  }

  getDaysLabel(contract: Contract): string {
    const { status, days } = this.getStatusInfo(contract);
    if (status === ContractStatus.RESCINDIDO) return 'Encerrado';
    if (days < 0) return `Venceu há ${Math.abs(days)} dias`;
    return `${days} dias restantes`;
  }

  getDaysClass(contract: Contract): string {
    const { status, days } = this.getStatusInfo(contract);
    if (status === ContractStatus.RESCINDIDO) return 'text-gray-400';
    if (status === ContractStatus.FINALIZANDO) return 'text-yellow-600 dark:text-yellow-500';
    if (days < 0) return 'text-red-500';
    return 'text-green-600 dark:text-green-500';
  }
}