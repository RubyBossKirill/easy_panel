import { Appointment } from './appointment';
import { Payment } from './payment';

export interface Client {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  telegram?: string;
  notes?: string;
  creator_id: number;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  // Optional - приходят только если запрошены через include_stats
  stats?: {
    appointments_count: number;
    completed_appointments_count: number;
    payments_count: number;
    total_paid: number;
  };
  // Optional - приходят только если запрошены через include_appointments/include_payments
  appointments?: Appointment[];
  payments?: Payment[];
}

export interface CreateClientData {
  name: string;
  phone?: string;
  email?: string;
  telegram?: string;
  notes?: string;
}
