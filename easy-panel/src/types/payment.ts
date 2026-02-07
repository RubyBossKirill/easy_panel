import { Service } from './service';

export interface Payment {
  id: number;
  client_id: number;
  appointment_id: number;
  service_id?: number;
  amount: string;
  discount_type?: 'percent' | 'amount';
  discount_value?: number;
  discount_amount?: string;
  final_amount: string;
  status: 'pending' | 'paid' | 'cancelled' | 'failed';
  payment_method: 'online' | 'cash' | 'card' | 'transfer';
  payment_link?: string;
  prodamus_order_id?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
  };
  service?: Service;
  appointment?: {
    id: number;
    date: string;
    time: string;
    duration: number;
    status?: string | null;
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
  service_id: number;
  payment_method?: 'online' | 'cash' | 'card' | 'transfer';
  discount_type?: 'percent' | 'amount';
  discount_value?: number;
}

export interface PaymentFilters {
  client_id?: number;
  appointment_id?: number;
  status?: 'pending' | 'paid' | 'cancelled' | 'failed';
  from_date?: string;
  to_date?: string;
}
