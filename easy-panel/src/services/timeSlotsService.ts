import api from '../utils/apiClient';
import {
  TimeSlot,
  CreateTimeSlotData,
  BulkCreateTimeSlotsData,
  TimeSlotFilters,
} from '../types/timeSlot';

export const timeSlotsService = {
  getAll: async (filters?: TimeSlotFilters): Promise<TimeSlot[]> => {
    const params = new URLSearchParams();
    if (filters?.employee_id) params.append('employee_id', String(filters.employee_id));
    if (filters?.date) params.append('date', filters.date);
    if (filters?.from_date) params.append('from_date', filters.from_date);
    if (filters?.to_date) params.append('to_date', filters.to_date);
    if (filters?.available !== undefined) params.append('available', String(filters.available));

    const query = params.toString();
    const response = await api.get(`/time_slots${query ? `?${query}` : ''}`);
    return Array.isArray(response) ? response : response.data;
  },

  getById: async (id: number): Promise<TimeSlot> => {
    const response = await api.get(`/time_slots/${id}`);
    return (response as any).id ? response : response.data;
  },

  create: async (data: CreateTimeSlotData): Promise<TimeSlot> => {
    const response = await api.post('/time_slots', { time_slot: data });
    return (response as any).id ? response : response.data;
  },

  bulkCreate: async (data: BulkCreateTimeSlotsData): Promise<{ message: string; time_slots: TimeSlot[] }> => {
    const response = await api.post('/time_slots/bulk_create', data);
    return (response as any).message ? response : response.data;
  },

  update: async (id: number, data: Partial<CreateTimeSlotData>): Promise<TimeSlot> => {
    const response = await api.patch(`/time_slots/${id}`, { time_slot: data });
    return (response as any).id ? response : response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/time_slots/${id}`);
  },
};
