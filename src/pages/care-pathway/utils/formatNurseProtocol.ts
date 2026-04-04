import { Step, Exclusion, Condition } from '../types';
import { getTreatmentById } from '../config/treatmentCatalog';

const TIER_LABEL: Record<string, string> = {
  'first-line': '1st Line',
  'second-line': '2nd Line',
  'third-line': '3rd Line',
  'adjunctive': 'Adjunctive',
};

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

function line(char: string, length: number): string {
  return char.repeat(length);
}

type FormatOptions = {
  conditionName: string;
  key?: string;
  steps: Step[];
  exclusions: Exclusion[];
  condition: Condition;
  createdAt?: string;
  updatedAt?: string;
};

export function formatNurseProtocol(opts: FormatOptions): string {
  const { conditionName, key, steps, exclusions, condition, createdAt, updatedAt } = opts;
  const lines: string[] = [];

  // Header
  lines.push(line('=', 60));
  lines.push('CARE PATHWAY - NURSE PROTOCOL');
  lines.push(line('=', 60));
  lines.push('');
  lines.push(`Condition: ${stripHtml(conditionName)}`);
  if (key) {
    lines.push(`Key: ${key}`);
  }
  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  if (createdAt) {
    lines.push(`Created: ${new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  }
  if (updatedAt) {
    lines.push(`Updated: ${new Date(updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  }
  if (!createdAt && !updatedAt) {
    lines.push(`Generated: ${now}`);
  }
  lines.push('');
  lines.push(line('-', 60));
  lines.push('TREATMENT STEPS');
  lines.push(line('-', 60));

  // Steps
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const treatment = getTreatmentById(condition, step.treatmentId);
    if (!treatment) continue;

    lines.push('');
    const tierLabel = TIER_LABEL[treatment.tier] || treatment.tier;
    const providerTag = treatment.requiresProvider ? ' [PROVIDER ONLY]' : '';
    lines.push(`Step ${step.sequence}: ${stripHtml(treatment.name)} (${tierLabel})${providerTag}`);

    if (step.duration) {
      lines.push(`  Duration: ${stripHtml(step.duration)}`);
    }
    if (step.dose) {
      lines.push(`  Dose: ${stripHtml(step.dose)}`);
    }
    if (step.followUp) {
      lines.push(`  Follow-up: ${stripHtml(step.followUp)}`);
    }
    if (step.notes) {
      lines.push(`  Notes: ${stripHtml(step.notes)}`);
    }
    if (step.escalationTrigger) {
      lines.push(`  Escalation trigger: ${stripHtml(step.escalationTrigger)}`);
    }

    // Transition text between steps
    if (i < steps.length - 1 && step.transitionText) {
      lines.push('');
      lines.push(`  >> ${stripHtml(step.transitionText)}`);
    }
  }

  // Exclusions
  if (exclusions.length > 0) {
    lines.push('');
    lines.push(line('-', 60));
    lines.push('EXCLUDED TREATMENTS');
    lines.push(line('-', 60));

    for (const excl of exclusions) {
      const treatment = getTreatmentById(condition, excl.treatmentId);
      const name = treatment ? stripHtml(treatment.name) : excl.treatmentId;
      lines.push(`  - ${name}: ${stripHtml(excl.reason)}`);
    }
  }

  // Footer
  lines.push('');
  lines.push(line('=', 60));
  if (key) {
    lines.push(`Pathway Key: ${key}`);
  }
  lines.push(`Generated: ${now}`);
  lines.push(line('=', 60));

  return lines.join('\n');
}
