import { Component, computed, input } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Contract, ContractStatus, calculateDaysRemaining, getEffectiveStatus } from '../../models/contract.model';

@Component({
  selector: 'app-contract-card',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './contract-card.component.html',
})
export class ContractCardComponent {
  contract = input.required<Contract>();

  daysRemaining = computed(() => {
    return calculateDaysRemaining(this.contract().endDate);
  });

  effectiveStatus = computed(() => {
    return getEffectiveStatus(this.contract(), this.daysRemaining());
  });

  // UI Helpers based on status
  
  isRescinded = computed(() => this.effectiveStatus() === ContractStatus.RESCINDIDO);
  isFinalizing = computed(() => this.effectiveStatus() === ContractStatus.FINALIZANDO);
  isVigente = computed(() => this.effectiveStatus() === ContractStatus.VIGENTE);

  // Dynamic Classes
  
  cardBorderClass = computed(() => {
    if (this.isRescinded()) return 'hover:border-red-200';
    if (this.isFinalizing()) return 'hover:border-yellow-300';
    return 'hover:border-sco-blue/30';
  });

  badgeClass = computed(() => {
    if (this.isRescinded()) {
      return 'bg-red-50 text-red-600 border-red-100 dark:border-red-900/30 dark:bg-red-900/20';
    }
    if (this.isFinalizing()) {
      return 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:border-yellow-900/30 dark:bg-yellow-900/20';
    }
    // Vigente
    return 'bg-green-50 text-sco-green border-green-100 dark:border-green-900/30 dark:bg-green-900/20';
  });

  badgeText = computed(() => {
    if (this.isRescinded()) return 'RESCINDIDO';
    if (this.isFinalizing()) return 'FINALIZANDO';
    return 'VIGENTE';
  });

  titleHoverClass = computed(() => {
    if (this.isRescinded()) return 'group-hover:text-red-700';
    if (this.isFinalizing()) return 'group-hover:text-yellow-700';
    return 'group-hover:text-sco-blue';
  });

  footerIcon = computed(() => {
    if (this.isRescinded()) return 'block'; // Block icon for rescinded/encerrado
    if (this.isFinalizing()) return 'priority_high'; // Alert icon
    return 'event_upcoming'; // Calendar icon
  });

  footerTextClass = computed(() => {
    if (this.isRescinded()) return 'text-gray-400 dark:text-gray-500';
    if (this.isFinalizing()) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-500 dark:text-gray-400';
  });
  
  footerMessage = computed(() => {
    if (this.isRescinded()) return 'Encerrado';
    const days = this.daysRemaining();
    if (days < 0) return `Venceu há ${Math.abs(days)} dias`;
    return `Vence em ${days} dias`;
  });
}