import api from '../utils/apiClient';
import {
  TimeSlot,
  CreateTimeSlotData,
  BulkCreateTimeSlotsData,
  TimeSlotFilters,
} from '../types/timeSlot';

interface BulkCreateResponse {
  message: string;
  time_slots: TimeSlot[];
}

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
    return api.extractData<TimeSlot[]>(response);
  },

  getById: async (id: number): Promise<TimeSlot> => {
    const response = await api.get(`/time_slots/${id}`);
    return api.extractData<TimeSlot>(response);
  },

  create: async (data: CreateTimeSlotData): Promise<TimeSlot> => {
    const response = await api.post('/time_slots', { time_slot: data });
    return api.extractData<TimeSlot>(response);
  },

  bulkCreate: async (data: BulkCreateTimeSlotsData): Promise<BulkCreateResponse> => {
    const response = await api.post('/time_slots/bulk_create', data);
    // bulk_create возвращает { status: true, message: "...", data: { time_slots: [...] } }
    if (!response.status) {
      throw new Error(response.message || response.error || 'Ошибка создания слотов');
    }
    return {
      message: response.message || 'Слоты созданы',
      time_slots: response.data?.time_slots || [],
    };
  },

  update: async (id: number, data: Partial<CreateTimeSlotData>): Promise<TimeSlot> => {
    const response = await api.patch(`/time_slots/${id}`, { time_slot: data });
    return api.extractData<TimeSlot>(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await api.delete(`/time_slots/${id}`);
    if (!response.status && response.message) {
      throw new Error(response.message);
    }
  },
};
