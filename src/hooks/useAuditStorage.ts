import { useCallback } from 'react';
import { 
  AuditRecord, 
  Quid6Result 
} from '../pages/scheduling/types/audit';
import { 
  generateUniqueAuditKey,
  storeAuditRecord,
  getAuditRecord,
  getAllAuditRecords,
  getStorageStats
} from '../pages/scheduling/util/audit';
import { PathStep, ProviderType } from '../pages/scheduling/util/workflow';

export function useAuditStorage() {
  const createAuditRecord = useCallback((
    path: PathStep[],
    finalRecommendation: ProviderType,
    quid6Result?: Quid6Result
  ): string => {
    try {
      const key = generateUniqueAuditKey();
      const record: AuditRecord = {
        key,
        timestamp: new Date().toISOString(),
        path,
        finalRecommendation,
        quid6Result
      };
      
      storeAuditRecord(record);
      return key;
    } catch (error) {
      console.error('Failed to create audit record:', error);
      throw error;
    }
  }, []);

  const lookupAuditRecord = useCallback((key: string): AuditRecord | null => {
    return getAuditRecord(key);
  }, []);

  const getAllRecords = useCallback((): AuditRecord[] => {
    return getAllAuditRecords();
  }, []);

  const getStats = useCallback(() => {
    return getStorageStats();
  }, []);

  return {
    createAuditRecord,
    lookupAuditRecord,
    getAllRecords,
    getStats
  };
}