import { z } from 'zod';

// ── Core domain types ──

export type TreatmentTier = 'first-line' | 'second-line' | 'third-line' | 'adjunctive';

export type Treatment = {
  id: string;
  name: string;
  tier: TreatmentTier;
  category: string;
  defaultDuration: string;
  doseOptions: string[];
  requiresProvider: boolean;
  pdfHandoutPath: string | null;
};

export type Step = {
  treatmentId: string;
  sequence: number;
  duration?: string;
  dose?: string;
  notes?: string;
  followUp?: string;
  escalationTrigger?: string;
  transitionText?: string;
};

export type Exclusion = {
  treatmentId: string;
  reason: string;
};

export type Condition = {
  id: string;
  name: string;
  treatments: Treatment[];
};

export type Pathway = {
  key?: string;
  conditionId: string;
  steps: Step[];
  exclusions: Exclusion[];
  createdAt?: string;
  updatedAt?: string;
};

// ── Zod validation schemas ──

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, '');

export const stepSchema = z.object({
  treatmentId: z.string().min(1, 'treatmentId is required'),
  sequence: z.number().int().positive('sequence must be a positive integer'),
  duration: z.string().transform(stripHtml).pipe(z.string().max(50)).optional(),
  dose: z.string().transform(stripHtml).pipe(z.string().max(100)).optional(),
  notes: z.string().transform(stripHtml).pipe(z.string().max(200)).optional(),
  followUp: z.string().transform(stripHtml).pipe(z.string().max(500)).optional(),
  escalationTrigger: z.string().transform(stripHtml).pipe(z.string().max(500)).optional(),
  transitionText: z.string().transform(stripHtml).pipe(z.string().max(200)).optional(),
});

export const exclusionSchema = z.object({
  treatmentId: z.string().min(1, 'treatmentId is required'),
  reason: z.string().transform(stripHtml).pipe(z.string().max(500)),
});

export const pathwaySchema = z.object({
  conditionId: z.string().min(1),
  steps: z.array(stepSchema).min(1, 'Pathway must have at least one step'),
  exclusions: z.array(exclusionSchema),
});

export type ValidatedPathway = z.infer<typeof pathwaySchema>;
