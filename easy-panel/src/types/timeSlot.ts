export interface TimeSlot {
  id: number;
  employee_id: number;
  date: string;
  time: string;
  duration: number;
  available: boolean;
  appointment_id?: number;
  created_at: string;
  updated_at: string;
  employee?: {
    id: number;
    name: string;
    email: string;
  };
  appointment?: {
    id: number;
    status: string;
    service?: string;
    client?: {
      id: number;
      name: string;
      phone?: string;
      email?: string;
    };
  };
}

export interface CreateTimeSlotData {
  employee_id?: number;
  date: string;
  time: string;
  duration: number;
  available?: boolean;
  appointment_id?: number;
}

export interface BulkCreateTimeSlotsData {
  employee_id?: number;
  date: string;
  start_time: string;
  end_time: string;
  duration?: number;
  break_duration?: number;
}

export interface TimeSlotFilters {
  employee_id?: number;
  date?: string;
  from_date?: string;
  to_date?: string;
  available?: boolean;
}
