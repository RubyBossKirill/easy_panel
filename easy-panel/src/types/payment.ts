export interface Payment {
  id: number;
  client_id: number;
  appointment_id: number;
  amount: number;
  service?: string;
  employee_id?: number;
  paid_at: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    telegram?: string;
  };
  appointment?: {
    id: number;
    date: string;
    time: string;
    duration: number;
    status: string;
    service?: string;
    notes?: string;
    employee?: {
      id: number;
      name: string;
      email: string;
    };
  };
}

export interface CreatePaymentData {
  client_id: number;
  appointment_id: number;
  amount: number;
  service?: string;
  employee_id?: number;
  paid_at?: string;
}

export interface PaymentFilters {
  client_id?: number;
  appointment_id?: number;
  employee_id?: number;
  from_date?: string;
  to_date?: string;
}
