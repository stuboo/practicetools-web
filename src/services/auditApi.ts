import { AuditRecord } from '../pages/scheduling/types/audit';

const API_BASE_URL = 'https://api.urogy.in';

export interface CreateAuditRecordResponse {
  message: string;
  data: {
    key: string;
  };
}

export interface GetAuditRecordResponse {
  message: string;
  data: AuditRecord;
}

export interface CheckKeyExistsResponse {
  message: string;
  data: {
    exists: boolean;
  };
}

export interface GetAllAuditRecordsResponse {
  message: string;
  data: {
    records: AuditRecord[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface GetStorageStatsResponse {
  message: string;
  data: {
    recordCount: number;
    estimatedSizeKB: number;
  };
}

export class AuditApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'AuditApiError';
  }
}

class AuditApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AuditApiError(
          data.message || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AuditApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new AuditApiError(
        'Network error occurred while contacting audit service'
      );
    }
  }

  async createAuditRecord(record: AuditRecord): Promise<CreateAuditRecordResponse> {
    return this.request<CreateAuditRecordResponse>('/audit-records', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  }

  async getAuditRecord(key: string): Promise<AuditRecord | null> {
    try {
      const response = await this.request<GetAuditRecordResponse>(`/audit-records/${key}`);
      return response.data;
    } catch (error) {
      if (error instanceof AuditApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async checkKeyExists(key: string): Promise<boolean> {
    const response = await this.request<CheckKeyExistsResponse>(`/audit-records/${key}/exists`);
    return response.data.exists;
  }

  async getAllAuditRecords(limit = 100, offset = 0): Promise<AuditRecord[]> {
    const response = await this.request<GetAllAuditRecordsResponse>(
      `/audit-records?limit=${limit}&offset=${offset}`
    );
    return response.data.records;
  }

  async getStorageStats(): Promise<{ recordCount: number; estimatedSizeKB: number }> {
    const response = await this.request<GetStorageStatsResponse>('/audit-records/stats');
    return response.data;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const auditApiService = new AuditApiService();