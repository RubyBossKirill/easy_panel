import api from '../api/client';
import { Payment, CreatePaymentData, PaymentFilters } from '../types/payment';

export const paymentsService = {
  getAll: async (filters?: PaymentFilters): Promise<Payment[]> => {
    const params = new URLSearchParams();
    if (filters?.client_id) params.append('client_id', String(filters.client_id));
    if (filters?.appointment_id) params.append('appointment_id', String(filters.appointment_id));
    if (filters?.employee_id) params.append('employee_id', String(filters.employee_id));
    if (filters?.from_date) params.append('from_date', filters.from_date);
    if (filters?.to_date) params.append('to_date', filters.to_date);

    const query = params.toString();
    const response = await api.get(`/payments${query ? `?${query}` : ''}`);
    return response.data;
  },

  getById: async (id: number): Promise<Payment> => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  create: async (data: CreatePaymentData): Promise<Payment> => {
    const response = await api.post('/payments', { payment: data });
    return response.data;
  },
};
