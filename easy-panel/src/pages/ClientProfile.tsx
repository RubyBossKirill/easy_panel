import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Пример клиентов (в реальном проекте будет запрос к серверу)
const clients = [
  {
    id: '1',
    firstName: 'Анна',
    lastName: 'Петрова',
    email: 'anna.petrova@email.com',
    phone: '+7 (999) 123-45-67',
    telegram: 'https://t.me/annapetrov',
  },
  {
    id: '2',
    firstName: 'Михаил',
    lastName: 'Сидоров',
    email: 'mikhail.sidorov@email.com',
    phone: '+7 (999) 234-56-78',
    telegram: 'https://t.me/mikesidorov',
  },
];

const ClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = clients.find(c => c.id === id);
  const [profile, setProfile] = useState(client || {
    id: '', firstName: '', lastName: '', email: '', phone: '', telegram: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  if (!client) {
    return <div className="p-8 text-red-600 font-bold">Клиент не найден</div>;
  }

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Здесь будет отправка на сервер
    setIsEditing(false);
    alert('Профиль клиента сохранён!');
  };

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:underline">← Назад к списку</button>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Профиль клиента</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              ✏️ Редактировать
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition"
              >
                💾 Сохранить
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
            <input
              type="text"
              value={profile.firstName}
              onChange={e => handleInputChange('firstName', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия</label>
            <input
              type="text"
              value={profile.lastName}
              onChange={e => handleInputChange('lastName', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={e => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telegram</label>
            <input
              type="text"
              value={profile.telegram}
              onChange={e => handleInputChange('telegram', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile; 