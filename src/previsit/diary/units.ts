// Volume unit helpers (spec §6.2). Volumes are stored in mL; 1 oz = 29.5735 mL.

import type { DiaryUnit } from '../types'

export const ML_PER_OZ = 29.5735

export function mlToOz(ml: number): number {
  return ml / ML_PER_OZ
}

export function ozToMl(oz: number): number {
  return oz * ML_PER_OZ
}

/** Round a mL value to the nearest 5 mL (display only). */
export function roundDisplayMl(ml: number): number {
  return Math.round(ml / 5) * 5
}

/** Round an oz value to the nearest 0.5 oz (display only). */
export function roundDisplayOz(oz: number): number {
  return Math.round(oz * 2) / 2
}

/** Convert a stored mL value to the numeric value shown in `unit`. */
export function displayVolume(ml: number, unit: DiaryUnit): number {
  return unit === 'oz' ? roundDisplayOz(mlToOz(ml)) : roundDisplayMl(ml)
}

/** e.g. "250 mL" or "8.5 oz". */
export function formatVolume(ml: number, unit: DiaryUnit): string {
  return `${displayVolume(ml, unit)} ${unit === 'oz' ? 'oz' : 'mL'}`
}
