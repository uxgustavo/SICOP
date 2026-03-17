import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ContractService } from '../../services/contract.service';

@Component({
  selector: 'app-aditivo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './aditivo-form.component.html',
})
export class AditivoFormComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private contractService = inject(ContractService);

  // Inputs & Outputs
  contractId = input.required<string>();
  save = output<any>();
  cancel = output<void>();

  aditivoForm: FormGroup;

  constructor() {
    this.aditivoForm = this.fb.group({
      numero_aditivo: ['', Validators.required],
      tipo: ['ALTERACAO', Validators.required],
      data_assinatura: [new Date().toISOString().split('T')[0], Validators.required],
      nova_vigencia: [''],
      valor_aditivo: [0]
    });
  }

  ngOnInit(): void {
    // Watch for 'tipo' changes to toggle 'nova_vigencia' requirement
    this.aditivoForm.get('tipo')?.valueChanges.subscribe(tipo => {
      const novaVigenciaControl = this.aditivoForm.get('nova_vigencia');
      if (tipo === 'PRORROGACAO') {
        novaVigenciaControl?.setValidators([Validators.required]);
      } else {
        novaVigenciaControl?.clearValidators();
      }
      novaVigenciaControl?.updateValueAndValidity();
    });
  }

  get f() { return this.aditivoForm.controls; }

  async onSubmit() {
    if (this.aditivoForm.valid) {
      const formData = this.aditivoForm.value;
      const aditivoToSave = {
        contract_id: this.contractId(),
        ...formData
      };
      
      try {
        await this.contractService.addAditivo(aditivoToSave);
        this.save.emit(aditivoToSave);
      } catch (err) {
        console.error('Error saving aditivo:', err);
      }
    } else {
      this.aditivoForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
