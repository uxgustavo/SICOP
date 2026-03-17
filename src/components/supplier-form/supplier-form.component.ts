import { Component, inject, input, output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Supplier, SupplierStatus } from '../../models/supplier.model';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './supplier-form.component.html',
})
export class SupplierFormComponent implements OnInit, OnChanges {
  private fb: FormBuilder = inject(FormBuilder);

  // Inputs & Outputs
  supplier = input<Supplier | null>(null);
  save = output<Partial<Supplier>>();
  cancel = output<void>();

  // Form
  supplierForm: FormGroup;

  constructor() {
    this.supplierForm = this.fb.group({
      razao_social: ['', Validators.required],
      nome_fantasia: ['', Validators.required],
      cnpj: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', Validators.required],
      categoria: ['', Validators.required],
      endereco: ['', Validators.required],
      status: ['ACTIVE', Validators.required],
      desde: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit(): void {
    this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['supplier']) {
      this.populateForm();
    }
  }

  private populateForm() {
    const current = this.supplier();
    if (current) {
      this.supplierForm.patchValue({
        razao_social: current.razao_social,
        nome_fantasia: current.nome_fantasia,
        cnpj: current.cnpj,
        email: current.email,
        telefone: current.telefone,
        categoria: current.categoria,
        endereco: current.endereco,
        status: current.status,
        desde: current.desde ? new Date(current.desde).toISOString().split('T')[0] : ''
      });
    } else {
      this.supplierForm.reset({
        status: 'ACTIVE',
        desde: new Date().toISOString().split('T')[0]
      });
    }
  }

  // Getters
  get f() { return this.supplierForm.controls; }

  // Masks
  onCnpjInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 14) value = value.substring(0, 14);
    
    if (value.length > 12) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
    } else if (value.length > 8) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4}).*/, '$1.$2.$3/$4');
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{3})(\d{1,3}).*/, '$1.$2.$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{1,3}).*/, '$1.$2');
    }
    
    this.supplierForm.get('cnpj')?.setValue(value, { emitEvent: false });
  }

  onPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4})(\d{1,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{1,5}).*/, '($1) $2');
    } else if (value.length > 0) {
      value = value.replace(/^(\d{1,2}).*/, '($1');
    }
    
    this.supplierForm.get('telefone')?.setValue(value, { emitEvent: false });
  }

  // Actions
  onSubmit() {
    if (this.supplierForm.valid) {
      this.save.emit(this.supplierForm.value);
    } else {
      this.supplierForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
