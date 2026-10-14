import type { Beverage, LeakAmount, LeakTrigger, Urgency } from '../../types'

export type FormKind = 'void' | 'leak' | 'intake' | 'bed' | 'wake'

export const URGENCY_LABELS: Record<Urgency, string> = {
  0: 'No urge',
  1: 'Mild urge',
  2: 'Moderate urge',
  3: 'Strong urge',
  4: "Couldn't hold it",
}
export const LEAK_AMOUNTS: { value: LeakAmount; label: string }[] = [
  { value: 'drops', label: 'A few drops' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'soaked', label: 'Soaked' },
]
export const LEAK_TRIGGERS: { value: LeakTrigger; label: string }[] = [
  { value: 'cough_sneeze_laugh', label: 'Cough, sneeze, or laugh' },
  { value: 'activity', label: 'Exercise or lifting' },
  { value: 'urgency', label: 'Sudden urge' },
  { value: 'no_reason', label: 'No reason' },
  { value: 'other', label: 'Something else' },
]
export const BEVERAGES: { value: Beverage; label: string; caffeinated: boolean }[] = [
  { value: 'water', label: 'Water', caffeinated: false },
  { value: 'coffee', label: 'Coffee', caffeinated: true },
  { value: 'tea', label: 'Tea', caffeinated: true },
  { value: 'soda', label: 'Soda', caffeinated: true },
  { value: 'alcohol', label: 'Alcohol', caffeinated: false },
  { value: 'juice', label: 'Juice', caffeinated: false },
  { value: 'milk', label: 'Milk', caffeinated: false },
  { value: 'other', label: 'Other', caffeinated: false },
]
