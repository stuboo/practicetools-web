import { Condition, Treatment } from '../types';

export function getTreatmentCatalog(condition: Condition): Treatment[] {
  return condition.treatments;
}

export function getTreatmentById(condition: Condition, id: string): Treatment | undefined {
  return condition.treatments.find((t) => t.id === id);
}

export function getTreatmentsByTier(condition: Condition, tier: Treatment['tier']): Treatment[] {
  return condition.treatments.filter((t) => t.tier === tier);
}
