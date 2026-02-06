import React, { useState, useEffect } from 'react';
import { getCurrentUser, refreshCurrentUser } from '../utils/auth';
import { usersService } from '../services/usersService';
import { User } from '../types';
import { useToast } from '../hooks/useToast';
import { STORAGE_KEYS } from '../config/api';
import ToastContainer from '../components/ToastContainer';

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    telegram: '',
  });
  const toast = useToast();

  // Загружаем актуальные данные пользователя с сервера при монтировании компонента
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        // Получаем актуальные данные с сервера
        const freshUser = await refreshCurrentUser();
        if (freshUser) {
          setUser(freshUser);
          setProfile({
            name: freshUser.name || '',
            email: freshUser.email || '',
            phone: freshUser.phone || '',
            telegram: freshUser.telegram || '',
          });
        } else {
          // Fallback на локальные данные если не удалось загрузить
          const currentUser = getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setProfile({
              name: currentUser.name || '',
              email: currentUser.email || '',
              phone: currentUser.phone || '',
              telegram: currentUser.telegram || '',
            });
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback на локальные данные при ошибке
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setProfile({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: currentUser.phone || '',
            telegram: currentUser.telegram || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleSave = async () => {
    if (!user) return;

    try {
      const response = await usersService.updateUser(user.id, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        telegram: profile.telegram,
      });

      if (response.status && response.data) {
        // Обновляем localStorage с новыми данными
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
        setUser(response.data.user);
        setProfile({
          name: response.data.user.name || '',
          email: response.data.user.email || '',
          phone: response.data.user.phone || '',
          telegram: response.data.user.telegram || '',
        });
        toast.success('Профиль успешно обновлен');
        setIsEditing(false);
      } else {
        toast.error(response.message || 'Не удалось обновить профиль');
      }
    } catch (err: any) {
      toast.error(err.message || 'Не удалось обновить профиль');
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        telegram: user.telegram || '',
      });
    }
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading || !user) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center">Загрузка профиля...</div>
      </div>
    );
  }

  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Профиль</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              ✏️ Редактировать
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                💾 Сохранить
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
        {/* Заголовок профиля */}
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mr-6">
            {initials}
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{profile.name}</h2>
            <p className="text-gray-600">{user.role?.name || 'Пользователь'}</p>
          </div>
        </div>

        <hr className="mb-6" />

        {/* Форма */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!isEditing}
              placeholder="+7 (999) 123-45-67"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telegram</label>
            <input
              type="text"
              value={profile.telegram}
              onChange={(e) => handleInputChange('telegram', e.target.value)}
              disabled={!isEditing}
              placeholder="@username"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
        </div>

        <hr className="my-6" />

        {/* Информация о роли */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Роль и права доступа</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium">
                {user.role?.name || 'Нет роли'}
              </span>
            </div>
            {user.role?.translated_permissions && user.role.translated_permissions.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Права доступа:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {user.role.translated_permissions.map((perm, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Нет прав доступа</p>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default Profile; 