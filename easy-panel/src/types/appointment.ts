import { Service } from './service';

export interface Appointment {
  id: number;
  client_id: number;
  employee_id: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number;
  service_id?: number;
  status?: 'completed' | 'cancelled' | null;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Associations (приходят через include в serializer)
  client?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    telegram?: string;
  };
  employee?: {
    id: number;
    name: string;
    email: string;
  };
  service?: Service;
  payment?: {
    id: number;
    amount: string;
    final_amount: string;
    status: string;
    payment_link?: string;
  };
}

export interface CreateAppointmentData {
  client_id: number;
  employee_id?: number;
  date: string;
  time: string;
  duration: number;
  service_id?: number;
  status?: string;
  notes?: string;
  time_slot_id?: number;
}

export interface UpdateAppointmentData extends Partial<CreateAppointmentData> {}

export interface AppointmentFilters {
  status?: string;
  employee_id?: number;
  client_id?: number;
  from_date?: string;
  to_date?: string;
}
