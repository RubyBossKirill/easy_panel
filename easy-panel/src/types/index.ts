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
