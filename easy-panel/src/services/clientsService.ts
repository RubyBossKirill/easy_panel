import { apiClient } from '../utils/apiClient';

interface ApiResponse<T = any> {
  status: boolean;
  data?: T;
  message?: string;
  errors?: any;
  error?: string;
  code?: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  telegram: string;
  notes: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  stats?: {
    total_visits: number;
    pending_appointments: number;
    confirmed_appointments: number;
    last_visit: string | null;
    total_spent: number;
  };
  appointments?: Array<{
    id: number;
    date: string;
    time: string;
    service: string;
    status: string;
    employee_id: number;
  }>;
  payments?: Array<{
    id: number;
    amount: number;
    service: string;
    paid_at: string;
    employee_id: number;
  }>;
}

export interface ClientsListParams {
  search?: string;
  sort_by?: 'name' | 'email' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface ClientsListData {
  clients: Client[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

export interface ClientsListResponse {
  status: boolean;
  data: ClientsListData;
}

export interface ClientData {
  client: Client;
}

export interface ClientResponse {
  status: boolean;
  data: ClientData;
  message?: string;
}

export const clientsService = {
  /**
   * Получить список всех клиентов (упрощенный метод)
   */
  async getAll(): Promise<Client[]> {
    const response = await this.getClients();
    // Backend returns {status: true, data: {clients: [...], ...}}
    if (response.status && response.data && response.data.clients) {
      return response.data.clients;
    }
    return [];
  },

  /**
   * Получить список клиентов
   */
  async getClients(params?: ClientsListParams): Promise<ClientsListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const url = `/clients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ClientsListData>(url);
    return response as ClientsListResponse;
  },

  /**
   * Получить клиента по ID
   */
  async getClient(id: number): Promise<ClientResponse> {
    const response = await apiClient.get<ClientData>(`/clients/${id}`);
    return response as ClientResponse;
  },

  /**
   * Создать нового клиента
   */
  async createClient(data: {
    name: string;
    email?: string;
    phone?: string;
    telegram?: string;
    notes?: string;
  }): Promise<ClientResponse> {
    const response = await apiClient.post<ClientData>('/clients', { client: data });
    return response as ClientResponse;
  },

  /**
   * Обновить клиента
   */
  async updateClient(id: number, data: {
    name?: string;
    email?: string;
    phone?: string;
    telegram?: string;
    notes?: string;
  }): Promise<ClientResponse> {
    const response = await apiClient.put<ClientData>(`/clients/${id}`, { client: data });
    return response as ClientResponse;
  },

  /**
   * Удалить клиента
   */
  async deleteClient(id: number): Promise<ApiResponse<any>> {
    return apiClient.delete(`/clients/${id}`);
  },
};
