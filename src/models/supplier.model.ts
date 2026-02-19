export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface Supplier {
  id: string;
  name: string; // Razão Social
  tradeName: string; // Nome Fantasia
  cnpj: string;
  email: string;
  phone: string;
  status: SupplierStatus;
  address?: string;
  category?: string; // Ex: Tecnologia, Serviços Gerais
  since: Date;
}

export function getSupplierStatusLabel(status: SupplierStatus): string {
  switch (status) {
    case 'ACTIVE': return 'Ativo';
    case 'INACTIVE': return 'Inativo';
    case 'BLOCKED': return 'Bloqueado';
    default: return status;
  }
}

export function getSupplierStatusClass(status: SupplierStatus): string {
  switch (status) {
    case 'ACTIVE': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    case 'INACTIVE': return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    case 'BLOCKED': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
}