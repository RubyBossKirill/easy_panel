import api from '../utils/apiClient';
import { Service, CreateServiceData, UpdateServiceData, ServiceFilters } from '../types/service';

export const servicesService = {
  getAll: async (filters?: ServiceFilters): Promise<Service[]> => {
    const params = new URLSearchParams();
    if (filters?.employee_id) params.append('employee_id', String(filters.employee_id));
    if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));

    const query = params.toString();
    const response = await api.get(`/services${query ? `?${query}` : ''}`);
    return api.extractData<Service[]>(response);
  },

  getById: async (id: number): Promise<Service> => {
    const response = await api.get(`/services/${id}`);
    return api.extractData<Service>(response);
  },

  create: async (data: CreateServiceData): Promise<Service> => {
    const response = await api.post('/services', { service: data });
    return api.extractData<Service>(response);
  },

  update: async (id: number, data: UpdateServiceData): Promise<Service> => {
    const response = await api.put(`/services/${id}`, { service: data });
    return api.extractData<Service>(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await api.delete(`/services/${id}`);
    if (!response.status && response.message) {
      throw new Error(response.message);
    }
  },
};
