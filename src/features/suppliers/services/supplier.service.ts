import { inject, Injectable, signal } from '@angular/core';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

import { SupabaseService } from '../../../core/services/supabase.service';
import { Result, ok, fail } from '../../../shared/models/result.model';
import { Supplier, SupplierStatus } from '../../../shared/models/supplier.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private supabaseService = inject(SupabaseService);
  private errorHandler = inject(ErrorHandlerService);
  
  private _suppliers = signal<Supplier[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  
  suppliers = this._suppliers.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  constructor() {
    this.loadSuppliers();
  }

  async loadSuppliers(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const { data, error } = await this.supabaseService.client
        .from('fornecedores')
        .select('*');
        
      if (error) throw error;
      
      const suppliers = (data || []).map(this.mapRawToSupplier);
      
      this._suppliers.set(suppliers);
    } catch (err: any) {
      this.errorHandler.handle(err, 'SupplierService.loadSuppliers');
      this._error.set(err.message || 'Erro ao carregar fornecedores');
      this._suppliers.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Result<null>> {
    try {
      const { error } = await this.supabaseService.client
        .from('fornecedores')
        .update(data)
        .eq('id', id);
        
      if (error) throw error;
      
      this._suppliers.update(current => 
        current.map(s => s.id === id ? { ...s, ...data } : s)
      );
      return ok(null);
    } catch (err: any) {
      this.errorHandler.handle(err, 'SupplierService.updateSupplier');
      return fail(err.message || 'Erro ao atualizar fornecedor');
    }
  }

  async addSupplier(supplier: Omit<Supplier, 'id'>): Promise<Result<null>> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('fornecedores')
        .insert(supplier)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        const newSupplier: Supplier = this.mapRawToSupplier(data);
        this._suppliers.update(current => [...current, newSupplier]);
      }
      return ok(null);
    } catch (err: any) {
      this.errorHandler.handle(err, 'SupplierService.addSupplier');
      return fail(err.message || 'Erro ao adicionar fornecedor');
    }
  }

  private mapRawToSupplier(raw: any): Supplier {
    return {
      id: raw.id,
      razao_social: raw.razao_social || '',
      nome_fantasia: raw.nome_fantasia || '',
      cnpj: raw.cnpj || '',
      email: raw.email || '',
      telefone: raw.telefone || '',
      categoria: raw.categoria || '',
      endereco: raw.endereco || '',
      status: (raw.status as SupplierStatus) || 'ACTIVE',
      desde: raw.desde ? new Date(raw.desde) : new Date()
    };
  }
}