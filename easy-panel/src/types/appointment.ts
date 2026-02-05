export interface Appointment {
  id: number;
  client_id: number;
  employee_id: number;
  date: string;
  time: string;
  duration: number;
  service?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    telegram?: string;
  };
  employee?: {
    id: number;
    name: string;
    email: string;
  };
  time_slot?: {
    id: number;
    start_time: string;
    end_time: string;
    date: string;
  };
}

export interface CreateAppointmentData {
  client_id: number;
  employee_id?: number;
  date: string;
  time: string;
  duration: number;
  service?: string;
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
