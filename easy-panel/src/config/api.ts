// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',

  // Resources
  USERS: '/users',
  ROLES: '/roles',
  CLIENTS: '/clients',
  APPOINTMENTS: '/appointments',
  TIME_SLOTS: '/time_slots',
  PAYMENTS: '/payments',
} as const;

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'easy_panel_access_token',
  REFRESH_TOKEN: 'easy_panel_refresh_token',
  USER: 'easy_panel_user',
  TOKEN_EXPIRY: 'easy_panel_token_expiry',
} as const;
