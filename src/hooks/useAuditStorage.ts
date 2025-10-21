import { useCallback } from 'react';
import {
  AuditRecord,
  Quid6Result
} from '../pages/scheduling/types/audit';
import { generateUniqueAuditKey } from '../pages/scheduling/util/audit';
import { PathStep, ProviderType } from '../pages/scheduling/util/workflow';
import { auditApiService, AuditApiError } from '../services/auditApi';
import { AuditLogger } from '../services/auditLogger';

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

      // Log attempt
      AuditLogger.log({
        eventType: 'create_attempt',
        auditKey: key,
        recommendation: finalRecommendation,
        pathSteps: path.length
      });

      try {
        // Try to store the record via API
        await auditApiService.createAuditRecord(record);
        console.log('Audit record created successfully:', key);

        // Log success
        AuditLogger.log({
          eventType: 'create_success',
          auditKey: key,
          recommendation: finalRecommendation,
          pathSteps: path.length
        });
      } catch (apiError) {
        // API storage failed, but we still return the key for display
        console.warn('Failed to store audit record in API, but key generated:', key, apiError);

        // Log failure
        AuditLogger.log({
          eventType: 'create_failure',
          auditKey: key,
          recommendation: finalRecommendation,
          pathSteps: path.length,
          error: apiError instanceof Error ? apiError.message : 'Unknown error',
          httpStatus: apiError instanceof AuditApiError ? apiError.status : undefined
        });
      }

      return key;
    } catch (error) {
      console.error('Failed to generate audit key:', error);
      // Fail silently as per requirements
      return null;
    }
  }, []);

  const lookupAuditRecord = useCallback(async (key: string): Promise<AuditRecord | null> => {
    // Log lookup attempt
    AuditLogger.log({
      eventType: 'lookup_attempt',
      auditKey: key
    });

    try {
      const record = await auditApiService.getAuditRecord(key);

      if (record) {
        // Log successful lookup
        AuditLogger.log({
          eventType: 'lookup_success',
          auditKey: key
        });
      } else {
        // Log not found
        AuditLogger.log({
          eventType: 'lookup_failure',
          auditKey: key,
          error: 'Audit key not found in database'
        });
      }

      return record;
    } catch (error) {
      console.error('Failed to lookup audit record:', error);

      // Log lookup error
      AuditLogger.log({
        eventType: 'lookup_failure',
        auditKey: key,
        error: error instanceof Error ? error.message : 'Unknown error',
        httpStatus: error instanceof AuditApiError ? error.status : undefined
      });

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