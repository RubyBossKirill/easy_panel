import { useState, useCallback } from 'react';
import { Employee, Appointment, Settings, Notification } from '../types';

interface AppState {
  currentEmployee: Employee | null;
  appointments: Appointment[];
  settings: Settings;
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
}

const defaultSettings: Settings = {
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

const defaultEmployee: Employee = {
  id: '1',
  firstName: 'Иван',
  lastName: 'Иванов',
  email: 'ivan.ivanov@example.com',
  phone: '+7 (999) 123-45-67',
  position: 'Консультант',
  department: 'Продажи',
  bio: 'Опытный консультант с 5-летним стажем работы в сфере продаж. Специализируюсь на работе с корпоративными клиентами.',
  skills: ['Продажи', 'Консультации', 'Переговоры', 'CRM'],
};

export const useAppState = () => {
  const [state, setState] = useState<AppState>({
    currentEmployee: defaultEmployee,
    appointments: [],
    settings: defaultSettings,
    notifications: [],
    isLoading: false,
    error: null,
  });

  // Обновление настроек
  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  }, []);

  // Добавление записи
  const addAppointment = useCallback((appointment: Appointment) => {
    setState(prev => ({
      ...prev,
      appointments: [...prev.appointments, appointment]
    }));
  }, []);

  // Обновление записи
  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    setState(prev => ({
      ...prev,
      appointments: prev.appointments.map(app => 
        app.id === id ? { ...app, ...updates } : app
      )
    }));
  }, []);

  // Удаление записи
  const deleteAppointment = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      appointments: prev.appointments.filter(app => app.id !== id)
    }));
  }, []);

  // Обновление профиля сотрудника
  const updateEmployeeProfile = useCallback((updates: Partial<Employee>) => {
    setState(prev => ({
      ...prev,
      currentEmployee: prev.currentEmployee ? 
        { ...prev.currentEmployee, ...updates } : null
    }));
  }, []);

  // Добавление уведомления
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    setState(prev => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications]
    }));
  }, []);

  // Отметить уведомление как прочитанное
  const markNotificationAsRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    }));
  }, []);

  // Установка состояния загрузки
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  // Установка ошибки
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Получение непрочитанных уведомлений
  const getUnreadNotifications = useCallback(() => {
    return state.notifications.filter(notif => !notif.read);
  }, [state.notifications]);

  // Получение записей на определенную дату
  const getAppointmentsByDate = useCallback((date: string) => {
    return state.appointments.filter(app => app.date === date);
  }, [state.appointments]);

  // Получение статистики
  const getDashboardStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = state.appointments.filter(app => app.date === today);
    
    return {
      todayAppointments: todayAppointments.length,
      totalClients: new Set(state.appointments.map(app => app.clientEmail)).size,
      completedAppointments: state.appointments.filter(app => app.status === 'completed').length,
      cancelledAppointments: state.appointments.filter(app => app.status === 'cancelled').length,
    };
  }, [state.appointments]);

  return {
    // Состояние
    currentEmployee: state.currentEmployee,
    appointments: state.appointments,
    settings: state.settings,
    notifications: state.notifications,
    isLoading: state.isLoading,
    error: state.error,
    
    // Действия
    updateSettings,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    updateEmployeeProfile,
    addNotification,
    markNotificationAsRead,
    setLoading,
    setError,
    
    // Вычисляемые значения
    getUnreadNotifications,
    getAppointmentsByDate,
    getDashboardStats,
  };
}; 