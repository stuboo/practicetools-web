/**
 * Coverage API service
 * Implements all coverage endpoints from /api/coverage/*
 */

import apiClient from './client';
import type {
  ApiResponse,
  SearchQuery,
  SearchResponse,
  SuggestedQueriesParams,
  SuggestedQueriesResponse,
  CoverageDocument,
  CoverageDocumentList,
  DocumentListParams,
  DocumentUploadParams,
  DocumentFetchParams,
  DocumentRetryStatus,
  MedicationList,
  MedicationsParams,
  InsurancePlanList,
  InsurancePlansParams,
} from '../types/coverage';

// =============================================================================
// Search
// =============================================================================

/**
 * Perform semantic search across coverage documents
 */
export async function search(query: SearchQuery): Promise<SearchResponse> {
  const response = await apiClient.post<ApiResponse<SearchResponse>>(
    '/coverage/search',
    query
  );
  return response.data.data;
}

/**
 * Get suggested search queries based on context
 */
export async function getSuggestedQueries(
  params?: SuggestedQueriesParams
): Promise<SuggestedQueriesResponse> {
  const response = await apiClient.get<ApiResponse<SuggestedQueriesResponse>>(
    '/coverage/suggested-queries',
    { params }
  );
  return response.data.data;
}

// =============================================================================
// Documents
// =============================================================================

/**
 * List coverage documents with optional filters
 */
export async function listDocuments(
  params?: DocumentListParams
): Promise<CoverageDocumentList> {
  const response = await apiClient.get<ApiResponse<CoverageDocumentList>>(
    '/coverage/documents',
    { params }
  );
  return response.data.data;
}

/**
 * Get a specific document by ID
 */
export async function getDocument(documentId: string): Promise<CoverageDocument> {
  const response = await apiClient.get<ApiResponse<CoverageDocument>>(
    `/coverage/documents/${documentId}`
  );
  return response.data.data;
}

/**
 * Upload a PDF document for processing
 * Returns 202 Accepted - document is processed asynchronously
 */
export async function uploadDocument(
  params: DocumentUploadParams
): Promise<{ document_id: string; status: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('states', JSON.stringify(params.states));
  formData.append('year', String(params.year));
  if (params.insurance_plan_id) {
    formData.append('insurance_plan_id', params.insurance_plan_id);
  }

  const response = await apiClient.post<ApiResponse<{
    document_id: string;
    status: string;
    filename: string;
  }>>('/coverage/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
}

/**
 * Fetch a PDF from URL and process it
 * Returns 202 Accepted - document is processed asynchronously
 */
export async function fetchDocument(
  params: DocumentFetchParams
): Promise<{ document_id: string; status: string; filename: string; source_url: string }> {
  const response = await apiClient.post<ApiResponse<{
    document_id: string;
    status: string;
    filename: string;
    source_url: string;
  }>>('/coverage/documents/fetch', params);
  return response.data.data;
}

/**
 * Delete a coverage document
 */
export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/coverage/documents/${documentId}`);
}

/**
 * Retry processing a failed document
 * Returns 202 Accepted - document is processed asynchronously
 */
export async function retryDocument(
  documentId: string
): Promise<{ document_id: string; status: string; retry_count: number }> {
  const response = await apiClient.post<ApiResponse<{
    document_id: string;
    status: string;
    retry_count: number;
  }>>(`/coverage/documents/${documentId}/retry`);
  return response.data.data;
}

/**
 * Get retry status for a document
 */
export async function getRetryStatus(documentId: string): Promise<DocumentRetryStatus> {
  const response = await apiClient.get<ApiResponse<DocumentRetryStatus>>(
    `/coverage/documents/${documentId}/retry-status`
  );
  return response.data.data;
}

// =============================================================================
// Medications
// =============================================================================

/**
 * List medications with optional category filter or search
 */
export async function listMedications(
  params?: MedicationsParams
): Promise<MedicationList> {
  const response = await apiClient.get<ApiResponse<MedicationList>>(
    '/coverage/medications',
    { params }
  );
  return response.data.data;
}

// =============================================================================
// Insurance Plans
// =============================================================================

/**
 * List insurance plans with optional state filter or search
 */
export async function listInsurancePlans(
  params?: InsurancePlansParams
): Promise<InsurancePlanList> {
  const response = await apiClient.get<ApiResponse<InsurancePlanList>>(
    '/coverage/insurance-plans',
    { params }
  );
  return response.data.data;
}

// =============================================================================
// Health Check
// =============================================================================

interface HealthCheckResponse {
  status: string;
  database: string;
  pinecone: string;
  timestamp: string;
}

/**
 * Check coverage service health
 */
export async function healthCheck(): Promise<HealthCheckResponse> {
  const response = await apiClient.get<ApiResponse<HealthCheckResponse>>(
    '/coverage/health'
  );
  return response.data.data;
}

// Export as namespace for easier imports
export const coverageApi = {
  search,
  getSuggestedQueries,
  listDocuments,
  getDocument,
  uploadDocument,
  fetchDocument,
  deleteDocument,
  retryDocument,
  getRetryStatus,
  listMedications,
  listInsurancePlans,
  healthCheck,
};
