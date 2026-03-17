import { inject, Injectable, signal } from '@angular/core';
import { Supplier, SupplierStatus } from '../models/supplier.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private supabaseService = inject(SupabaseService);
  
  private _suppliers = signal<Supplier[]>([]);
  private _loading = signal<boolean>(false);
  
  suppliers = this._suppliers.asReadonly();
  loading = this._loading.asReadonly();

  constructor() {
    this.loadSuppliers();
  }

  async loadSuppliers(): Promise<void> {
    this._loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('fornecedores')
        .select('*');
        
      if (error) throw error;
      
      const suppliers = (data || []).map((raw: any) => ({
        id: raw.id,
        razao_social: raw.razao_social,
        nome_fantasia: raw.nome_fantasia,
        cnpj: raw.cnpj,
        email: raw.email,
        telefone: raw.telefone,
        categoria: raw.categoria,
        endereco: raw.endereco,
        status: raw.status as SupplierStatus,
        desde: new Date(raw.desde)
      }));
      
      this._suppliers.set(suppliers);
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err);
      this._suppliers.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  async updateSupplier(id: string, data: Partial<Supplier>) {
    try {
      const { error } = await this.supabaseService.client
        .from('fornecedores')
        .update(data)
        .eq('id', id);
        
      if (error) throw error;
      
      this._suppliers.update(current => 
        current.map(s => s.id === id ? { ...s, ...data } : s)
      );
    } catch (err) {
      console.error('Erro ao atualizar fornecedor:', err);
    }
  }

  async addSupplier(supplier: Omit<Supplier, 'id'>) {
    try {
      const { data, error } = await this.supabaseService.client
        .from('fornecedores')
        .insert(supplier)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        const newSupplier: Supplier = {
          ...data,
          desde: new Date(data.desde)
        };
        this._suppliers.update(current => [...current, newSupplier]);
      }
    } catch (err) {
      console.error('Erro ao adicionar fornecedor:', err);
    }
  }
}