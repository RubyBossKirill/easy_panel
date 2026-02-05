import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { hasPermission } from '../utils/permissions';
import { DEFAULT_ROLES } from '../utils/permissions';
import { dashboardService } from '../services/dashboardService';
import { appointmentsService } from '../services/appointmentsService';
import { timeSlotsService } from '../services/timeSlotsService';
import { DashboardStats } from '../types/dashboard';
import { Appointment } from '../types/appointment';
import toast from 'react-hot-toast';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'Подтверждено';
    case 'pending':
      return 'Ожидает подтверждения';
    default:
      return 'Неизвестно';
  }
};

const Dashboard: React.FC = () => {
  const user = getCurrentUser();
  const canViewDashboard = hasPermission(user, DEFAULT_ROLES, 'view_dashboard');
  const canManageSchedule = hasPermission(user, DEFAULT_ROLES, 'manage_schedule');

  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAddTimeModal, setShowAddTimeModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    reminderTime: '15',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, appointmentsData] = await Promise.all([
        dashboardService.getStats(),
        appointmentsService.getAll({
          from_date: new Date().toISOString().split('T')[0],
        }),
      ]);

      setStats(statsData);

      // Sort appointments by time and get next 3
      const sortedAppointments = appointmentsData
        .filter(a => a.status !== 'cancelled' && a.status !== 'completed')
        .sort((a, b) => {
          const dateTimeA = new Date(`${a.date}T${a.time}`);
          const dateTimeB = new Date(`${b.date}T${b.time}`);
          return dateTimeA.getTime() - dateTimeB.getTime();
        })
        .slice(0, 3);

      setUpcomingAppointments(sortedAppointments);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTime = () => {
    setShowAddTimeModal(true);
  };

  const handleViewCalendar = () => {
    navigate('/schedule');
  };

  const handleNotificationsSettings = () => {
    setShowNotificationsModal(true);
  };

  const handleSaveTimeSlot = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      await timeSlotsService.create({
        date: selectedDate,
        time: selectedTime,
        duration: Number(duration),
        available: true,
      });

      toast.success('Временной слот создан');
      setShowAddTimeModal(false);
      setSelectedDate('');
      setSelectedTime('');
      setDuration('60');
    } catch (error: any) {
      console.error('Error creating time slot:', error);
      toast.error(error.response?.data?.error || 'Ошибка создания слота');
    }
  };

  const handleSaveNotifications = () => {
    console.log('Saving notifications:', notifications);
    setShowNotificationsModal(false);
  };

  const handleNotificationChange = (setting: string, value: any) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  if (!canViewDashboard) {
    return <div className="p-8 text-red-600 font-bold text-center text-xl">Нет доступа к панели управления</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Панель управления</h1>

      {/* Статистика */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Загрузка...</div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl shadow p-5 flex items-center justify-between bg-primary text-white">
            <div>
              <div className="text-sm opacity-80 mb-1">Записи сегодня</div>
              <div className="text-2xl font-bold">{stats.today_appointments}</div>
            </div>
            <div className="text-4xl">📅</div>
          </div>

          <div className="rounded-xl shadow p-5 flex items-center justify-between bg-green-600 text-white">
            <div>
              <div className="text-sm opacity-80 mb-1">Всего клиентов</div>
              <div className="text-2xl font-bold">{stats.total_clients}</div>
            </div>
            <div className="text-4xl">👥</div>
          </div>

          <div className="rounded-xl shadow p-5 flex items-center justify-between bg-blue-600 text-white">
            <div>
              <div className="text-sm opacity-80 mb-1">Завершенные встречи</div>
              <div className="text-2xl font-bold">{stats.completed_appointments}</div>
            </div>
            <div className="text-4xl">✅</div>
          </div>

          <div className="rounded-xl shadow p-5 flex items-center justify-between bg-orange-400 text-white">
            <div>
              <div className="text-sm opacity-80 mb-1">Отмененные</div>
              <div className="text-2xl font-bold">{stats.cancelled_appointments}</div>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ближайшие записи */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Ближайшие записи</h2>
          {loading ? (
            <p className="text-gray-500">Загрузка...</p>
          ) : upcomingAppointments.length === 0 ? (
            <p className="text-gray-500">Нет запланированных записей</p>
          ) : (
            <ul>
              {upcomingAppointments.map((a) => {
                const clientName = a.client?.name || 'Неизвестный клиент';
                return (
                  <li key={a.id} className="flex items-center justify-between border-b last:border-b-0 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold">
                        {clientName[0]}
                      </div>
                      <div>
                        <div className="font-medium">{clientName}</div>
                        <div className="text-sm text-gray-500">{a.time} — {a.service || 'Консультация'}</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(a.status)}`}>{getStatusText(a.status)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        
        {/* Быстрые действия */}
        {canManageSchedule && (
          <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-3">
            <h2 className="text-xl font-semibold mb-4">Быстрые действия</h2>
            <button 
              onClick={handleAddTime}
              className="w-full py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              ➕ Добавить время
            </button>
            <button 
              onClick={handleViewCalendar}
              className="w-full py-2 px-4 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              📅 Посмотреть календарь
            </button>
            <button 
              onClick={handleNotificationsSettings}
              className="w-full py-2 px-4 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              🔔 Настройки уведомлений
            </button>
          </div>
        )}
      </div>

      {/* Модальное окно для добавления времени */}
      {showAddTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Добавить временной слот</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Время</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Длительность</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="30">30 минут</option>
                  <option value="60">1 час</option>
                  <option value="90">1.5 часа</option>
                  <option value="120">2 часа</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddTimeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveTimeSlot}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно настроек уведомлений */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Настройки уведомлений</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Email уведомления</div>
                  <div className="text-sm text-gray-500">Получать уведомления на email</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => handleNotificationChange('email', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">SMS уведомления</div>
                  <div className="text-sm text-gray-500">Получать SMS о важных событиях</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.sms}
                    onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Push уведомления</div>
                  <div className="text-sm text-gray-500">Получать push-уведомления в браузере</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={(e) => handleNotificationChange('push', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Время напоминания</label>
                <select
                  value={notifications.reminderTime}
                  onChange={(e) => handleNotificationChange('reminderTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="5">За 5 минут</option>
                  <option value="15">За 15 минут</option>
                  <option value="30">За 30 минут</option>
                  <option value="60">За 1 час</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveNotifications}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 