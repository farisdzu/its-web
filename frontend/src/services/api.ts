import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { TaskCardData } from '../components/dashboard/TaskCard';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const REQUEST_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
export interface User {
  id: number;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: 'admin' | 'user';
  employee_id: string | null;
  org_unit_id?: number | null;
  org_unit_name?: string | null;
  title?: string | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    token_type: string;
    expires_in: number;
    redirect_to: string;
  };
  requires_force_logout?: boolean;
  existing_session?: {
    device_name: string;
    ip_address: string;
    last_activity: string;
  };
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface OrgUnitTreeNode {
  id: number;
  name: string;
  type: string | null;
  code: string | null;
  order: number;
  is_active: boolean;
  parent_id: number | null; // Backward compatibility
  parent_ids?: number[]; // Multiple parents
  user_count?: number;
  children: OrgUnitTreeNode[];
}

export interface OrgUnitPayload {
  name: string;
  parent_id?: number | null; // Backward compatibility
  parent_ids?: number[]; // Multiple parents
  type?: string | null;
  code?: string | null;
  order?: number | null;
  is_active?: boolean;
}

export interface OrgUnitWithUsers extends OrgUnitTreeNode {
  users: UserListItem[];
}

export interface AssignUserPayload {
  org_unit_id: number;
  title?: string | null;
}

const TOKEN_KEY = 'its_auth_token';
const USER_KEY = 'its_user';
const TOKEN_EXPIRY_KEY = 'its_token_expiry';
const storage = localStorage;

export const getToken = (): string | null => {
  return storage.getItem(TOKEN_KEY);
};

export const setToken = (token: string, expiresIn: number): void => {
  storage.setItem(TOKEN_KEY, token);
  const expiryTime = Date.now() + (expiresIn * 1000) - (2 * 60 * 1000);
  storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

export const removeToken = (): void => {
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(TOKEN_EXPIRY_KEY);
};

export const isTokenExpiringSoon = (): boolean => {
  const expiryTime = storage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryTime) return true;
  return Date.now() >= parseInt(expiryTime, 10);
};

export const getStoredUser = (): User | null => {
  const user = storage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user: User): void => {
  storage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeStoredUser = (): void => {
  storage.removeItem(USER_KEY);
};

export const clearAuthData = (): void => {
  removeToken();
  removeStoredUser();
};

const orgUnitApi = {
  getTree: async (): Promise<ApiResponse<OrgUnitTreeNode[]>> => {
    const response = await api.get<ApiResponse<OrgUnitTreeNode[]>>('/org-units');
    return response.data;
  },
  getUsers: async (id: number): Promise<ApiResponse<OrgUnitWithUsers>> => {
    const response = await api.get<ApiResponse<OrgUnitWithUsers>>(`/org-units/${id}`);
    return response.data;
  },
  create: async (payload: OrgUnitPayload): Promise<ApiResponse<OrgUnitTreeNode>> => {
    const response = await api.post<ApiResponse<OrgUnitTreeNode>>('/org-units', payload);
    return response.data;
  },
  update: async (id: number, payload: Partial<OrgUnitPayload>): Promise<ApiResponse<OrgUnitTreeNode>> => {
    const response = await api.patch<ApiResponse<OrgUnitTreeNode>>(`/org-units/${id}`, payload);
    return response.data;
  },
  remove: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/org-units/${id}`);
    return response.data;
  },
};

export interface CreateUserPayload {
  name: string;
  email: string;
  username?: string | null;
  phone?: string | null;
  employee_id?: string | null;
  role: 'admin' | 'user';
  password: string;
  org_unit_id?: number | null;
  title?: string | null;
  is_active?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  username?: string | null;
  phone?: string | null;
  employee_id?: string | null;
  role?: 'admin' | 'user';
  password?: string;
  org_unit_id?: number | null;
  title?: string | null;
  is_active?: boolean;
}

export interface UserListItem {
  id: number;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  employee_id: string | null;
  role: 'admin' | 'user';
  org_unit_id: number | null;
  org_unit_name: string | null;
  title: string | null;
  is_active: boolean;
}

export interface ImportUserValidationError {
  row: number;
  column: string;
  message: string;
}

export interface ImportUserPreviewData {
  no: number;
  nama: string;
  email: string;
  username?: string | null;
  telepon?: string | null;
  employee_id?: string | null;
  jabatan?: string | null;
  password: string;
}

export interface ImportUserPreviewResponse {
  success: boolean;
  data?: ImportUserPreviewData[];
  errors?: ImportUserValidationError[];
  message?: string;
}

const userApi = {
  list: async (params?: { 
    search?: string; 
    role?: string; 
    page?: number; 
    per_page?: number;
    include_admin?: boolean;
    include_inactive?: boolean;
  }): Promise<PaginatedResponse<UserListItem[]>> => {
    const response = await api.get<PaginatedResponse<UserListItem[]>>('/users', { params });
    return response.data;
  },
  store: async (payload: CreateUserPayload): Promise<ApiResponse<UserListItem>> => {
    const response = await api.post<ApiResponse<UserListItem>>('/users', payload);
    return response.data;
  },
  update: async (id: number, payload: UpdateUserPayload): Promise<ApiResponse<UserListItem>> => {
    const response = await api.patch<ApiResponse<UserListItem>>(`/users/${id}`, payload);
    return response.data;
  },
  destroy: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/users/${id}`);
    return response.data;
  },
  assign: async (id: number, payload: AssignUserPayload): Promise<ApiResponse<UserListItem>> => {
    const response = await api.patch<ApiResponse<UserListItem>>(`/users/${id}/assign`, payload);
    return response.data;
  },
  unassign: async (id: number): Promise<ApiResponse> => {
    const response = await api.patch<ApiResponse>(`/users/${id}/unassign`);
    return response.data;
  },
  downloadTemplate: async (): Promise<void> => {
    const response = await api.get('/users/import/template', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Import_User.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  previewImport: async (file: File): Promise<ImportUserPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ImportUserPreviewResponse>('/users/import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  import: async (file: File): Promise<ApiResponse<{ imported: number; failed: number }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ApiResponse<{ imported: number; failed: number }>>('/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  checkDuplicate: async (field: 'email' | 'username' | 'employee_id', value: string): Promise<ApiResponse<{ exists: boolean }>> => {
    const response = await api.get<ApiResponse<{ exists: boolean }>>(`/users/check-duplicate`, {
      params: { field, value },
    });
    return response.data;
  },
};

let isRefreshing = false;
let refreshPromise: Promise<RefreshResponse | void> | null = null;

interface RetryConfig {
  retryCount: number;
  retryDelay: number;
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    _retryCount?: number;
  }
}

const retryRequest = async (
  error: AxiosError,
  instance: AxiosInstance
): Promise<AxiosResponse> => {
  const config = error.config as InternalAxiosRequestConfig & RetryConfig;
  
  if (!config || config._retry || (config._retryCount && config._retryCount >= MAX_RETRIES)) {
    throw error;
  }

  if (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT'
  ) {
    config._retry = true;
    config._retryCount = (config._retryCount || 0) + 1;
    const delay = RETRY_DELAY * Math.pow(2, config._retryCount - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return instance(config);
  }

  throw error;
};

const logError = (_error: AxiosError, _context?: string): void => {
  // Error logging disabled for performance
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    const endpoint = config.url || '';

    if (
      token &&
      !endpoint.includes('/auth/refresh') &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/check-session') &&
      isTokenExpiringSoon()
    ) {
      if (isRefreshing && refreshPromise) {
        try {
          await refreshPromise;
        } catch {
          // Continue with current token if refresh fails
        }
      } else if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = authApi.refresh().catch(() => {
          // Continue with current token if refresh fails
        }).finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });

        try {
          await refreshPromise;
        } catch {
          // Continue with current token if refresh fails
        }
      }
    }

    const currentToken = getToken();
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }

    return config;
  },
  (error: AxiosError) => {
    logError(error, 'Request Interceptor');
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    if (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT'
    ) {
      try {
        return await retryRequest(error, api);
      } catch (retryError) {
        logError(retryError as AxiosError, 'Retry Failed');
    throw new Error(
      'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan dan CORS sudah dikonfigurasi dengan benar.'
    );
  }
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      const endpoint = error.config?.url || '';

      switch (status) {
        case 409:
          if (endpoint.includes('/auth/login') && data?.requires_force_logout) {
            const loginError = error as AxiosError<LoginResponse>;
            return Promise.reject(loginError);
          }
          logError(error, '409 Conflict');
          throw new Error(data?.message || 'Konflik terjadi. Silakan coba lagi.');

        case 401:
          const errorMessage = data?.message || 'Session expired. Please login again.';
      if (!window.location.pathname.includes('/signin')) {
            clearAuthData();
        window.location.href = '/signin';
      }

          logError(error, '401 Unauthorized');
          throw new Error(errorMessage);

        case 403:
          logError(error, '403 Forbidden');
          throw new Error(data?.message || 'Anda tidak memiliki akses untuk melakukan tindakan ini.');

        case 404:
          logError(error, '404 Not Found');
          throw new Error(data?.message || 'Data tidak ditemukan.');

        case 422:
          logError(error, '422 Validation Error');
          // Don't throw new Error, keep the original axios error so error.response.data.errors is preserved
          // This allows components to access the full validation errors
          return Promise.reject(error);

        case 429:
          logError(error, '429 Rate Limit');
      throw new Error('Terlalu banyak request. Silakan tunggu beberapa saat.');

        case 500:
        case 502:
        case 503:
          logError(error, `${status} Server Error`);
      throw new Error(
        data?.message || 
        'Terjadi kesalahan di server. Silakan coba lagi atau hubungi administrator.'
      );

        default:
          logError(error, `HTTP ${status}`);
          throw new Error(data?.message || `Error: ${error.response.statusText}`);
      }
    }

    logError(error, 'Request Error');
    throw new Error(
      error.message ||
      'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan dan CORS sudah dikonfigurasi dengan benar.'
    );
  }
);

export async function apiFetch<T>(
  endpoint: string,
  config?: AxiosRequestConfig,
  skipRefresh: boolean = false
): Promise<T> {
  const requestConfig: AxiosRequestConfig = {
    ...config,
    ...(skipRefresh && { headers: { ...config?.headers, 'X-Skip-Refresh': 'true' } }),
  };

  try {
    const response = await api.request<T>({
      url: endpoint,
      ...requestConfig,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
}
export const authApi = {
  login: async (
    email: string,
    password: string,
    forceLogout: boolean = false,
    deviceName?: string
  ): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
        force_logout: forceLogout,
        device_name: deviceName,
      });

      if (response.data.success && response.data.data) {
        setToken(response.data.data.token, response.data.data.expires_in);
        setStoredUser(response.data.data.user);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const data = error.response.data as LoginResponse;
        if (data?.requires_force_logout && data?.existing_session) {
          return data;
        }
      }

      throw error;
    }
  },

  refresh: async (): Promise<RefreshResponse> => {
    const response = await api.post<RefreshResponse>('/auth/refresh', {}, {
      headers: { 'X-Skip-Refresh': 'true' },
    });

    if (response.data.success && response.data.data) {
      setToken(response.data.data.token, response.data.data.expires_in);
    }

    return response.data;
  },

  checkSession: async (email: string): Promise<ApiResponse<{
    has_active_session: boolean;
    session_info?: {
      device_name: string;
      ip_address: string;
      last_activity: string;
    };
  }>> => {
    const response = await api.post('/auth/check-session', { email }, {
      headers: { 'X-Skip-Refresh': 'true' },
    });
    return response.data;
  },

  me: async (): Promise<ApiResponse<User & { redirect_to: string }>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    try {
      const response = await api.post<ApiResponse>('/auth/logout', {}, {
        headers: { 'X-Skip-Refresh': 'true' },
      });
      return response.data;
    } finally {
      clearAuthData();
    }
  },

  updateProfile: async (data: {
    name: string;
    username?: string | null;
    email: string;
    phone?: string | null;
    org_unit_id?: number | null;
    title?: string | null;
  }): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data);

    if (response.data.success && response.data.data) {
      setStoredUser(response.data.data);
    }

    return response.data;
  },

  changePassword: async (data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>('/auth/change-password', data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<ApiResponse<{ avatar: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post<ApiResponse<{ avatar: string }>>('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success && response.data.data) {
      const currentUser = getStoredUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, avatar: response.data.data.avatar };
        setStoredUser(updatedUser);
      }
    }

    return response.data;
  },

  deleteAvatar: async (): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>('/auth/avatar');

    if (response.data.success) {
      const currentUser = getStoredUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, avatar: null };
        setStoredUser(updatedUser);
      }
    }

    return response.data;
  },

  requestPasswordResetOTP: async (email: string): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/password/reset/request', { email }, {
      headers: { 'X-Skip-Refresh': 'true' },
    });
    return response.data;
  },

  verifyPasswordResetOTP: async (email: string, otp: string): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/password/reset/verify', { email, otp }, {
      headers: { 'X-Skip-Refresh': 'true' },
    });
    return response.data;
  },

  resetPassword: async (data: {
    email: string;
    otp: string;
    password: string;
    password_confirmation: string;
  }): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/password/reset', data, {
      headers: { 'X-Skip-Refresh': 'true' },
    });
    return response.data;
  },
};

export interface CreateTaskPayload {
  type: 'tugas' | 'agenda'; // NEW: required
  title: string;
  description?: string;
  
  // Fields for Tugas
  due_date?: string;
  progress?: number;
  priority?: 'tinggi' | 'sedang' | 'rendah';
  status?: 'baru' | 'proses' | 'review' | 'selesai';
  
  // Fields for Agenda
  start_time?: string; // Format: "HH:mm"
  end_time?: string; // Format: "HH:mm"
  meeting_link?: string;
  
  assigned_to?: number | null;
  assignee_ids?: number[];
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

export interface TaskDetailData extends TaskCardData {
  attachments?: TaskAttachment[];
}

const taskApi = {
  list: async (params?: {
    status?: string;
    priority?: string;
    type?: string;
    item_type?: 'tugas' | 'agenda'; // NEW: filter by item type
    search?: string;
  }): Promise<ApiResponse<TaskCardData[]>> => {
    const response = await api.get<ApiResponse<TaskCardData[]>>('/tasks', { params });
    return response.data;
  },
  store: async (payload: CreateTaskPayload): Promise<ApiResponse<TaskCardData>> => {
    const response = await api.post<ApiResponse<TaskCardData>>('/tasks', payload);
    return response.data;
  },
  show: async (id: number): Promise<ApiResponse<TaskDetailData>> => {
    const response = await api.get<ApiResponse<TaskDetailData>>(`/tasks/${id}`);
    return response.data;
  },
  update: async (id: number, payload: UpdateTaskPayload): Promise<ApiResponse<TaskCardData>> => {
    const response = await api.patch<ApiResponse<TaskCardData>>(`/tasks/${id}`, payload);
    return response.data;
  },
  destroy: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/tasks/${id}`);
    return response.data;
  },
  updateStatus: async (id: number, status: 'baru' | 'proses' | 'review' | 'selesai'): Promise<ApiResponse<TaskCardData>> => {
    const response = await api.patch<ApiResponse<TaskCardData>>(`/tasks/${id}/status`, { status });
    return response.data;
  },
};

// Task Attachment interfaces
export interface TaskAttachment {
  id: number;
  task_id: number;
  type: 'file' | 'link';
  name: string;
  path?: string | null;
  url?: string | null;
  mime_type?: string | null;
  size?: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
    avatar?: string | null;
  };
}

export interface AddLinkPayload {
  url: string;
  name?: string;
}

// Task Attachment API
const taskAttachmentApi = {
  uploadFile: async (taskId: number, file: File): Promise<ApiResponse<TaskAttachment>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ApiResponse<TaskAttachment>>(
      `/tasks/${taskId}/attachments/file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  addLink: async (taskId: number, payload: AddLinkPayload): Promise<ApiResponse<TaskAttachment>> => {
    const response = await api.post<ApiResponse<TaskAttachment>>(
      `/tasks/${taskId}/attachments/link`,
      payload
    );
    return response.data;
  },

  delete: async (taskId: number, attachmentId: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/tasks/${taskId}/attachments/${attachmentId}`
    );
    return response.data;
  },
};

export { api, orgUnitApi, userApi, taskApi, taskAttachmentApi };
export default api;
