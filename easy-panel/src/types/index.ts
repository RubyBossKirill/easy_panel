// --- Permissions & Roles ---
export type Permission =
  | 'view_dashboard'
  | 'view_analytics'
  | 'manage_schedule'
  | 'view_clients'
  | 'manage_clients'
  | 'delete_clients'
  | 'view_payments'
  | 'manage_payments'
  | 'view_all_clients'
  | 'manage_all_clients'
  | 'view_all_payments'
  | 'manage_all_payments'
  | 'manage_users'
  | 'delete_users'
  | 'manage_roles'
  | 'manage_account_settings'
  | 'manage_payment_settings'
  | 'manage_certificates'
  | 'manage_subscriptions'
  | 'manage_discounts';

export type Role = {
  id: number | string;
  name: string;
  permissions: Permission[];
  translated_permissions?: string[];
  isOwner?: boolean;
  is_owner?: boolean;
};

export type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  telegram?: string | null;
  role_id: number;
  role?: Role;
};

// --- Уведомления ---
export type NotificationEventType = 'created' | 'paid' | 'cancelled';

export interface Notification {
  id: string;
  type: 'appointment' | 'reminder' | 'system';
  eventType?: NotificationEventType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// --- Legacy типы (используются только в useAppState.ts) ---
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

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

/** @deprecated Используй Appointment из types/appointment.ts для реальных данных API */
export interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  employeeId: string;
  date: string;
  time: string;
  duration: number;
  service: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
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
