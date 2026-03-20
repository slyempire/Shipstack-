
import { UserRole, User } from '../types';

export const ROLES: Record<UserRole, UserRole> = {
  ADMIN: 'ADMIN',
  DISPATCHER: 'DISPATCHER',
  FINANCE: 'FINANCE',
  FACILITY: 'FACILITY',
  DRIVER: 'DRIVER',
  CLIENT: 'CLIENT'
};

export const canAccessAdmin = (user: User | null) => 
  user && ['ADMIN', 'DISPATCHER', 'FINANCE'].includes(user.role);

export const canAccessFinance = (user: User | null) => 
  user && ['ADMIN', 'FINANCE'].includes(user.role);

export const isDriver = (user: User | null) => 
  user?.role === 'DRIVER';

export const formatUserRole = (role: UserRole) => {
  return role.charAt(0) + role.slice(1).toLowerCase();
};
