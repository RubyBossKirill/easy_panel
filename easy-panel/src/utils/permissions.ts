import { Permission, Role, User } from '../types';

export const ALL_PERMISSIONS: Permission[] = [
  'view_dashboard',
  'view_analytics',
  'manage_schedule',
  'view_clients',
  'manage_clients',
  'delete_clients',
  'view_payments',
  'manage_payments',
  'view_all_clients',
  'manage_all_clients',
  'view_all_payments',
  'manage_all_payments',
  'manage_users',
  'delete_users',
  'manage_roles',
  'manage_account_settings',
  'manage_payment_settings',
  'manage_certificates',
  'manage_subscriptions',
  'manage_discounts',
];

export const DEFAULT_ROLES: Role[] = [
  {
    id: 'owner',
    name: 'Владелец',
    permissions: [...ALL_PERMISSIONS],
    isOwner: true,
  },
  {
    id: 'admin',
    name: 'Администратор',
    permissions: [
      'view_dashboard',
      'manage_schedule',
      'view_clients',
      'manage_clients',
      'view_payments',
      'manage_payments',
      'view_all_clients',
      'manage_all_clients',
      'view_all_payments',
      'manage_all_payments',
      'manage_users',
      'manage_roles',
      // Без manage_account_settings и manage_payment_settings по умолчанию
    ],
  },
  {
    id: 'employee',
    name: 'Сотрудник',
    permissions: [
      'view_dashboard',
      'manage_schedule',
      'view_clients',
      'manage_clients',
      'view_payments',
      'manage_payments',
    ],
  },
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_dashboard: 'Просмотр панели управления',
  view_analytics: 'Просмотр аналитики',
  manage_schedule: 'Управление расписанием',
  view_clients: 'Просмотр клиентов',
  manage_clients: 'Управление клиентами',
  delete_clients: 'Удаление клиентов',
  view_payments: 'Просмотр оплат',
  manage_payments: 'Управление оплатами',
  view_all_clients: 'Просмотр всех клиентов',
  manage_all_clients: 'Управление всеми клиентами',
  view_all_payments: 'Просмотр всех оплат',
  manage_all_payments: 'Управление всеми оплатами',
  manage_users: 'Управление пользователями',
  delete_users: 'Удаление пользователей',
  manage_roles: 'Управление ролями',
  manage_account_settings: 'Настройки аккаунта',
  manage_payment_settings: 'Настройки оплаты',
  manage_certificates: 'Управление сертификатами',
  manage_subscriptions: 'Управление абонементами',
  manage_discounts: 'Управление скидками',
};

export function getPermissionLabel(permission: Permission): string {
  return PERMISSION_LABELS[permission] || permission;
}

export function hasPermission(user: User | null, roles: Role[] | null, permission: Permission): boolean {
  if (!user) return false;

  // Если у пользователя есть объект роли из API (с правами)
  if (user.role && user.role.permissions) {
    return user.role.permissions.includes(permission);
  }

  // Fallback на старую систему (для обратной совместимости)
  const roleList = roles || DEFAULT_ROLES;
  const roleId = user.roleId || String(user.role_id);
  const role = roleList.find(r => String(r.id) === roleId);
  return !!role && role.permissions.includes(permission);
} 