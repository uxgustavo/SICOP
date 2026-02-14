import { Component, inject, computed, output, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import * as d3 from 'd3';
import { ContractService } from '../../services/contract.service';
import { FinancialService } from '../../services/financial.service';
import { BudgetService } from '../../services/budget.service';
import { TransactionType } from '../../models/transaction.model';
import { ContractStatus } from '../../models/contract.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent {
  private contractService = inject(ContractService);
  private financialService = inject(FinancialService);
  private budgetService = inject(BudgetService);

  // Output for Navigation
  navigate = output<'contracts' | 'financial' | 'budget'>();

  // D3 Container
  chartContainer = viewChild<ElementRef>('chart');

  // --- Metrics Calculation ---

  // 1. Contracts Logic
  activeContractsCount = computed(() => {
    return this.contractService.contracts()
      .filter(c => c.status === ContractStatus.VIGENTE).length;
  });

  // 2. Financial Logic
  financialMetrics = computed(() => {
    const transactions = this.financialService.transactions();
    
    const totalPaid = transactions
      .filter(t => t.type === TransactionType.LIQUIDATION)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalCommitted = transactions
      .filter(t => t.type === TransactionType.COMMITMENT)
      .reduce((acc, t) => acc + t.amount, 0);

    const toPay = Math.max(0, totalCommitted - totalPaid);

    return { totalPaid, toPay, totalCommitted };
  });

  // 3. Overdue Logic
  overduePayments = computed(() => {
    return 0; 
  });

  // 4. Budget Logic (Distribution)
  budgetMetrics = computed(() => {
    const budgets = this.budgetService.dotacoes();
    
    const totalBudget = budgets.reduce((acc, b) => acc + b.valorTotal, 0);
    const totalUsed = budgets.reduce((acc, b) => acc + b.valorUtilizado, 0);
    
    const percentageUsed = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;

    return { 
      totalBudget, 
      totalUsed, 
      available: totalBudget - totalUsed,
      percentageUsed 
    };
  });

  // 5. Recent Payments List
  recentPayments = computed(() => {
    return this.financialService.transactions()
      .filter(t => t.type === TransactionType.LIQUIDATION)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5); 
  });

  constructor() {
    // Reactively render chart when metrics change
    effect(() => {
      const metrics = this.budgetMetrics();
      const container = this.chartContainer()?.nativeElement;
      if (container) {
        this.renderDonutChart(container, metrics);
      }
    });
  }

  private renderDonutChart(container: HTMLElement, metrics: any) {
    // Clear previous chart
    d3.select(container).selectAll('*').remove();

    // Create Tooltip Div
    const tooltip = d3.select(container)
      .append('div')
      .attr('class', 'absolute z-10 hidden bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none transition-opacity duration-200 opacity-0')
      .style('opacity', 0); // Start hidden

    const width = 220;
    const height = 220;
    const margin = 20;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Data for D3
    // Order: Used (Empenhado), Available (Disponível)
    const data = { 
      Used: metrics.totalUsed, 
      Available: metrics.available 
    };

    // Currency Formatter
    const currencyFormatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    // Color Palette
    // SCO Blue (#004B85) for Used
    // Gray (#E5E7EB) for Available (works as neutral background ring)
    const color = d3.scaleOrdinal()
      .domain(['Used', 'Available'])
      .range(['#004B85', '#E5E7EB']);

    const pie = d3.pie<any>()
      .value((d: any) => d[1])
      .sort(null); // Keep order defined in data object

    const data_ready = pie(Object.entries(data));

    // Arc Generator
    const arc = d3.arc()
      .innerRadius(radius * 0.65) // Donut Hole
      .outerRadius(radius);
    
    // Hover Arc (slightly larger)
    const arcHover = d3.arc()
      .innerRadius(radius * 0.65)
      .outerRadius(radius * 1.05);

    // Draw Slices
    svg.selectAll('allSlices')
      .data(data_ready)
      .join('path')
      .attr('d', arc as any)
      .attr('fill', (d: any) => color(d.data[0]) as string)
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('cursor', 'pointer')
      .style('opacity', 0.9)
      .on('mouseover', function(event, d: any) {
        // Zoom effect
        d3.select(this).transition().duration(200).attr('d', arcHover as any);
        
        // Tooltip Content
        const key = d.data[0]; // 'Used' or 'Available'
        const value = d.data[1];
        const label = key === 'Used' ? 'Empenhado' : 'Disponível';
        
        tooltip.html(`
          <span class="font-bold block mb-0.5 text-gray-300 uppercase text-[10px]">${label}</span>
          <span class="text-sm font-semibold">${currencyFormatter.format(value)}</span>
        `)
        .style('opacity', 1)
        .classed('hidden', false);
      })
      .on('mousemove', function(event) {
         // Calculate position relative to container
         const [x, y] = d3.pointer(event, container);
         // Offset slightly so cursor doesn't block text
         tooltip
           .style('left', `${x + 15}px`)
           .style('top', `${y + 15}px`);
      })
      .on('mouseout', function(event, d) {
        // Reset Zoom
        d3.select(this).transition().duration(200).attr('d', arc as any);
        // Hide Tooltip
        tooltip.style('opacity', 0).classed('hidden', true);
      });

    // Add Percentage Text in Center
    svg.append("text")
       .attr("text-anchor", "middle")
       .attr("dy", "-0.2em")
       .style("font-size", "24px")
       .style("font-weight", "bold")
       .style("fill", "#004B85") // SCO Blue text
       .text(`${metrics.percentageUsed.toFixed(1)}%`);
       
    svg.append("text")
       .attr("text-anchor", "middle")
       .attr("dy", "1.2em")
       .style("font-size", "12px")
       .style("fill", "#6B7280") // Gray 500
       .text(`Executado`);
  }

  // --- Actions ---
  goToContracts() { this.navigate.emit('contracts'); }
  goToFinancial() { this.navigate.emit('financial'); }
  goToBudget() { this.navigate.emit('budget'); }
}