import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { hasPermission } from '../utils/permissions';
import { DEFAULT_ROLES } from '../utils/permissions';

interface TimeSlot {
  id: number;
  time: string;
  duration: string;
  clientName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  telegram?: string;
}

// Парсинг строки 'YYYY-MM-DD' в локальный объект Date
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const initialSlotsByDate: { [date: string]: TimeSlot[] } = {
  '2025-07-13': [
    {
      id: 1,
      time: '15:59',
      duration: '60',
      clientName: 'Анна Петрова',
      firstName: 'Анна',
      lastName: 'Петрова',
      phone: '+7 999 123-45-67',
      email: 'anna.petrov@example.com',
      telegram: 'https://t.me/annapetrov',
    },
    {
      id: 2,
      time: '17:00',
      duration: '60',
    },
  ],
  '2025-07-14': [
    {
      id: 3,
      time: '10:00',
      duration: '30',
      clientName: 'Михаил Сидоров',
      firstName: 'Михаил',
      lastName: 'Сидоров',
      phone: '+7 999 234-56-78',
      email: 'm.sidorov@example.com',
      telegram: 'https://t.me/mikesidorov',
    },
    {
      id: 4,
      time: '11:00',
      duration: '60',
    },
  ],
};

const Schedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState({ time: '', duration: '60' });
  const [slotsByDate, setSlotsByDate] = useState<{ [date: string]: TimeSlot[] }>(initialSlotsByDate);
  const [slotIdCounter, setSlotIdCounter] = useState(5);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clientInfo, setClientInfo] = useState<TimeSlot | null>(null);
  const navigate = useNavigate();
  const user = getCurrentUser();
  if (!user) return null;

  const canManageSchedule = hasPermission(user, DEFAULT_ROLES, 'manage_schedule');
  const canViewAllSchedules = hasPermission(user, DEFAULT_ROLES, 'manage_all_clients');

  if (!canManageSchedule) {
    return <div className="p-8 text-red-600 font-bold text-center text-xl">Нет доступа к расписанию</div>;
  }

  // Календарь
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };
  const days = getDaysInMonth(currentDate);

  const formatDate = (date: Date) => {
    // Формат YYYY-MM-DD
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const formatDisplayDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const getDayName = (date: Date) => date.toLocaleDateString('ru-RU', { weekday: 'short' });
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  };
  const isSelected = (date: Date) => formatDate(date) === selectedDate;
  const handleDateClick = (date: Date) => {
    setSelectedDate(formatDate(date));
    setError('');
  };

  // Добавление слота
  const handleAddTimeSlot = () => {
    if (selectedDate && newTimeSlot.time) {
      setSlotsByDate(prev => {
        const prevSlots = prev[selectedDate] || [];
        return {
          ...prev,
          [selectedDate]: [...prevSlots, { id: slotIdCounter, ...newTimeSlot }]
        };
      });
      setSlotIdCounter(id => id + 1);
      setShowTimeModal(false);
      setNewTimeSlot({ time: '', duration: '60' });
      setError('');
    }
  };

  // Удаление слота
  const handleDeleteSlot = (slotId: number) => {
    setSlotsByDate(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).filter(slot => slot.id !== slotId)
    }));
  };

  // Тестовая функция: занять слот (для демонстрации)
  const handleOccupySlot = (slotId: number) => {
    const firstName = prompt('Имя клиента:', 'Иван');
    if (!firstName) return;
    const lastName = prompt('Фамилия клиента:', 'Клиентов');
    if (!lastName) return;
    const phone = prompt('Телефон:', '+7 999 000-00-00') || '';
    const email = prompt('Email:', 'client@example.com') || '';
    const telegram = prompt('Ссылка на Telegram:', 'https://t.me/username') || '';
    setSlotsByDate(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).map(slot =>
        slot.id === slotId
          ? {
              ...slot,
              clientName: `${firstName} ${lastName}`,
              firstName,
              lastName,
              phone,
              email,
              telegram,
            }
          : slot
      )
    }));
  };

  // Открыть инфо о клиенте
  const handleShowClientInfo = (slot: TimeSlot) => {
    setClientInfo(slot);
  };

  // Сохранение расписания
  const handleSaveSchedule = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      // Здесь будет отправка на сервер
      console.log('Расписание отправлено:', slotsByDate);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 1000);
  };

  const handlePreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  // Открытие модального окна
  const handleOpenAddTime = () => {
    if (!selectedDate) {
      setError('Сначала выберите дату в календаре!');
      return;
    }
    setShowTimeModal(true);
    setError('');
  };

  // Фильтрация слотов по дате и userId (если нет прав на все)
  const getFilteredSlots = (date: string) => {
    const slots = slotsByDate[date] || [];
    if (canViewAllSchedules) return slots;
    return slots.filter(slot => !slot.clientName || slot.clientName === user!.name);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
        <h1 className="text-3xl font-bold">Расписание</h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleOpenAddTime}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition ${selectedDate ? 'bg-primary text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            ➕ Добавить время
          </button>
          <button
            onClick={handleSaveSchedule}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition ${isSaving ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {isSaving ? 'Сохраняю...' : 'Сохранить расписание'}
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-4 text-red-600 font-medium">{error}</div>
      )}
      {saveSuccess && (
        <div className="mb-4 text-green-600 font-medium">Расписание успешно сохранено!</div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Календарь */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={handlePreviousMonth} className="p-2 rounded-lg hover:bg-gray-100 transition">←</button>
            <h2 className="text-xl font-semibold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition">→</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div key={index} className="min-h-[80px] p-1">
                {day ? (
                  <button
                    onClick={() => handleDateClick(day)}
                    className={`w-full h-full p-2 rounded-lg text-left transition ${
                      isToday(day)
                        ? 'bg-primary text-white'
                        : isSelected(day)
                        ? 'bg-blue-100 border-2 border-primary'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium">{day.getDate()}</div>
                    <div className="text-xs opacity-70">{getDayName(day)}</div>
                    {(slotsByDate[formatDate(day)] && slotsByDate[formatDate(day)].length > 0) && (
                      <div className="mt-1"><div className="w-2 h-2 bg-green-500 rounded-full mx-auto"></div></div>
                    )}
                  </button>
                ) : (<div className="w-full h-full"></div>)}
              </div>
            ))}
          </div>
        </div>
        {/* Список слотов на выбранный день */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDate ? formatDisplayDate(selectedDate) : 'Выберите дату'}
          </h3>
          {selectedDate ? (
            <div className="space-y-2">
              {(getFilteredSlots(selectedDate) && getFilteredSlots(selectedDate).length > 0) ? (
                getFilteredSlots(selectedDate).map(slot => (
                  <div key={slot.id} className={`w-full p-3 rounded-lg flex items-center justify-between border ${slot.clientName ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {slot.time}
                        {slot.clientName && (
                          <button
                            className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold underline hover:bg-red-200"
                            onClick={() => handleShowClientInfo(slot)}
                          >
                            Занято: {slot.clientName}
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{slot.duration === '30' ? '30 минут' : slot.duration === '60' ? '1 час' : slot.duration === '90' ? '1.5 часа' : '2 часа'}</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {!slot.clientName && (
                        <button onClick={() => handleOccupySlot(slot.id)} className="text-blue-500 hover:text-blue-700 text-sm border border-blue-200 rounded px-2 py-1" title="Занять слот">
                          Занять
                        </button>
                      )}
                      <button onClick={() => handleDeleteSlot(slot.id)} className="text-red-500 hover:text-red-700 text-xl" title="Удалить">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">Нет доступных окон. Нажмите "Добавить время".</div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">Выберите дату в календаре, чтобы увидеть расписание</div>
          )}
        </div>
      </div>
      {/* Модальное окно для добавления времени */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Добавить временной слот</h3>
            <div className="space-y-4">
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{formatDisplayDate(selectedDate)}</div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Время</label>
                <input
                  type="time"
                  value={newTimeSlot.time}
                  onChange={e => setNewTimeSlot(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Длительность</label>
                <select
                  value={newTimeSlot.duration}
                  onChange={e => setNewTimeSlot(prev => ({ ...prev, duration: e.target.value }))}
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
                onClick={() => { setShowTimeModal(false); setNewTimeSlot({ time: '', duration: '60' }); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleAddTimeSlot}
                className={`px-4 py-2 rounded-lg ${newTimeSlot.time ? 'bg-primary text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                disabled={!newTimeSlot.time}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Модальное окно информации о клиенте */}
      {clientInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Информация о клиенте</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Имя:</span> {clientInfo.firstName} {clientInfo.lastName}
              </div>
              <div>
                <span className="font-medium">Телефон:</span> {clientInfo.phone}
              </div>
              <div>
                <span className="font-medium">Email:</span> {clientInfo.email}
              </div>
              <div>
                <span className="font-medium">Telegram:</span> {clientInfo.telegram ? (
                  <a href={clientInfo.telegram} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{clientInfo.telegram}</a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setClientInfo(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Закрыть
              </button>
              <button
                onClick={() => {
                  // Пример поиска id клиента по имени и фамилии (в реальном проекте нужен id)
                  let clientId = '';
                  if (clientInfo.firstName === 'Анна' && clientInfo.lastName === 'Петрова') clientId = '1';
                  if (clientInfo.firstName === 'Михаил' && clientInfo.lastName === 'Сидоров') clientId = '2';
                  if (clientId) navigate(`/clients/${clientId}`);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition"
              >
                Профиль
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule; 