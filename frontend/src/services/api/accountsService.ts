import { apiClient } from './client';
import type { ApiResponse, ProvisionUserPayload, ProvisionedUserData } from '../../types';

const BASE_URL = '/accounts';

export const accountsService = {
  provisionUser(payload: ProvisionUserPayload) {
    return apiClient.post<ApiResponse<ProvisionedUserData>>(`${BASE_URL}/admin/provision_user`, payload);
  },
};
