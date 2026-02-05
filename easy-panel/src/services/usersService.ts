import { apiClient } from '../utils/apiClient';
import { User } from '../types';

interface ApiResponse<T = any> {
  status: boolean;
  data?: T;
  message?: string;
  errors?: any;
  error?: string;
  code?: string;
}

export interface UsersListParams {
  search?: string;
  role_id?: number;
  page?: number;
  per_page?: number;
}

export interface UsersListData {
  users: User[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

export interface UsersListResponse {
  status: boolean;
  data: UsersListData;
}

export interface UserData {
  user: User;
}

export interface UserResponse {
  status: boolean;
  data: UserData;
  message?: string;
}

export const usersService = {
  /**
   * Получить список пользователей
   */
  async getUsers(params?: UsersListParams): Promise<UsersListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append('search', params.search);
    if (params?.role_id) queryParams.append('role_id', params.role_id.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<UsersListData>(url);
    return response as UsersListResponse;
  },

  /**
   * Получить пользователя по ID
   */
  async getUser(id: number): Promise<UserResponse> {
    const response = await apiClient.get<UserData>(`/users/${id}`);
    return response as UserResponse;
  },

  /**
   * Создать нового пользователя
   */
  async createUser(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role_id: number;
    phone?: string;
    telegram?: string;
  }): Promise<UserResponse> {
    const response = await apiClient.post<UserData>('/users', { user: data });
    return response as UserResponse;
  },

  /**
   * Обновить пользователя
   */
  async updateUser(id: number, data: {
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
    role_id?: number;
    phone?: string;
    telegram?: string;
  }, currentPassword?: string): Promise<UserResponse> {
    const payload: any = { user: data };
    if (currentPassword) {
      payload.current_password = currentPassword;
    }
    const response = await apiClient.put<UserData>(`/users/${id}`, payload);
    return response as UserResponse;
  },

  /**
   * Удалить пользователя
   */
  async deleteUser(id: number): Promise<ApiResponse<any>> {
    return apiClient.delete(`/users/${id}`);
  },
};
