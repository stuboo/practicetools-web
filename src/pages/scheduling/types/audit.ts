import { PathStep, ProviderType } from '../util/workflow';
import { DiagnosisType } from '../components/Quid6Questionnaire';

export interface Quid6Result {
  totalScore: number;
  stressScore: number;
  urgeScore: number;
  overallIncontinenceImpact: number;
  interpretation: DiagnosisType;
}

export interface AuditRecord {
  key: string;
  timestamp: string;
  path: PathStep[];
  finalRecommendation: ProviderType;
  quid6Result?: Quid6Result;
}

export interface AuditStorage {
  [key: string]: AuditRecord;
}