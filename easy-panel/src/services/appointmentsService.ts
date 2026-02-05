import api from '../api/client';
import {
  Appointment,
  CreateAppointmentData,
  UpdateAppointmentData,
  AppointmentFilters,
} from '../types/appointment';

export const appointmentsService = {
  getAll: async (filters?: AppointmentFilters): Promise<Appointment[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.employee_id) params.append('employee_id', String(filters.employee_id));
    if (filters?.client_id) params.append('client_id', String(filters.client_id));
    if (filters?.from_date) params.append('from_date', filters.from_date);
    if (filters?.to_date) params.append('to_date', filters.to_date);

    const query = params.toString();
    const response = await api.get(`/appointments${query ? `?${query}` : ''}`);
    return response.data;
  },

  getById: async (id: number): Promise<Appointment> => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  create: async (data: CreateAppointmentData): Promise<Appointment> => {
    const response = await api.post('/appointments', { appointment: data });
    return response.data;
  },

  update: async (id: number, data: UpdateAppointmentData): Promise<Appointment> => {
    const response = await api.patch(`/appointments/${id}`, { appointment: data });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },

  updateStatus: async (id: number, status: string): Promise<Appointment> => {
    const response = await api.patch(`/appointments/${id}/update_status`, { status });
    return response.data;
  },
};
