// QUID-6 (Questionnaire for Urinary Incontinence Diagnosis), Bradley et al.,
// Am J Obstet Gynecol 2010. Every item is answered on a six-point frequency
// scale scored 0-5. Items 1-3 form the stress subscale, items 4-6 the urge
// subscale. The validated cutoffs (stress >= 4, urge >= 6) only hold on this
// 0-5 scale.

export const QUID6_INSTRUMENT_VERSION = 'v2';

export const QUID6_OPTIONS = [
  { text: 'None of the time', value: 0 },
  { text: 'Rarely', value: 1 },
  { text: 'Once in a while', value: 2 },
  { text: 'Often', value: 3 },
  { text: 'Most of the time', value: 4 },
  { text: 'All of the time', value: 5 },
] as const;

export const QUID6_MAX_VALUE = 5;

export interface Quid6Question {
  id: number;
  text: string;
  shortText: string;
  category: 'SUI' | 'UUI';
}

const LEAK_STEM = 'Do you leak urine (even small drops), wet yourself, or wet your pads or undergarments';

export const QUID6_QUESTIONS: Quid6Question[] = [
  {
    id: 1,
    text: `${LEAK_STEM} when you cough or sneeze?`,
    shortText: 'Leakage with cough/sneeze?',
    category: 'SUI',
  },
  {
    id: 2,
    text: `${LEAK_STEM} when you bend down or lift something up?`,
    shortText: 'Leakage with bending/lifting?',
    category: 'SUI',
  },
  {
    id: 3,
    text: `${LEAK_STEM} when you walk quickly, jog or exercise?`,
    shortText: 'Leakage with activity?',
    category: 'SUI',
  },
  {
    id: 4,
    text: `${LEAK_STEM} while you are undressing in order to use the toilet?`,
    shortText: 'Leakage while undressing for toilet?',
    category: 'UUI',
  },
  {
    id: 5,
    text: 'Do you get such a strong and uncomfortable need to urinate that you leak urine (even small drops) or wet yourself before reaching the toilet?',
    shortText: 'Leakage with strong urge?',
    category: 'UUI',
  },
  {
    id: 6,
    text: 'Do you have to rush to the bathroom because you get a sudden, strong need to urinate?',
    shortText: 'Rush to bathroom with urge?',
    category: 'UUI',
  },
];

export const STRESS_CUTOFF = 4;
export const URGE_CUTOFF = 6;

export type DiagnosisType =
  | 'Stress Incontinence'
  | 'Urge Incontinence'
  | 'Stress-Predominant Mixed'
  | 'Urge-Predominant Mixed'
  | 'Inconclusive';

export const DIAGNOSIS_DETAILS: Record<
  DiagnosisType,
  { label: string; abbreviation: string; recommendation: string }
> = {
  'Stress Incontinence': {
    label: 'Stress Urinary Incontinence',
    abbreviation: 'SUI',
    recommendation: 'Schedule with surgeon',
  },
  'Urge Incontinence': {
    label: 'Urge Urinary Incontinence',
    abbreviation: 'UUI',
    recommendation: 'Schedule with APP',
  },
  'Stress-Predominant Mixed': {
    label: 'Stress-Predominant Mixed Urinary Incontinence',
    abbreviation: 'SPMUI',
    recommendation: 'Schedule with surgeon',
  },
  'Urge-Predominant Mixed': {
    label: 'Urge-Predominant Mixed Urinary Incontinence',
    abbreviation: 'UPMUI',
    recommendation: 'Schedule with APP',
  },
  Inconclusive: {
    label: 'No clear predominance; further evaluation may be needed',
    abbreviation: 'INCON',
    recommendation: 'Schedule with APP',
  },
};

export interface Quid6Score {
  stressScore: number;
  urgeScore: number;
  diagnosis: DiagnosisType;
}

// Returns the six item scores in question order. Throws if any item is
// unanswered or outside 0-5, so a missing answer can never score as zero.
export const answersToScores = (answers: Record<number, number>): number[] =>
  QUID6_QUESTIONS.map((q) => {
    const value = answers[q.id];
    if (!Number.isInteger(value) || value < 0 || value > QUID6_MAX_VALUE) {
      throw new Error(`QUID-6 item ${q.id} has no valid answer`);
    }
    return value;
  });

export const scoreQuid6 = (scores: number[]): Quid6Score => {
  if (scores.length !== QUID6_QUESTIONS.length) {
    throw new Error('QUID-6 needs exactly 6 item scores');
  }
  if (scores.some((s) => !Number.isInteger(s) || s < 0 || s > QUID6_MAX_VALUE)) {
    throw new Error('QUID-6 item scores must be integers from 0 to 5');
  }

  const stressScore = scores.slice(0, 3).reduce((sum, s) => sum + s, 0);
  const urgeScore = scores.slice(3, 6).reduce((sum, s) => sum + s, 0);

  const hasStress = stressScore >= STRESS_CUTOFF;
  const hasUrge = urgeScore >= URGE_CUTOFF;

  // Predominance in mixed incontinence is a local rule, not part of the
  // validated instrument: the higher raw subscale wins and ties go to urge.
  let diagnosis: DiagnosisType = 'Inconclusive';
  if (hasStress && hasUrge) {
    diagnosis = stressScore > urgeScore ? 'Stress-Predominant Mixed' : 'Urge-Predominant Mixed';
  } else if (hasStress) {
    diagnosis = 'Stress Incontinence';
  } else if (hasUrge) {
    diagnosis = 'Urge Incontinence';
  }

  return { stressScore, urgeScore, diagnosis };
};

// Score strings are pasted into scheduling notes. The "v2" prefix separates
// them from older unprefixed strings, which used a 0-4 scale and different
// answer labels and cannot be reinterpreted.
const SCORE_PREFIX = `QUID-6${QUID6_INSTRUMENT_VERSION}:`;

export const formatScoreString = (scores: number[]): string => `${SCORE_PREFIX} ${scores.join('')}`;

export type ParsedScoreString =
  | { ok: true; scores: number[] }
  | { ok: false; reason: 'legacy' | 'invalid' };

export const parseScoreString = (input: string): ParsedScoreString => {
  const current = input.match(/QUID-6v2:\s*([0-5]{6})(?!\d)/i);
  if (current) {
    return { ok: true, scores: current[1].split('').map(Number) };
  }
  if (/QUID-6:\s*\d{6}(?!\d)/i.test(input) || /(?<!\d)[0-4]{6}(?!\d)/.test(input)) {
    return { ok: false, reason: 'legacy' };
  }
  return { ok: false, reason: 'invalid' };
};

export const generateDetailedReport = (scores: number[]): string => {
  const { stressScore, urgeScore } = scoreQuid6(scores);

  let report = 'QUID-6 Questionnaire\n';
  report += '==================\n';
  QUID6_QUESTIONS.forEach((q, index) => {
    report += `${q.shortText} -> ${QUID6_OPTIONS[scores[index]].text}\n`;
  });
  report += '==================\n';
  report += `SUI Score: ${stressScore}\n`;
  report += `UUI Score: ${urgeScore}`;

  return report;
};
