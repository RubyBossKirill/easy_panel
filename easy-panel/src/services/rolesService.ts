import { apiClient } from '../utils/apiClient';
import { Role } from '../types';

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
  data: RoleData;
  message?: string;
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
};
