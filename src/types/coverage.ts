/**
 * Coverage feature TypeScript types
 * Matches backend models in app/models/coverage.py
 */

// =============================================================================
// Enums
// =============================================================================

export type MedicationCategory = 'vaginal_estrogen' | 'antimuscarinic' | 'beta3_agonist';

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type SuggestedQueryCategory = 'general' | 'medication' | 'coverage' | 'prior_auth';

// =============================================================================
// Medication
// =============================================================================

export interface Medication {
  id: string;
  name: string;
  generic_name: string;
  category: MedicationCategory;
}

export interface MedicationList {
  medications: Medication[];
  total: number;
}

// =============================================================================
// Insurance Plan
// =============================================================================

export interface InsurancePlan {
  id: string;
  name: string;
  states: string[];
}

export interface InsurancePlanList {
  insurance_plans: InsurancePlan[];
  total: number;
}

// =============================================================================
// Coverage Document
// =============================================================================

export interface CoverageDocument {
  id: string;
  filename: string;
  source_url?: string | null;
  insurance_plan_id?: string | null;
  states: string[];
  year: number;
  page_count?: number | null;
  uploaded_by_practice_id?: string | null;
  status: DocumentStatus;
  error_message?: string | null;
  retry_count: number;
  last_retry_at?: string | null;
  created_at: string;
}

export interface CoverageDocumentList {
  documents: CoverageDocument[];
  total: number;
  limit: number;
  offset: number;
}

export interface DocumentUploadParams {
  file: File;
  states: string[];
  year: number;
  insurance_plan_id?: string;
}

export interface DocumentFetchParams {
  url: string;
  filename: string;
  states: string[];
  year: number;
  insurance_plan_id?: string;
}

export interface DocumentRetryStatus {
  document_id: string;
  can_retry: boolean;
  reason?: string | null;
  retry_count: number;
  max_retries: number;
  has_source_url: boolean;
  status: DocumentStatus;
  error_message?: string | null;
}

// =============================================================================
// Search
// =============================================================================

export interface SearchQuery {
  query: string;
  state?: string;
  insurance_plan_id?: string;
  medication?: string;
  practice_id?: string;
  limit?: number;
}

export interface SearchResultItem {
  chunk_id: string;
  document_id: string;
  document_filename: string;
  text: string;
  page_number?: number | null;
  score: number;
  insurance_plan_name?: string | null;
  states: string[];
  year: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  total: number;
}

// =============================================================================
// Suggested Queries
// =============================================================================

export interface SuggestedQuery {
  query: string;
  category: SuggestedQueryCategory;
  description: string;
}

export interface SuggestedQueriesResponse {
  queries: SuggestedQuery[];
  context: Record<string, unknown>;
}

export interface SuggestedQueriesParams {
  state?: string;
  insurance_plan_id?: string;
  medication?: string;
}

// =============================================================================
// API Response Wrappers
// =============================================================================

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  message: string;
  status: false;
}

// =============================================================================
// Document List Query Params
// =============================================================================

export interface DocumentListParams {
  limit?: number;
  offset?: number;
  status?: DocumentStatus;
  year?: number;
  insurance_plan_id?: string;
}

// =============================================================================
// Medications Query Params
// =============================================================================

export interface MedicationsParams {
  category?: MedicationCategory;
  q?: string;
}

// =============================================================================
// Insurance Plans Query Params
// =============================================================================

export interface InsurancePlansParams {
  state?: string;
  q?: string;
}
