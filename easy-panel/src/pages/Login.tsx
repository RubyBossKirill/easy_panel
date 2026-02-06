import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, clearSession } from '../utils/auth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Ошибка входа');
      }
    } catch (err) {
      setError('Произошла ошибка при входе');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSession = () => {
    clearSession();
    window.location.reload();
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Вход в Easy Panel
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Или{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
            зарегистрируйтесь
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="owner@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Пароль
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="12345678"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </button>
            </div>
          </form>

          {/* Кнопка для разработки - очистка сессии */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Для разработки</span>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={handleClearSession}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Очистить сессию
              </button>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Тестовые данные:</h3>
            <div className="space-y-2">
              {/* Владелец */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">Владелец:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard('owner@company.com', 'owner-email')}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                    title="Копировать email"
                  >
                    {copiedText === 'owner-email' ? '✓ Скопировано' : 'owner@company.com'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('12345678', 'owner-password')}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                    title="Копировать пароль"
                  >
                    {copiedText === 'owner-password' ? '✓ Скопировано' : '12345678'}
                  </button>
                </div>
              </div>

              {/* Админ */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">Админ:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard('anna@company.com', 'admin-email')}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                    title="Копировать email"
                  >
                    {copiedText === 'admin-email' ? '✓ Скопировано' : 'anna@company.com'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('12345678', 'admin-password')}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                    title="Копировать пароль"
                  >
                    {copiedText === 'admin-password' ? '✓ Скопировано' : '12345678'}
                  </button>
                </div>
              </div>

              {/* Сотрудник */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">Сотрудник:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard('mike@company.com', 'employee-email')}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                    title="Копировать email"
                  >
                    {copiedText === 'employee-email' ? '✓ Скопировано' : 'mike@company.com'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('12345678', 'employee-password')}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                    title="Копировать пароль"
                  >
                    {copiedText === 'employee-password' ? '✓ Скопировано' : '12345678'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 