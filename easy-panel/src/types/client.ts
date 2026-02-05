export interface Client {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  telegram?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientData {
  name: string;
  phone?: string;
  email?: string;
  telegram?: string;
  notes?: string;
}
