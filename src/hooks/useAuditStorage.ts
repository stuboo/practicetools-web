import { useCallback } from 'react';
import { 
  AuditRecord, 
  Quid6Result 
} from '../pages/scheduling/types/audit';
import { generateUniqueAuditKey } from '../pages/scheduling/util/audit';
import { PathStep, ProviderType } from '../pages/scheduling/util/workflow';
import { auditApiService, AuditApiError } from '../services/auditApi';

export function useAuditStorage() {
  const createAuditRecord = useCallback(async (
    path: PathStep[],
    finalRecommendation: ProviderType,
    quid6Result?: Quid6Result
  ): Promise<string | null> => {
    try {
      // Generate key first (this should always work)
      const key = await generateUniqueAuditKey();
      
      const record: AuditRecord = {
        key,
        timestamp: new Date().toISOString(),
        path,
        finalRecommendation,
        quid6Result
      };
      
      try {
        // Try to store the record via API
        await auditApiService.createAuditRecord(record);
        console.log('Audit record created successfully:', key);
      } catch (apiError) {
        // API storage failed, but we still return the key for display
        console.warn('Failed to store audit record in API, but key generated:', key, apiError);
      }
      
      return key;
    } catch (error) {
      console.error('Failed to generate audit key:', error);
      // Fail silently as per requirements
      return null;
    }
  }, []);

  const lookupAuditRecord = useCallback(async (key: string): Promise<AuditRecord | null> => {
    try {
      return await auditApiService.getAuditRecord(key);
    } catch (error) {
      console.error('Failed to lookup audit record:', error);
      if (error instanceof AuditApiError) {
        throw new Error('Unable to retrieve audit record. Please check your connection and try again.');
      }
      throw error;
    }
  }, []);

  const getAllRecords = useCallback(async (): Promise<AuditRecord[]> => {
    try {
      return await auditApiService.getAllAuditRecords();
    } catch (error) {
      console.error('Failed to get all audit records:', error);
      if (error instanceof AuditApiError) {
        throw new Error('Unable to retrieve audit records. Please check your connection and try again.');
      }
      throw error;
    }
  }, []);

  const getStats = useCallback(async () => {
    try {
      return await auditApiService.getStorageStats();
    } catch (error) {
      console.error('Failed to get audit storage stats:', error);
      if (error instanceof AuditApiError) {
        throw new Error('Unable to retrieve storage statistics. Please check your connection and try again.');
      }
      throw error;
    }
  }, []);

  return {
    createAuditRecord,
    lookupAuditRecord,
    getAllRecords,
    getStats
  };
}