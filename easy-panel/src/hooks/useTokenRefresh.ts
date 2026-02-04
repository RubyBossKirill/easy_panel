import { useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '../config/api';
import apiClient from '../utils/apiClient';
import { useNavigate } from 'react-router-dom';

const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000; // Проверяем каждые 5 минут
const TOKEN_REFRESH_THRESHOLD = 60 * 60 * 1000; // Обновляем за 1 час до истечения

export function useTokenRefresh() {
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const expiryTime = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

      // Если нет токенов - не делаем ничего
      if (!accessToken || !refreshToken) {
        return;
      }

      // Проверяем время истечения
      if (expiryTime) {
        const timeUntilExpiry = parseInt(expiryTime) - Date.now();

        // Если токен скоро истечет (меньше чем через 1 час) - обновляем
        if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
          console.log('Token will expire soon, refreshing...');
          try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1'}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.status && data.data) {
                apiClient.setTokens(data.data.access_token, data.data.refresh_token);
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data.user));
                console.log('Token refreshed successfully');
              }
            } else {
              // Если не удалось обновить - очищаем и редиректим на логин
              console.error('Token refresh failed');
              apiClient.clearTokens();
              navigate('/login');
            }
          } catch (error) {
            console.error('Token refresh error:', error);
            apiClient.clearTokens();
            navigate('/login');
          }
        } else if (timeUntilExpiry <= 0) {
          // Токен уже истек
          console.log('Token expired, redirecting to login');
          apiClient.clearTokens();
          navigate('/login');
        }
      }
    };

    // Проверяем сразу при монтировании
    checkAndRefreshToken();

    // Затем проверяем каждые 5 минут
    intervalRef.current = setInterval(checkAndRefreshToken, TOKEN_CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [navigate]);
}
