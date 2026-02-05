import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '../config/api';

interface ApiResponse<T = any> {
  status: boolean;
  data?: T;
  message?: string;
  errors?: any;
  error?: string;
  code?: string;
}

class ApiClient {
  private baseURL: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  private getHeaders(isAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (isAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearTokens();
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.REFRESH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status && data.data) {
          this.setTokens(data.data.access_token, data.data.refresh_token);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data.user));
          return data.data.access_token;
        }
      }

      // Если refresh не удался - очищаем токены
      this.clearTokens();
      window.location.href = '/login';
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      window.location.href = '/login';
      return null;
    }
  }

  private async handleResponse<T>(response: Response, originalRequest?: () => Promise<Response>): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      // Если 401 и это не refresh endpoint - пробуем обновить токен
      if (response.status === 401 && originalRequest) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;

          if (newToken) {
            this.onRefreshed(newToken);
            // Повторяем оригинальный запрос с новым токеном
            const retryResponse = await originalRequest();
            return this.handleResponse<T>(retryResponse);
          }
        } else {
          // Ждем пока другой запрос обновит токен
          return new Promise((resolve) => {
            this.addRefreshSubscriber(async () => {
              const retryResponse = await originalRequest();
              const result = await this.handleResponse<T>(retryResponse);
              resolve(result);
            });
          });
        }
      }

      if (!response.ok) {
        return {
          status: false,
          message: data.message || data.error || 'An error occurred',
          error: data.error,
          code: data.code,
          errors: data.errors,
        };
      }

      return data;
    }

    if (!response.ok) {
      return {
        status: false,
        message: `HTTP error! status: ${response.status}`,
      };
    }

    return {
      status: true,
    };
  }

  async get<T = any>(endpoint: string, isAuth: boolean = true): Promise<ApiResponse<T>> {
    const makeRequest = () => fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(isAuth),
    });

    try {
      const response = await makeRequest();
      return this.handleResponse<T>(response, isAuth ? makeRequest : undefined);
    } catch (error) {
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async post<T = any>(endpoint: string, data?: any, isAuth: boolean = true): Promise<ApiResponse<T>> {
    const makeRequest = () => fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(isAuth),
      body: data ? JSON.stringify(data) : undefined,
    });

    try {
      const response = await makeRequest();
      return this.handleResponse<T>(response, isAuth ? makeRequest : undefined);
    } catch (error) {
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async put<T = any>(endpoint: string, data?: any, isAuth: boolean = true): Promise<ApiResponse<T>> {
    const makeRequest = () => fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(isAuth),
      body: data ? JSON.stringify(data) : undefined,
    });

    try {
      const response = await makeRequest();
      return this.handleResponse<T>(response, isAuth ? makeRequest : undefined);
    } catch (error) {
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async patch<T = any>(endpoint: string, data?: any, isAuth: boolean = true): Promise<ApiResponse<T>> {
    const makeRequest = () => fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(isAuth),
      body: data ? JSON.stringify(data) : undefined,
    });

    try {
      const response = await makeRequest();
      return this.handleResponse<T>(response, isAuth ? makeRequest : undefined);
    } catch (error) {
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async delete<T = any>(endpoint: string, isAuth: boolean = true): Promise<ApiResponse<T>> {
    const makeRequest = () => fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(isAuth),
    });

    try {
      const response = await makeRequest();
      return this.handleResponse<T>(response, isAuth ? makeRequest : undefined);
    } catch (error) {
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    // Сохраняем время истечения (24 часа от текущего момента)
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
  }

  clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  }

  // Legacy методы для обратной совместимости
  setToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  removeToken(): void {
    this.clearTokens();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
