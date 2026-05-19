
import { useAuthStore } from '../store';

export interface DocumentMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  entityType: string;
  entityId: string;
  documentType: string;
  tags: string[];
  uploadedBy: string;
  uploadTimestamp: string;
  status: string;
}

export class DocumentService {
  private static getHeaders() {
    const token = useAuthStore.getState().token;
    return {
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  static async uploadDocument(
    file: File, 
    metadata: { 
      entityType: string, 
      entityId: string, 
      documentType: string, 
      tags?: string[], 
      uploadedBy: string 
    }
  ): Promise<DocumentMetadata> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', metadata.entityType);
    formData.append('entityId', metadata.entityId);
    formData.append('documentType', metadata.documentType);
    formData.append('uploadedBy', metadata.uploadedBy);
    if (metadata.tags) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }

    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `Upload failed with status ${response.status}`);
    }

    return response.json();
  }

  static async getDocuments(entityType: string, entityId: string): Promise<DocumentMetadata[]> {
    const params = new URLSearchParams({ entityType, entityId });
    const response = await fetch(`/api/documents?${params.toString()}`, {
      headers: {
        ...this.getHeaders(),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.status}`);
    }

    return response.json();
  }

  static async downloadDocument(docId: string, filename: string): Promise<void> {
    const response = await fetch(`/api/documents/${docId}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  static async deleteDocument(docId: string): Promise<void> {
    const response = await fetch(`/api/documents/${docId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
  }
}
