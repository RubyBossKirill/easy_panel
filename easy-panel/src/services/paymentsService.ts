import api from '../utils/apiClient';
import { Payment, CreatePaymentData, PaymentFilters } from '../types/payment';

interface PaymentsListResponse {
  payments: Payment[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

export const paymentsService = {
  getAll: async (filters?: PaymentFilters): Promise<PaymentsListResponse> => {
    const params = new URLSearchParams();
    if (filters?.client_id) params.append('client_id', String(filters.client_id));
    if (filters?.appointment_id) params.append('appointment_id', String(filters.appointment_id));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.from_date) params.append('from_date', filters.from_date);
    if (filters?.to_date) params.append('to_date', filters.to_date);

    const query = params.toString();
    const response = await api.get(`/payments${query ? `?${query}` : ''}`);
    return api.extractData<PaymentsListResponse>(response);
  },

  getById: async (id: number): Promise<Payment> => {
    const response = await api.get(`/payments/${id}`);
    return api.extractData<Payment>(response);
  },

  create: async (data: CreatePaymentData): Promise<Payment> => {
    const response = await api.post('/payments', { payment: data });
    return api.extractData<Payment>(response);
  },

  getByAppointmentId: async (appointmentId: number): Promise<Payment | null> => {
    try {
      const result = await paymentsService.getAll({ appointment_id: appointmentId });
      return result.payments.length > 0 ? result.payments[0] : null;
    } catch {
      return null;
    }
  },
};
