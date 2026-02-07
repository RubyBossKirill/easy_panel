import api from '../utils/apiClient';
import { Client, CreateClientData } from '../types/client';

export interface ClientsListParams {
  search?: string;
  sort_by?: 'name' | 'email' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

interface ClientsListResponse {
  clients: Client[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

export const clientsService = {
  getAll: async (): Promise<Client[]> => {
    const result = await clientsService.getClients();
    return result.clients;
  },

  getClients: async (params?: ClientsListParams): Promise<ClientsListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const query = queryParams.toString();
    const response = await api.get(`/clients${query ? `?${query}` : ''}`);
    return api.extractData<ClientsListResponse>(response);
  },

  getClient: async (id: number): Promise<Client> => {
    const response = await api.get(`/clients/${id}`);
    const result = api.extractData<{ client: Client }>(response);
    return result.client;
  },

  createClient: async (data: CreateClientData): Promise<Client> => {
    const response = await api.post('/clients', { client: data });
    const result = api.extractData<{ client: Client }>(response);
    return result.client;
  },

  updateClient: async (id: number, data: Partial<CreateClientData>): Promise<Client> => {
    const response = await api.put(`/clients/${id}`, { client: data });
    const result = api.extractData<{ client: Client }>(response);
    return result.client;
  },

  deleteClient: async (id: number): Promise<void> => {
    const response = await api.delete(`/clients/${id}`);
    if (!response.status && response.message) {
      throw new Error(response.message);
    }
  },
};
