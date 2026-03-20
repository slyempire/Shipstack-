
/**
 * Frappe API Service
 * 
 * This service handles communication with the Frappe backend.
 * It implements security mechanisms and follows ISO 27001 standards for 
 * secure data transmission and access control.
 */

const BASE_URL = import.meta.env.VITE_FRAPPE_BASE_URL || '';
const API_KEY = import.meta.env.VITE_FRAPPE_API_KEY || '';
const API_SECRET = import.meta.env.VITE_FRAPPE_API_SECRET || '';

interface FrappeResponse<T> {
  data: T;
  message?: string;
  exc?: string;
}

export class FrappeService {
  private static getHeaders() {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (API_KEY && API_SECRET) {
      headers['Authorization'] = `token ${API_KEY}:${API_SECRET}`;
    }

    return headers;
  }

  /**
   * Secure Audit Logging (ISO 27001 A.12.4)
   * Logs critical actions to the backend for audit trails.
   */
  private static async logAudit(action: string, details: any) {
    try {
      await this.request('POST', 'api/method/shipstack.api.log_audit', {
        action,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed to log audit action', err);
    }
  }

  private static async request<T>(method: string, endpoint: string, body?: any): Promise<T> {
    const url = `${BASE_URL}/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      const result: FrappeResponse<T> = await response.json();
      return result.data;
    } catch (error) {
      console.error(`Frappe API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // --- Generic Resource Methods ---

  static async getList<T>(doctype: string, filters?: any, fields: string[] = ['*']): Promise<T[]> {
    const params = new URLSearchParams({
      doctype,
      filters: JSON.stringify(filters || {}),
      fields: JSON.stringify(fields),
    });
    return this.request<T[]>('GET', `api/resource/${doctype}?${params.toString()}`);
  }

  static async getDoc<T>(doctype: string, name: string): Promise<T> {
    return this.request<T>('GET', `api/resource/${doctype}/${name}`);
  }

  static async createDoc<T>(doctype: string, data: any): Promise<T> {
    await this.logAudit(`CREATE_${doctype.toUpperCase()}`, data);
    return this.request<T>('POST', `api/resource/${doctype}`, data);
  }

  static async updateDoc<T>(doctype: string, name: string, data: any): Promise<T> {
    await this.logAudit(`UPDATE_${doctype.toUpperCase()}`, { name, data });
    return this.request<T>('PUT', `api/resource/${doctype}/${name}`, data);
  }

  static async deleteDoc(doctype: string, name: string): Promise<void> {
    await this.logAudit(`DELETE_${doctype.toUpperCase()}`, { name });
    await this.request('DELETE', `api/resource/${doctype}/${name}`);
  }

  // --- Specialized Methods ---

  static async callMethod<T>(method: string, args: any = {}): Promise<T> {
    return this.request<T>('POST', `api/method/${method}`, args);
  }
}
