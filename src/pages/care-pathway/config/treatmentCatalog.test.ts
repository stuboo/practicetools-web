import { describe, it, expect } from 'vitest';
import { getTreatmentCatalog, getTreatmentById, getTreatmentsByTier } from './treatmentCatalog';
import { oabCondition } from './conditions/oab';
import { TreatmentTier } from '../types';

describe('treatmentCatalog', () => {
  const allTreatments = getTreatmentCatalog(oabCondition);
  const validTiers: TreatmentTier[] = ['first-line', 'second-line', 'third-line', 'adjunctive'];

  it('loads all OAB treatments', () => {
    expect(allTreatments.length).toBeGreaterThan(0);
  });

  it('has no duplicate IDs', () => {
    const ids = allTreatments.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all treatments have required fields', () => {
    for (const t of allTreatments) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(validTiers).toContain(t.tier);
      expect(t.category).toBeTruthy();
      expect(t.defaultDuration).toBeTruthy();
      expect(Array.isArray(t.doseOptions)).toBe(true);
      expect(typeof t.requiresProvider).toBe('boolean');
      expect(t.pdfHandoutPath === null || typeof t.pdfHandoutPath === 'string').toBe(true);
    }
  });

  it('medication treatments have dose options', () => {
    const medications = allTreatments.filter(
      t => t.tier === 'second-line' && t.category !== 'Combination Therapy',
    );
    for (const med of medications) {
      expect(med.doseOptions.length).toBeGreaterThan(0);
    }
  });

  it('behavioral treatments have empty dose options', () => {
    const behavioral = getTreatmentsByTier(oabCondition, 'first-line');
    for (const b of behavioral) {
      expect(b.doseOptions).toEqual([]);
    }
  });

  it('has correct requiresProvider flags for known treatments', () => {
    const botox = getTreatmentById(oabCondition, 'oab-botox');
    expect(botox?.requiresProvider).toBe(true);

    const ptns = getTreatmentById(oabCondition, 'oab-ptns');
    expect(ptns?.requiresProvider).toBe(false);

    const implantable = getTreatmentById(oabCondition, 'oab-implantable-tibial');
    expect(implantable?.requiresProvider).toBe(true);

    const sacral = getTreatmentById(oabCondition, 'oab-sacral-neuromodulation');
    expect(sacral?.requiresProvider).toBe(true);
  });

  it('has 7 first-line behavioral treatments', () => {
    const firstLine = getTreatmentsByTier(oabCondition, 'first-line');
    expect(firstLine).toHaveLength(7);
  });

  it('has 4 third-line procedure treatments', () => {
    const thirdLine = getTreatmentsByTier(oabCondition, 'third-line');
    expect(thirdLine).toHaveLength(4);
  });

  it('has 2 adjunctive treatments', () => {
    const adjunctive = getTreatmentsByTier(oabCondition, 'adjunctive');
    expect(adjunctive).toHaveLength(2);
  });

  it('getTreatmentById returns correct treatment', () => {
    const treatment = getTreatmentById(oabCondition, 'oab-vibegron-75mg');
    expect(treatment).toBeDefined();
    expect(treatment?.name).toBe('Vibegron 75 mg');
    expect(treatment?.tier).toBe('second-line');
  });

  it('getTreatmentById returns undefined for unknown ID', () => {
    const treatment = getTreatmentById(oabCondition, 'nonexistent');
    expect(treatment).toBeUndefined();
  });

  it('all first-line treatments are not requiresProvider', () => {
    const firstLine = getTreatmentsByTier(oabCondition, 'first-line');
    for (const t of firstLine) {
      expect(t.requiresProvider).toBe(false);
    }
  });
});
