import { axiosClient } from './axiosClient';
import { ApiResponse, PageResponse, UserProfile, UpdateUserRoleRequest, Role } from '../types/api';

export interface GetUsersParams {
  page?: number;
  size?: number;
  role?: Role | 'ALL';
  keyword?: string;
}

export const adminApi = {
  getUsers: async (params?: GetUsersParams) => {
    const queryParams: Record<string, unknown> = {
      page: params?.page ?? 0,
      size: params?.size ?? 10,
    };

    if (params?.role && params.role !== 'ALL') {
      queryParams.role = params.role;
    }
    if (params?.keyword && params.keyword.trim().length > 0) {
      queryParams.keyword = params.keyword.trim();
    }

    const response = await axiosClient.get<ApiResponse<PageResponse<UserProfile>>>('/admin/users', {
      params: queryParams,
    });
    return response.data;
  },

  updateUserRole: async (userId: string, data: UpdateUserRoleRequest) => {
    const response = await axiosClient.patch<ApiResponse<UserProfile>>(`/admin/users/${userId}/role`, data);
    return response.data;
  },
};

