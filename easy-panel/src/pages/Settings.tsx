import React, { useState } from 'react';
import { getCurrentUser } from '../utils/auth';
import { hasPermission, DEFAULT_ROLES } from '../utils/permissions';
import toast from 'react-hot-toast';

const SETTINGS_KEY = 'easy_panel_settings';

interface AppSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  autoConfirm: boolean;
  reminderTime: string;
  workingHours: {
    start: string;
    end: string;
  };
  timezone: string;
}

const defaultSettings: AppSettings = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  autoConfirm: false,
  reminderTime: '15',
  workingHours: {
    start: '09:00',
    end: '18:00',
  },
  timezone: 'Europe/Moscow',
};

const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {}
  return defaultSettings;
};

const Settings: React.FC = () => {
  const user = getCurrentUser();
  const canManageUsers = hasPermission(user, DEFAULT_ROLES, 'manage_users');

  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  if (!user || !canManageUsers) {
    return <div className="p-8 text-red-600 font-bold text-center text-xl">Нет доступа к настройкам</div>;
  }

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleWorkingHoursChange = (field: 'start' | 'end', value: string) => {
    setSettings(prev => ({
      ...prev,
      workingHours: { ...prev.workingHours, [field]: value },
    }));
  };

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    toast.success('Настройки сохранены');
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Настройки</h1>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
        >
          Сохранить
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        {/* Уведомления */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Уведомления</h2>
          <div className="space-y-4">
            {[
              { key: 'emailNotifications' as const, label: 'Email уведомления', description: 'Получать уведомления о новых записях на email' },
              { key: 'smsNotifications' as const, label: 'SMS уведомления', description: 'Получать SMS о важных событиях' },
              { key: 'pushNotifications' as const, label: 'Push уведомления', description: 'Получать push-уведомления в браузере' },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-gray-500">{description}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[key] as boolean}
                    onChange={e => handleSettingChange(key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <hr className="my-8" />

        {/* Рабочее время */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Рабочее время</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Начало рабочего дня</label>
              <input
                type="time"
                value={settings.workingHours.start}
                onChange={e => handleWorkingHoursChange('start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Конец рабочего дня</label>
              <input
                type="time"
                value={settings.workingHours.end}
                onChange={e => handleWorkingHoursChange('end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="font-medium">Автоматическое подтверждение записей</div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoConfirm}
                onChange={e => handleSettingChange('autoConfirm', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <hr className="my-8" />

        {/* Дополнительные настройки */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Дополнительные настройки</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Время напоминания</label>
              <select
                value={settings.reminderTime}
                onChange={e => handleSettingChange('reminderTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="5">За 5 минут</option>
                <option value="15">За 15 минут</option>
                <option value="30">За 30 минут</option>
                <option value="60">За 1 час</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Часовой пояс</label>
              <select
                value={settings.timezone}
                onChange={e => handleSettingChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Europe/Moscow">Москва (UTC+3)</option>
                <option value="Europe/Kaliningrad">Калининград (UTC+2)</option>
                <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
                <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
                <option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
                <option value="Europe/London">Лондон (UTC+0)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
