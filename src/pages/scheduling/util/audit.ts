import { auditApiService } from '../../../services/auditApi';

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
 * Generate a unique audit key that doesn't already exist in the API
 * Falls back to simple generation if API is unavailable (e.g., during development)
 */
export async function generateUniqueAuditKey(): Promise<string> {
  const key = generateAuditKey();
  
  try {
    // Try to check if key exists in API
    const exists = await auditApiService.checkKeyExists(key);
    if (exists) {
      // If it exists, try a few more times
      let attempts = 1;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        const newKey = generateAuditKey();
        const newExists = await auditApiService.checkKeyExists(newKey);
        if (!newExists) {
          return newKey;
        }
        attempts++;
      }
      
      // If we still have collisions after 10 attempts, just use the last generated key
      // The probability of collision is extremely low (1 in 32^8 = ~1 trillion)
      return generateAuditKey();
    }
    
    return key;
  } catch (error) {
    // If API is unavailable (e.g., during development), just return the generated key
    // The collision probability is negligible for development purposes
    console.log('API unavailable for key uniqueness check, using generated key');
    return key;
  }
}

