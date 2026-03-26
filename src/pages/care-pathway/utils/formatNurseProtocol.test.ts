import { describe, it, expect } from 'vitest';
import { formatNurseProtocol } from './formatNurseProtocol';
import { oabCondition } from '../config/conditions/oab';
import { Step, Exclusion } from '../types';

const baseOpts = {
  conditionName: oabCondition.name,
  condition: oabCondition,
  steps: [] as Step[],
  exclusions: [] as Exclusion[],
};

describe('formatNurseProtocol', () => {
  it('returns header and footer with no steps or exclusions', () => {
    const result = formatNurseProtocol(baseOpts);
    expect(result).toContain('CARE PATHWAY - NURSE PROTOCOL');
    expect(result).toContain('TREATMENT STEPS');
    expect(result).toContain(`Condition: ${oabCondition.name}`);
    // No step content
    expect(result).not.toContain('Step 1:');
    expect(result).not.toContain('EXCLUDED TREATMENTS');
  });

  it('includes key when provided', () => {
    const result = formatNurseProtocol({ ...baseOpts, key: 'ABC123' });
    expect(result).toContain('Key: ABC123');
    expect(result).toContain('Pathway Key: ABC123');
  });

  it('renders a single behavioral step correctly', () => {
    const steps: Step[] = [
      { treatmentId: 'oab-bladder-diary', sequence: 1, duration: '2 weeks' },
    ];
    const result = formatNurseProtocol({ ...baseOpts, steps });
    expect(result).toContain('Step 1: Bladder Diary (1st Line)');
    expect(result).toContain('Duration: 2 weeks');
    // Behavioral treatments have no dose
    expect(result).not.toContain('Dose:');
  });

  it('renders multiple steps with correct numbering', () => {
    const steps: Step[] = [
      { treatmentId: 'oab-bladder-diary', sequence: 1, duration: '2 weeks' },
      { treatmentId: 'oab-vibegron-75mg', sequence: 2, duration: '4-6 weeks', dose: '75 mg daily' },
      { treatmentId: 'oab-botox', sequence: 3, duration: '6-9 months', dose: '100 units intradetrusor' },
    ];
    const result = formatNurseProtocol({ ...baseOpts, steps });
    expect(result).toContain('Step 1: Bladder Diary (1st Line)');
    expect(result).toContain('Step 2: Vibegron 75 mg (2nd Line)');
    expect(result).toContain('Step 3: OnabotulinumtoxinA (Botox) Injection (3rd Line) [PROVIDER ONLY]');
  });

  it('renders dose for medication steps', () => {
    const steps: Step[] = [
      { treatmentId: 'oab-vibegron-75mg', sequence: 1, dose: '75 mg daily' },
    ];
    const result = formatNurseProtocol({ ...baseOpts, steps });
    expect(result).toContain('Dose: 75 mg daily');
  });

  it('omits dose line for behavioral steps without dose', () => {
    const steps: Step[] = [
      { treatmentId: 'oab-timed-voiding', sequence: 1 },
    ];
    const result = formatNurseProtocol({ ...baseOpts, steps });
    expect(result).not.toContain('Dose:');
  });

  it('renders escalation trigger', () => {
    const steps: Step[] = [
      {
        treatmentId: 'oab-bladder-diary', sequence: 1,
        escalationTrigger: 'No improvement after 2 weeks',
      },
    ];
    const result = formatNurseProtocol({ ...baseOpts, steps });
    expect(result).toContain('Escalation trigger: No improvement after 2 weeks');
  });

  it('renders follow-up and notes', () => {
    const steps: Step[] = [
      {
        treatmentId: 'oab-bladder-diary', sequence: 1,
        followUp: 'Call in 2 weeks',
        notes: 'Patient prefers morning tracking',
      },
    ];
    const result = formatNurseProtocol({ ...baseOpts, steps });
    expect(result).toContain('Follow-up: Call in 2 weeks');
    expect(result).toContain('Notes: Patient prefers morning tracking');
  });

  it('renders transition text between steps', () => {
    const steps: Step[] = [
      { treatmentId: 'oab-bladder-diary', sequence: 1, transitionText: 'Then →' },
      { treatmentId: 'oab-timed-voiding', sequence: 2 },
    ];
    const result = formatNurseProtocol({ ...baseOpts, steps });
    expect(result).toContain('>> Then →');
  });

  it('does not render transition text after last step', () => {
    const steps: Step[] = [
      { treatmentId: 'oab-bladder-diary', sequence: 1, transitionText: 'Then →' },
    ];
    const result = formatNurseProtocol({ ...baseOpts, steps });
    expect(result).not.toContain('>> Then →');
  });

  it('renders exclusions section', () => {
    const exclusions: Exclusion[] = [
      { treatmentId: 'oab-oxybutynin-ir-5mg', reason: 'Dry mouth side effects' },
      { treatmentId: 'oab-botox', reason: 'Patient declined' },
    ];
    const result = formatNurseProtocol({ ...baseOpts, exclusions });
    expect(result).toContain('EXCLUDED TREATMENTS');
    expect(result).toContain('- Oxybutynin IR 5 mg: Dry mouth side effects');
    expect(result).toContain('- OnabotulinumtoxinA (Botox) Injection: Patient declined');
  });

  it('produces ASCII-safe output with no unicode box-drawing characters', () => {
    const steps: Step[] = [
      { treatmentId: 'oab-bladder-diary', sequence: 1, duration: '2 weeks' },
      { treatmentId: 'oab-vibegron-75mg', sequence: 2, dose: '75 mg daily', transitionText: 'If previous insufficient →' },
    ];
    const exclusions: Exclusion[] = [
      { treatmentId: 'oab-botox', reason: 'Declined' },
    ];
    const result = formatNurseProtocol({ ...baseOpts, steps, exclusions, key: 'TEST' });
    // Unicode box-drawing range U+2500-U+257F
    const boxDrawingRegex = /[\u2500-\u257F]/;
    expect(boxDrawingRegex.test(result)).toBe(false);
    // Also check no other common unicode decorators
    const fancyChars = /[│┌┐└┘├┤┬┴┼╔╗╚╝║═]/;
    expect(fancyChars.test(result)).toBe(false);
  });

  it('strips HTML from all text fields', () => {
    const steps: Step[] = [
      {
        treatmentId: 'oab-bladder-diary',
        sequence: 1,
        duration: '<b>2 weeks</b>',
        dose: '<script>alert("xss")</script>10mg',
        notes: '<em>Important</em> note',
        followUp: '<a href="x">Call</a> in 2 weeks',
        escalationTrigger: '<p>No improvement</p>',
        transitionText: '<strong>Then</strong> →',
      },
      { treatmentId: 'oab-timed-voiding', sequence: 2 },
    ];
    const exclusions: Exclusion[] = [
      { treatmentId: 'oab-botox', reason: '<b>Patient</b> declined' },
    ];
    const result = formatNurseProtocol({
      ...baseOpts,
      conditionName: '<b>OAB</b>',
      steps,
      exclusions,
    });
    expect(result).not.toContain('<b>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('<em>');
    expect(result).not.toContain('<a ');
    expect(result).not.toContain('<p>');
    expect(result).not.toContain('<strong>');
    expect(result).toContain('Duration: 2 weeks');
    expect(result).toContain('Notes: Important note');
    expect(result).toContain('Condition: OAB');
  });

  it('renders [PROVIDER ONLY] for requiresProvider treatments', () => {
    const steps: Step[] = [
      { treatmentId: 'oab-botox', sequence: 1 },
    ];
    const result = formatNurseProtocol({ ...baseOpts, steps });
    expect(result).toContain('[PROVIDER ONLY]');
  });

  it('does not render [PROVIDER ONLY] for non-provider treatments', () => {
    const steps: Step[] = [
      { treatmentId: 'oab-ptns', sequence: 1 },
    ];
    const result = formatNurseProtocol({ ...baseOpts, steps });
    expect(result).not.toContain('[PROVIDER ONLY]');
  });

  it('renders created/updated dates when provided', () => {
    const result = formatNurseProtocol({
      ...baseOpts,
      createdAt: '2026-03-20T12:00:00Z',
      updatedAt: '2026-03-25T15:30:00Z',
    });
    expect(result).toContain('Created: March 20, 2026');
    expect(result).toContain('Updated: March 25, 2026');
    // Header should not have "Generated:" line since created/updated are present
    // (footer always has "Generated:" which is fine)
    const headerSection = result.split('TREATMENT STEPS')[0];
    expect(headerSection).not.toContain('Generated:');
  });

  it('renders Generated date when no created/updated dates', () => {
    const result = formatNurseProtocol(baseOpts);
    expect(result).toContain('Generated:');
  });
});
