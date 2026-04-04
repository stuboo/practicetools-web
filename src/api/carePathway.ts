/**
 * Care Pathway API service
 * Implements endpoints for saving, loading, and updating care pathways.
 */

import apiClient from './client';
import type { Pathway } from '../pages/care-pathway/types';

// ── Response types ──

export interface SavePathwayResponse {
  key: string;
  creatorToken: string;
}

export interface GetPathwayResponse extends Pathway {
  key: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePathwayResponse extends Pathway {
  key: string;
  updatedAt: string;
}

// ── API functions ──

/**
 * Save a new pathway. Server generates the key.
 */
export async function savePathway(
  data: Pick<Pathway, 'conditionId' | 'steps' | 'exclusions'>
): Promise<SavePathwayResponse> {
  const response = await apiClient.post<SavePathwayResponse>(
    '/api/care-pathway',
    data
  );
  return response.data;
}

/**
 * Get a pathway by its anonymous key.
 */
export async function getPathway(key: string): Promise<GetPathwayResponse> {
  const response = await apiClient.get<GetPathwayResponse>(
    `/api/care-pathway/${key}`
  );
  return response.data;
}

/**
 * Update an existing pathway. Requires the creatorToken for write protection.
 */
export async function updatePathway(
  key: string,
  data: Pick<Pathway, 'conditionId' | 'steps' | 'exclusions'>,
  creatorToken: string
): Promise<UpdatePathwayResponse> {
  const response = await apiClient.put<UpdatePathwayResponse>(
    `/api/care-pathway/${key}`,
    data,
    {
      headers: {
        'X-Creator-Token': creatorToken,
      },
    }
  );
  return response.data;
}

export const carePathwayApi = {
  savePathway,
  getPathway,
  updatePathway,
};
