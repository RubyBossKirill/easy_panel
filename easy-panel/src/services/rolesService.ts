import { apiClient } from '../utils/apiClient';
import { Role, Permission } from '../types';

interface RolesListData {
  roles: Role[];
}

interface RolesListResponse {
  status: boolean;
  data: RolesListData;
}

interface RoleData {
  role: Role;
}

interface RoleResponse {
  status: boolean;
  data?: RoleData;
  message?: string;
  error?: string;
}

interface CreateRoleData {
  name: string;
  permissions: Permission[];
}

interface UpdateRoleData {
  name?: string;
  permissions?: Permission[];
}

export const rolesService = {
  /**
   * Получить список всех ролей
   */
  async getRoles(): Promise<RolesListResponse> {
    const response = await apiClient.get<RolesListData>('/roles');
    return response as RolesListResponse;
  },

  /**
   * Получить роль по ID
   */
  async getRole(id: number): Promise<RoleResponse> {
    const response = await apiClient.get<RoleData>(`/roles/${id}`);
    return response as RoleResponse;
  },

  /**
   * Создать новую роль
   */
  async createRole(data: CreateRoleData): Promise<RoleResponse> {
    const response = await apiClient.post<RoleData>('/roles', { role: data });
    return response as RoleResponse;
  },

  /**
   * Обновить роль
   */
  async updateRole(id: number, data: UpdateRoleData): Promise<RoleResponse> {
    const response = await apiClient.put<RoleData>(`/roles/${id}`, { role: data });
    return response as RoleResponse;
  },

  /**
   * Удалить роль
   */
  async deleteRole(id: number): Promise<{ status: boolean; message?: string; error?: string }> {
    const response = await apiClient.delete(`/roles/${id}`);
    return response as { status: boolean; message?: string; error?: string };
  },
};
