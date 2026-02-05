import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/auth';
import { hasPermission, DEFAULT_ROLES } from '../utils/permissions';
import { timeSlotsService } from '../services/timeSlotsService';
import { appointmentsService } from '../services/appointmentsService';
import { clientsService } from '../services/clientsService';
import { TimeSlot } from '../types/timeSlot';
import { Appointment } from '../types/appointment';
import { Client } from '../types/client';
import toast from 'react-hot-toast';

const Schedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // Модальные окна
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);

  // Форма массового создания слотов
  const [bulkForm, setBulkForm] = useState({
    start_time: '09:00',
    end_time: '18:00',
    duration: 60,
    break_duration: 0,
  });

  // Форма записи на прием
  const [appointmentForm, setAppointmentForm] = useState({
    client_id: 0,
    service: '',
    notes: '',
  });

  const user = getCurrentUser();
  const canManageSchedule = user ? hasPermission(user, DEFAULT_ROLES, 'manage_schedule') : false;

  useEffect(() => {
    if (selectedDate) {
      loadData();
    }
  }, [selectedDate]);

  useEffect(() => {
    loadClients();
  }, []);

  if (!user) return null;

  if (!canManageSchedule) {
    return <div className="p-8 text-red-600 font-bold text-center text-xl">Нет доступа к расписанию</div>;
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const [slotsData, appointmentsData] = await Promise.all([
        timeSlotsService.getAll({ date: selectedDate }),
        appointmentsService.getAll({ from_date: selectedDate, to_date: selectedDate }),
      ]);
      setTimeSlots(slotsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await clientsService.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

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

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  };

  const isSelected = (date: Date) => formatDate(date) === selectedDate;

  const handleDateClick = (date: Date) => {
    setSelectedDate(formatDate(date));
  };

  const handlePreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const days = getDaysInMonth(currentDate);

  // Массовое создание слотов
  const handleBulkCreate = async () => {
    if (!selectedDate) {
      toast.error('Выберите дату');
      return;
    }

    try {
      const result = await timeSlotsService.bulkCreate({
        date: selectedDate,
        start_time: bulkForm.start_time,
        end_time: bulkForm.end_time,
        duration: bulkForm.duration,
        break_duration: bulkForm.break_duration,
      });

      toast.success(result.message);
      setShowBulkCreateModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error creating slots:', error);
      toast.error(error.response?.data?.error || 'Ошибка создания слотов');
    }
  };

  // Создание записи на прием
  const handleCreateAppointment = async () => {
    if (!selectedTimeSlot) return;

    try {
      await appointmentsService.create({
        client_id: appointmentForm.client_id,
        date: selectedTimeSlot.date,
        time: selectedTimeSlot.time,
        duration: selectedTimeSlot.duration,
        service: appointmentForm.service,
        notes: appointmentForm.notes,
        time_slot_id: selectedTimeSlot.id,
      });

      toast.success('Запись создана');
      setShowAppointmentModal(false);
      setAppointmentForm({ client_id: 0, service: '', notes: '' });
      loadData();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error(error.response?.data?.errors?.join(', ') || 'Ошибка создания записи');
    }
  };

  // Удаление слота
  const handleDeleteSlot = async (slotId: number) => {
    if (!window.confirm('Удалить этот слот?')) return;

    try {
      await timeSlotsService.delete(slotId);
      toast.success('Слот удален');
      loadData();
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Ошибка удаления слота');
    }
  };

  // Открыть модалку для записи
  const handleOpenAppointmentModal = (slot: TimeSlot) => {
    if (slot.appointment) {
      toast.error('Этот слот уже занят');
      return;
    }
    setSelectedTimeSlot(slot);
    setShowAppointmentModal(true);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Расписание</h1>
        {selectedDate && (
          <button
            onClick={() => setShowBulkCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Создать слоты
          </button>
        )}
      </div>

      {/* Календарь */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePreviousMonth} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">←</button>
          <h2 className="text-xl font-semibold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <button onClick={handleNextMonth} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">→</button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">{day}</div>
          ))}

          {days.map((date, idx) => (
            <div
              key={idx}
              onClick={() => date && handleDateClick(date)}
              className={`
                p-2 text-center rounded cursor-pointer transition-colors
                ${!date ? 'invisible' : ''}
                ${date && isToday(date) ? 'bg-blue-100 font-bold' : ''}
                ${date && isSelected(date) ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
              `}
            >
              {date?.getDate()}
            </div>
          ))}
        </div>
      </div>

      {/* Слоты выбранной даты */}
      {selectedDate && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Слоты на {selectedDate}</h2>

          {loading ? (
            <p className="text-gray-500">Загрузка...</p>
          ) : timeSlots.length === 0 ? (
            <p className="text-gray-500">Нет слотов. Создайте слоты для этой даты.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeSlots.map(slot => {
                const appointment = appointments.find(a => a.time_slot?.id === slot.id);
                const isOccupied = !!slot.appointment || !!appointment;

                return (
                  <div
                    key={slot.id}
                    className={`
                      p-4 rounded border-2 transition-colors
                      ${isOccupied ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">{slot.time}</span>
                      <span className="text-sm text-gray-600">{slot.duration} мин</span>
                    </div>

                    {isOccupied ? (
                      <div className="text-sm">
                        <p className="font-medium text-green-700">
                          {slot.appointment?.client?.name || appointment?.client?.name}
                        </p>
                        <p className="text-gray-600">{slot.appointment?.service || appointment?.service}</p>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleOpenAppointmentModal(slot)}
                          className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Записать
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Модалка массового создания слотов */}
      {showBulkCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Создать слоты на {selectedDate}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Начало</label>
                <input
                  type="time"
                  value={bulkForm.start_time}
                  onChange={(e) => setBulkForm({ ...bulkForm, start_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Конец</label>
                <input
                  type="time"
                  value={bulkForm.end_time}
                  onChange={(e) => setBulkForm({ ...bulkForm, end_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Длительность (минут)</label>
                <input
                  type="number"
                  value={bulkForm.duration}
                  onChange={(e) => setBulkForm({ ...bulkForm, duration: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Перерыв между слотами (минут)</label>
                <input
                  type="number"
                  value={bulkForm.break_duration}
                  onChange={(e) => setBulkForm({ ...bulkForm, break_duration: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBulkCreate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Создать
              </button>
              <button
                onClick={() => setShowBulkCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка создания записи */}
      {showAppointmentModal && selectedTimeSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Запись на {selectedTimeSlot.date} в {selectedTimeSlot.time}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Клиент</label>
                <select
                  value={appointmentForm.client_id}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, client_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value={0}>Выберите клиента</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Услуга</label>
                <input
                  type="text"
                  value={appointmentForm.service}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, service: e.target.value })}
                  placeholder="Консультация"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Заметки</label>
                <textarea
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Дополнительная информация"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateAppointment}
                disabled={!appointmentForm.client_id}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Создать запись
              </button>
              <button
                onClick={() => {
                  setShowAppointmentModal(false);
                  setAppointmentForm({ client_id: 0, service: '', notes: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
