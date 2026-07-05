import { FrappeService } from './frappe';
import { User } from '../types';

export const FrappeAuthService = {
  async getLoggedUser(): Promise<User | null> {
    // No catch here: a connection failure must propagate as an error so
    // callers can tell "ERP unreachable" apart from "not logged in" (null).
    // Swallowing it into null caused valid sessions to be logged out
    // whenever the ERP was temporarily down.
    return FrappeService.callMethod<User | null>('shipstack.api.auth.get_logged_user');
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    return FrappeService.callMethod<{ user: User; token: string }>('shipstack.api.auth.login', {
      email,
      password
    });
  },

  async logout(): Promise<void> {
    try {
      await FrappeService.callMethod('shipstack.api.auth.logout');
    } catch (err) {
      console.warn("Frappe logout failed:", err);
    }
  },

  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    return FrappeService.callMethod<{ success: boolean; message: string }>('shipstack.api.auth.reset_password', {
      email
    });
  },

  async register(email: string, name: string, password: string, role: string = 'driver'): Promise<{ user: User; token: string }> {
    return FrappeService.callMethod<{ user: User; token: string }>('shipstack.api.auth.register', {
      email,
      name,
      password,
      role
    });
  }
};
