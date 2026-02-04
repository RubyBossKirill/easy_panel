import { User } from '../types';
import apiClient from './apiClient';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api';

interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function login(email: string, password: string) {
  const response = await apiClient.post<AuthResponse>(
    API_ENDPOINTS.LOGIN,
    { email, password },
    false
  );

  if (response.status && response.data) {
    // Сохраняем оба токена и пользователя
    apiClient.setTokens(response.data.access_token, response.data.refresh_token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
    return { success: true };
  }

  return {
    success: false,
    message: response.message || response.error || 'Неверный email или пароль',
  };
}

export async function register({ email, name, password }: { email: string; name: string; password: string }) {
  const response = await apiClient.post<AuthResponse>(
    API_ENDPOINTS.REGISTER,
    { user: { email, name, password } },
    false
  );

  if (response.status && response.data) {
    // Сохраняем оба токена и пользователя
    apiClient.setTokens(response.data.access_token, response.data.refresh_token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
    return { success: true };
  }

  return {
    success: false,
    message: response.message || response.error || 'Ошибка при регистрации',
  };
}

export async function logout() {
  try {
    // Отправляем запрос на сервер для отзыва refresh токенов
    await apiClient.post(API_ENDPOINTS.LOGOUT);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // В любом случае очищаем токены локально
    apiClient.clearTokens();
  }
}

export function getCurrentUser(): User | null {
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
}

// Функция для очистки сессии (полезно для разработки)
export function clearSession() {
  apiClient.clearTokens();
}

// Функция для проверки, есть ли активная сессия
export function isAuthenticated(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

// Функция для получения актуальных данных пользователя с сервера
export async function refreshCurrentUser(): Promise<User | null> {
  const response = await apiClient.get<{ user: User }>(API_ENDPOINTS.ME);

  if (response.status && response.data) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
    return response.data.user;
  }

  // Если токен истек или невалиден - очищаем сессию
  clearSession();
  return null;
}

// Глобальная функция для консоли браузера (только в режиме разработки)
if (process.env.NODE_ENV === 'development') {
  (window as any).clearEasyPanelSession = () => {
    clearSession();
    window.location.reload();
    console.log('✅ Сессия Easy Panel очищена');
  };
  
  (window as any).getEasyPanelUser = () => {
    const user = getCurrentUser();
    console.log('👤 Текущий пользователь:', user);
    return user;
  };

  console.log('🔧 Easy Panel Dev Tools доступны:');
  console.log('  - clearEasyPanelSession() - очистить сессию');
  console.log('  - getEasyPanelUser() - показать текущего пользователя');
} 