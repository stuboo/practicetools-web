import { AuditRecord, AuditStorage } from '../types/audit';

const STORAGE_KEY_PREFIX = 'scheduling-audit-';
const STORAGE_INDEX_KEY = 'scheduling-audit-index';

/**
 * Generate a unique 8-character alphanumeric audit key
 */
export function generateAuditKey(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking chars
  let key = '';
  
  for (let i = 0; i < 8; i++) {
    key += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return key;
}

/**
 * Generate a unique audit key that doesn't already exist in storage
 */
export function generateUniqueAuditKey(): string {
  let key: string;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    key = generateAuditKey();
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error('Failed to generate unique audit key after maximum attempts');
    }
  } while (getAuditRecord(key) !== null);
  
  return key;
}

/**
 * Store an audit record in localStorage
 */
export function storeAuditRecord(record: AuditRecord): void {
  try {
    // Store the individual record
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${record.key}`,
      JSON.stringify(record)
    );
    
    // Update the index of all audit keys for easier retrieval
    const existingIndex = getAuditIndex();
    const updatedIndex = [...existingIndex, record.key];
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(updatedIndex));
  } catch (error) {
    console.error('Failed to store audit record:', error);
    throw new Error('Failed to store audit record. Storage may be full.');
  }
}

/**
 * Retrieve an audit record by key
 */
export function getAuditRecord(key: string): AuditRecord | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key.toUpperCase()}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to retrieve audit record:', error);
    return null;
  }
}

/**
 * Get all audit record keys
 */
export function getAuditIndex(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_INDEX_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to retrieve audit index:', error);
    return [];
  }
}

/**
 * Get all audit records
 */
export function getAllAuditRecords(): AuditRecord[] {
  const index = getAuditIndex();
  const records: AuditRecord[] = [];
  
  for (const key of index) {
    const record = getAuditRecord(key);
    if (record) {
      records.push(record);
    }
  }
  
  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Clean up invalid records and rebuild index
 */
export function cleanupAuditStorage(): void {
  const index = getAuditIndex();
  const validKeys: string[] = [];
  
  for (const key of index) {
    const record = getAuditRecord(key);
    if (record) {
      validKeys.push(key);
    }
  }
  
  localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(validKeys));
}

/**
 * Get storage usage statistics
 */
export function getStorageStats(): { recordCount: number; estimatedSizeKB: number } {
  const records = getAllAuditRecords();
  let totalSize = 0;
  
  for (const record of records) {
    totalSize += JSON.stringify(record).length;
  }
  
  return {
    recordCount: records.length,
    estimatedSizeKB: Math.round(totalSize / 1024)
  };
}