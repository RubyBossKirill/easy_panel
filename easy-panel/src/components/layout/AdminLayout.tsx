import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, logout } from '../../utils/auth';
import { hasPermission } from '../../utils/permissions';
import { STORAGE_KEYS } from '../../config/api';

const menuItems = [
  { text: 'Панель управления', icon: '📊', path: '/', permission: 'view_dashboard' },
  { text: 'Расписание', icon: '📅', path: '/schedule', permission: 'manage_schedule' },
  { text: 'Услуги', icon: '💼', path: '/services', permission: 'manage_schedule' },
  { text: 'Клиенты', icon: '👥', path: '/clients', permission: 'view_clients' },
  { text: 'Платежи', icon: '💳', path: '/payments', permission: 'view_payments' },
  { text: 'Профиль', icon: '👤', path: '/profile', permission: null },
  { text: 'Настройки', icon: '⚙️', path: '/settings', permission: 'manage_users' },
  { text: 'Настройки аккаунта', icon: '🔑', path: '/account-settings', permission: 'manage_account_settings' },
];

const AdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [projectName, setProjectName] = useState(() => localStorage.getItem(STORAGE_KEYS.PROJECT_NAME) || 'Easy Panel');
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleProjectNameChanged = useCallback(() => {
    setProjectName(localStorage.getItem(STORAGE_KEYS.PROJECT_NAME) || 'Easy Panel');
  }, []);

  useEffect(() => {
    window.addEventListener('projectNameChanged', handleProjectNameChanged);
    return () => window.removeEventListener('projectNameChanged', handleProjectNameChanged);
  }, [handleProjectNameChanged]);

  const currentPage = menuItems.find(item => item.path === location.pathname)?.text || 'Панель управления';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Боковое меню */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">{projectName}</h1>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <nav className="mt-6">
          <ul>
            {menuItems.filter(item => !item.permission || hasPermission(user, null, item.permission as any)).map((item) => (
              <li key={item.text}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Основной контент */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Верхняя панель */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 mr-4"
            >
              ☰
            </button>
            <h2 className="text-xl font-semibold text-gray-800">{currentPage}</h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                  {user?.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">{user?.name}</span>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => { navigate('/profile'); setProfileMenuOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Профиль
                  </button>
                  {hasPermission(user, null, 'manage_users') && (
                    <button
                      onClick={() => { navigate('/settings'); setProfileMenuOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Настройки
                    </button>
                  )}
                  {hasPermission(user, null, 'manage_account_settings') && (
                    <button
                      onClick={() => { navigate('/account-settings'); setProfileMenuOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Настройки аккаунта
                    </button>
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Контент страницы */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
      {/* Затемнение для мобильного меню */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
