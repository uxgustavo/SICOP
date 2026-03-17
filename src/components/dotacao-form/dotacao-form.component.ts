import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';

@Component({
  selector: 'app-dotacao-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dotacao-form.component.html',
})
export class DotacaoFormComponent {
  private fb: FormBuilder = inject(FormBuilder);
  private budgetService = inject(BudgetService);

  // Inputs & Outputs
  contractId = input.required<string>();
  save = output<any>();
  cancel = output<void>();

  dotacaoForm: FormGroup;

  constructor() {
    this.dotacaoForm = this.fb.group({
      dotacao: ['', Validators.required],
      unid_gestora: ['', Validators.required],
      valor_dotacao: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  get f() { return this.dotacaoForm.controls; }

  async onSubmit() {
    if (this.dotacaoForm.valid) {
      const formData = this.dotacaoForm.value;
      const dotacaoToSave = {
        contract_id: this.contractId(),
        ...formData
      };
      
      try {
        await this.budgetService.addDotacao(dotacaoToSave);
        this.save.emit(dotacaoToSave);
      } catch (err) {
        console.error('Error saving dotacao:', err);
      }
    } else {
      this.dotacaoForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
