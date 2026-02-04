import { createHmacSignature } from './cryptoUtils';

// Конфигурация API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.easypanel.com';
const API_SECRET = process.env.REACT_APP_API_SECRET || '';

// Типы для API запросов
export interface ApiRequest {
  event: string;
  data: any;
  timestamp?: number;
  signature?: string;
  csrfToken?: string;
}

export interface ApiResponse<T = any> {
  status: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

// Создание HMAC подписи используя Web Crypto API
export async function createSignature(data: any, timestamp: number): Promise<string> {
  if (!API_SECRET) {
    console.warn('API_SECRET не настроен, подписи отключены');
    return '';
  }
  
  try {
    const dataString = JSON.stringify(data);
    const message = dataString + timestamp;
    
    return await createHmacSignature(message, API_SECRET);
  } catch (error) {
    console.error('Ошибка создания подписи:', error);
    return '';
  }
}

// Безопасная отправка запроса
export async function sendSecureRequest<T = any>(
  event: string, 
  data: any, 
  options: { 
    requireSignature?: boolean; 
    requireCsrf?: boolean; 
    csrfToken?: string; 
  } = {}
): Promise<ApiResponse<T>> {
  try {
    const timestamp = Date.now();
    const requestData: ApiRequest = {
      event,
      data,
      timestamp
    };

    // Добавляем подпись если требуется
    if (options.requireSignature) {
      requestData.signature = await createSignature(data, timestamp);
    }

    // Добавляем CSRF токен если требуется
    if (options.requireCsrf && options.csrfToken) {
      requestData.csrfToken = options.csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/webhook/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sessionToken') || ''}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: ApiResponse<T> = await response.json();
    return result;
  } catch (error) {
    console.error('API Error:', error);
    return {
      status: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

// Безопасная аутентификация
export async function secureLogin(email: string, password: string): Promise<ApiResponse> {
  return sendSecureRequest('auth_login', {
    email,
    password
  }, {
    requireSignature: true,
    requireCsrf: true
  });
}

// Безопасная регистрация
export async function secureRegister(userData: {
  name: string;
  email: string;
  password: string;
  inviteCode?: string;
}): Promise<ApiResponse> {
  return sendSecureRequest('auth_register', {
    name: userData.name,
    email: userData.email,
    password: userData.password,
    inviteCode: userData.inviteCode
  }, {
    requireSignature: true,
    requireCsrf: true
  });
}

// Проверка сессии
export async function validateSession(sessionToken: string): Promise<ApiResponse> {
  return sendSecureRequest('auth_validate_session', {
    sessionToken
  }, {
    requireSignature: true
  });
}

// Обновление токена
export async function refreshToken(refreshToken: string): Promise<ApiResponse> {
  return sendSecureRequest('auth_refresh_token', {
    refreshToken
  }, {
    requireSignature: true
  });
}

// Выход из системы
export async function secureLogout(sessionToken: string, refreshToken?: string): Promise<ApiResponse> {
  return sendSecureRequest('auth_logout', {
    sessionToken,
    refreshToken
  }, {
    requireSignature: true,
    requireCsrf: true
  });
}

// Получение CSRF токена
export async function getCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.csrfToken;
    }
  } catch (error) {
    console.warn('Не удалось получить CSRF токен:', error);
  }
  
  return null;
}

// Утилита для работы с ошибками
export function handleApiError(response: ApiResponse): string {
  if (response.error) {
    return response.error;
  }
  
  if (response.code) {
    const errorMessages: Record<string, string> = {
      'AUTH_INVALID_CREDENTIALS': 'Неверный email или пароль',
      'AUTH_USER_EXISTS': 'Пользователь с таким email уже существует',
      'AUTH_SESSION_INVALID': 'Сессия истекла или недействительна',
      'AUTH_INSUFFICIENT_PERMISSIONS': 'Недостаточно прав для выполнения операции',
      'AUTH_TOO_MANY_ATTEMPTS': 'Слишком много попыток входа. Попробуйте позже',
      'AUTH_INVALID_SIGNATURE': 'Ошибка безопасности запроса',
      'AUTH_INVALID_CSRF': 'Ошибка безопасности токена'
    };
    
    return errorMessages[response.code] || 'Неизвестная ошибка';
  }
  
  return 'Произошла ошибка при выполнении запроса';
} 