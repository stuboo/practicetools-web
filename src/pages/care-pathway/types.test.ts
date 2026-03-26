import { describe, it, expect } from 'vitest';
import { stepSchema, exclusionSchema, pathwaySchema } from './types';

describe('stepSchema', () => {
  it('validates a complete valid step', () => {
    const result = stepSchema.safeParse({
      treatmentId: 'oab-bladder-diary',
      sequence: 1,
      duration: '2 weeks',
      dose: '75 mg daily',
      notes: 'Patient notes',
      followUp: 'Call in 2 weeks',
      escalationTrigger: 'No improvement',
      transitionText: 'Then →',
    });
    expect(result.success).toBe(true);
  });

  it('validates a minimal step with only required fields', () => {
    const result = stepSchema.safeParse({
      treatmentId: 'oab-bladder-diary',
      sequence: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty treatmentId', () => {
    const result = stepSchema.safeParse({
      treatmentId: '',
      sequence: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing treatmentId', () => {
    const result = stepSchema.safeParse({
      sequence: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative sequence', () => {
    const result = stepSchema.safeParse({
      treatmentId: 'oab-bladder-diary',
      sequence: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero sequence', () => {
    const result = stepSchema.safeParse({
      treatmentId: 'oab-bladder-diary',
      sequence: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer sequence', () => {
    const result = stepSchema.safeParse({
      treatmentId: 'oab-bladder-diary',
      sequence: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('strips HTML from notes', () => {
    const result = stepSchema.safeParse({
      treatmentId: 'oab-bladder-diary',
      sequence: 1,
      notes: '<b>Important</b> note <script>alert("xss")</script>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe('Important note alert("xss")');
    }
  });

  it('strips HTML from all optional text fields', () => {
    const result = stepSchema.safeParse({
      treatmentId: 'oab-bladder-diary',
      sequence: 1,
      duration: '<em>2 weeks</em>',
      dose: '<b>75 mg</b>',
      followUp: '<a href="x">Call</a>',
      escalationTrigger: '<p>trigger</p>',
      transitionText: '<strong>Then</strong>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBe('2 weeks');
      expect(result.data.dose).toBe('75 mg');
      expect(result.data.followUp).toBe('Call');
      expect(result.data.escalationTrigger).toBe('trigger');
      expect(result.data.transitionText).toBe('Then');
    }
  });

  it('rejects notes exceeding maxLength (200 chars)', () => {
    const result = stepSchema.safeParse({
      treatmentId: 'oab-bladder-diary',
      sequence: 1,
      notes: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('accepts notes at exactly maxLength (200 chars)', () => {
    const result = stepSchema.safeParse({
      treatmentId: 'oab-bladder-diary',
      sequence: 1,
      notes: 'x'.repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it('rejects dose exceeding maxLength (100 chars)', () => {
    const result = stepSchema.safeParse({
      treatmentId: 'oab-bladder-diary',
      sequence: 1,
      dose: 'x'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('rejects duration exceeding maxLength (50 chars)', () => {
    const result = stepSchema.safeParse({
      treatmentId: 'oab-bladder-diary',
      sequence: 1,
      duration: 'x'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('rejects transitionText exceeding maxLength (200 chars)', () => {
    const result = stepSchema.safeParse({
      treatmentId: 'oab-bladder-diary',
      sequence: 1,
      transitionText: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

describe('exclusionSchema', () => {
  it('validates a valid exclusion', () => {
    const result = exclusionSchema.safeParse({
      treatmentId: 'oab-botox',
      reason: 'Patient declined',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty treatmentId', () => {
    const result = exclusionSchema.safeParse({
      treatmentId: '',
      reason: 'Some reason',
    });
    expect(result.success).toBe(false);
  });

  it('strips HTML from reason', () => {
    const result = exclusionSchema.safeParse({
      treatmentId: 'oab-botox',
      reason: '<b>Patient</b> declined',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBe('Patient declined');
    }
  });

  it('rejects reason exceeding maxLength (500 chars)', () => {
    const result = exclusionSchema.safeParse({
      treatmentId: 'oab-botox',
      reason: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe('pathwaySchema', () => {
  it('validates a complete valid pathway', () => {
    const result = pathwaySchema.safeParse({
      conditionId: 'oab',
      steps: [{ treatmentId: 'oab-bladder-diary', sequence: 1 }],
      exclusions: [{ treatmentId: 'oab-botox', reason: 'Declined' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty steps array', () => {
    const result = pathwaySchema.safeParse({
      conditionId: 'oab',
      steps: [],
      exclusions: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const stepsIssue = result.error.issues.find(i => i.path.includes('steps'));
      expect(stepsIssue).toBeDefined();
    }
  });

  it('rejects missing conditionId', () => {
    const result = pathwaySchema.safeParse({
      steps: [{ treatmentId: 'oab-bladder-diary', sequence: 1 }],
      exclusions: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty conditionId', () => {
    const result = pathwaySchema.safeParse({
      conditionId: '',
      steps: [{ treatmentId: 'oab-bladder-diary', sequence: 1 }],
      exclusions: [],
    });
    expect(result.success).toBe(false);
  });

  it('validates pathway with empty exclusions', () => {
    const result = pathwaySchema.safeParse({
      conditionId: 'oab',
      steps: [{ treatmentId: 'oab-bladder-diary', sequence: 1 }],
      exclusions: [],
    });
    expect(result.success).toBe(true);
  });

  it('propagates step validation errors', () => {
    const result = pathwaySchema.safeParse({
      conditionId: 'oab',
      steps: [{ treatmentId: '', sequence: -1 }],
      exclusions: [],
    });
    expect(result.success).toBe(false);
  });
});
