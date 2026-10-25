import { PathStep, ProviderType } from '../util/workflow';
import { DiagnosisType } from '../../../lib/quid6';

export interface Quid6Result {
  totalScore: number;
  stressScore: number;
  urgeScore: number;
  overallIncontinenceImpact: number;
  interpretation: DiagnosisType;
  // 'v2' = validated 0-5 scale. Records saved before versioning come back
  // from the API as 'v1' (the old 0-4 scale) and are not comparable.
  instrumentVersion: string;
}

export interface AuditRecord {
  key: string;
  timestamp: string;
  path: PathStep[];
  finalRecommendation: ProviderType;
  quid6Result?: Quid6Result;
}