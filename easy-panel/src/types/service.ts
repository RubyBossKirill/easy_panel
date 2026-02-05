export interface Service {
  id: number;
  name: string;
  description: string;
  employee_id: number;
  price: string;
  duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  employee?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateServiceData {
  name: string;
  description: string;
  employee_id?: number;
  price: number;
  duration: number;
  is_active?: boolean;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  employee_id?: number;
  price?: number;
  duration?: number;
  is_active?: boolean;
}

export interface ServiceFilters {
  employee_id?: number;
  is_active?: boolean;
}
