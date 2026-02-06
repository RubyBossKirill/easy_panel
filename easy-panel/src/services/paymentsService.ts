import api from '../utils/apiClient';
import { Payment, CreatePaymentData, PaymentFilters } from '../types/payment';

export const paymentsService = {
  getAll: async (filters?: PaymentFilters): Promise<Payment[]> => {
    const params = new URLSearchParams();
    if (filters?.client_id) params.append('client_id', String(filters.client_id));
    if (filters?.appointment_id) params.append('appointment_id', String(filters.appointment_id));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.from_date) params.append('from_date', filters.from_date);
    if (filters?.to_date) params.append('to_date', filters.to_date);

    const query = params.toString();
    const response = await api.get(`/payments${query ? `?${query}` : ''}`);
    return Array.isArray(response) ? response : response.data;
  },

  getById: async (id: number): Promise<Payment> => {
    const response = await api.get(`/payments/${id}`);
    return (response as any).id ? response : response.data;
  },

  create: async (data: CreatePaymentData): Promise<Payment> => {
    const response = await api.post('/payments', { payment: data });
    return (response as any).id ? response : response.data;
  },

  // Получить платеж по appointment_id
  getByAppointmentId: async (appointmentId: number): Promise<Payment | null> => {
    try {
      const payments = await paymentsService.getAll({ appointment_id: appointmentId });
      return payments.length > 0 ? payments[0] : null;
    } catch (error) {
      console.error('Ошибка получения платежа по appointment_id:', error);
      return null;
    }
  },
};
