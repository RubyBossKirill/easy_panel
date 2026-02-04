// Типы для сотрудников
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  bio: string;
  skills: string[];
  avatar?: string;
}

// Типы для записей
export interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  employeeId: string;
  date: string;
  time: string;
  duration: number; // в минутах
  service: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// Типы для временных слотов
export interface TimeSlot {
  id: string;
  employeeId: string;
  date: string;
  time: string;
  duration: number;
  available: boolean;
  appointmentId?: string;
}

// Типы для настроек
export interface Settings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  autoConfirm: boolean;
  reminderTime: string; // в минутах
  workingHours: {
    start: string;
    end: string;
  };
  timezone: string;
}

// Типы для статистики
export interface DashboardStats {
  todayAppointments: number;
  totalClients: number;
  completedAppointments: number;
  cancelledAppointments: number;
}

// Типы для уведомлений
export type NotificationEventType = 'created' | 'paid' | 'cancelled';

export interface Notification {
  id: string;
  type: 'appointment' | 'reminder' | 'system';
  eventType?: NotificationEventType; // 'created', 'paid', 'cancelled'
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Типы для сервисов
export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price?: number;
  category: string;
}

// Типы для API ответов
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Типы для фильтров
export interface AppointmentFilters {
  date?: string;
  status?: AppointmentStatus;
  employeeId?: string;
  clientName?: string;
}

// Типы для пагинации
export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationParams;
}

// --- Permissions & Roles ---
export type Permission =
  | 'view_dashboard'
  | 'manage_schedule'
  | 'view_clients'
  | 'manage_clients'
  | 'view_payments'
  | 'manage_payments'
  | 'view_all_clients'
  | 'manage_all_clients'
  | 'view_all_payments'
  | 'manage_all_payments'
  | 'manage_users'
  | 'manage_roles'
  | 'manage_account_settings'
  | 'manage_payment_settings';

export type Role = {
  id: number | string;
  name: string;
  permissions: Permission[];
  isOwner?: boolean; // true только для владельца
};

export type User = {
  id: number;
  name: string;
  email: string;
  role_id: number; // ID роли из базы данных
  roleId?: string; // для обратной совместимости со старым кодом
  role?: Role; // Объект роли с правами (приходит из API)
  password?: string; // для обратной совместимости
  passwordHash?: string; // хешированный пароль
}; 