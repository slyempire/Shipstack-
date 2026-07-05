
import { useAuthStore } from '../store';

/**
 * Frappe API Service
 * 
 * This service handles communication with the Frappe backend via a secure Node.js proxy.
 * It implements security mechanisms and follows ISO 27001 standards for 
 * secure data transmission and access control.
 */

// Now pointing to our own backend proxy instead of direct Frappe URL
const PROXY_BASE_URL = '/api/frappe';

interface FrappeResponse<T> {
  data?: T;
  message?: T;
  exc?: string;
  error?: string;
}

export class FrappeService {
  private static getHeaders() {
    const token = useAuthStore.getState().token;
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  /**
   * Secure Audit Logging (ISO 27001 A.12.4)
   * Logs critical actions to the backend for audit trails.
   */
  private static async logAudit(action: string, details: any) {
    try {
      await this.callMethod('shipstack.api.log_audit', {
        action,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed to log audit action', err);
    }
  }

  private static async request<T>(method: string, endpoint: string, body?: any): Promise<T> {
    const url = `${PROXY_BASE_URL}/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Unexpected non-JSON response [${response.status}]: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Proxy Error: ${response.status}`);
      }

      const result: FrappeResponse<any> = await response.json();
      
      // Frappe method calls return 'message', resource calls return 'data'
      // We prioritize 'data' for resource lists, 'message' for method calls
      if (result.data !== undefined) return result.data;
      if (result.message !== undefined) return result.message;
      
      // If neither is present, return the whole result if it doesn't look like an error
      if (result && !result.exc && !result.error) return result as unknown as T;

      throw new Error(result.message || 'ERP response missing expected data/message property');
    } catch (error) {
      if (!(error instanceof TypeError && error.message === 'Failed to fetch')) {
        console.error(`Frappe Proxy Error [${method} ${endpoint}]:`, error);
      }
      throw error;
    }
  }

  static async callMethod<T>(method: string, args: any = {}): Promise<T> {
    // Correctly routes through the generic method caller proxy
    return this.request<T>('POST', 'call-method', { method, args });
  }

  private static getShipstackDocType(doctype: string): string {
    const standardDocTypes = ['User', 'File', 'Role', 'Profile'];
    if (standardDocTypes.includes(doctype) || doctype.startsWith('Shipstack ')) {
      return doctype;
    }
    return `Shipstack ${doctype}`;
  }

  // --- Generic Resource Methods ---

  static async getList<T>(doctype: string, filters?: any, fields: string[] = ['*'], limit_page_length: number = 20, limit_start: number = 0): Promise<T[]> {
    const mappedDoctype = this.getShipstackDocType(doctype);
    const params = new URLSearchParams({
      doctype: mappedDoctype,
      filters: JSON.stringify(filters || {}),
      fields: JSON.stringify(fields),
      limit_page_length: limit_page_length.toString(),
      limit_start: limit_start.toString(),
    });
    
    // Select the appropriate proxy endpoint
    let endpoint = '';
    if (doctype === 'User') endpoint = 'users';
    else if (doctype === 'Delivery Note') endpoint = 'delivery-notes';
    else {
      // Generic fallback if needed, or handle specifically
      return this.callMethod<T[]>(`frappe.client.get_list`, { doctype: mappedDoctype, filters, fields, limit_page_length, limit_start });
    }

    return this.request<T[]>('GET', `${endpoint}?${params.toString()}`);
  }

  static async getDoc<T>(doctype: string, name: string): Promise<T> {
    const mappedDoctype = this.getShipstackDocType(doctype);
    return this.callMethod<T>('frappe.client.get_value', { doctype: mappedDoctype, name, fieldname: '*' });
  }

  static async createDoc<T>(doctype: string, data: any): Promise<T> {
    const mappedDoctype = this.getShipstackDocType(doctype);
    await this.logAudit(`CREATE_${mappedDoctype.toUpperCase()}`, data);
    return this.callMethod<T>('frappe.client.insert', { doc: { doctype: mappedDoctype, ...data } });
  }

  static async updateDoc<T>(doctype: string, name: string, data: any): Promise<T> {
    const mappedDoctype = this.getShipstackDocType(doctype);
    await this.logAudit(`UPDATE_${mappedDoctype.toUpperCase()}`, { name, data });
    return this.callMethod<T>('frappe.client.set_value', { doctype: mappedDoctype, name, values: data });
  }

  static async deleteDoc(doctype: string, name: string): Promise<void> {
    const mappedDoctype = this.getShipstackDocType(doctype);
    await this.logAudit(`DELETE_${mappedDoctype.toUpperCase()}`, { name });
    await this.callMethod('frappe.client.delete', { doctype: mappedDoctype, name });
  }

  // --- Specialized Methods ---

  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${PROXY_BASE_URL}/call-method`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ method: 'frappe.ping' })
      });
      return response.ok;
    } catch (err) {
      return false;
    }
  }
}
