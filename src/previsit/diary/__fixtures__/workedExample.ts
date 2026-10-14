// The spec §6.4 worked example: one complete day (Mon 2026-11-02, offset
// -05:00). Reused by the summary, note text, and clinic viewer tests.

import type { DiaryEvent } from '../../types'

const MON = '2026-11-02'
const TUE = '2026-11-03'
const TZ = '-05:00'

export const at = (date: string, hhmm: string): string =>
  `${date}T${hhmm}:00${TZ}`

export const workedExampleEvents: DiaryEvent[] = [
  { id: 'e01', t: at(MON, '06:00'), kind: 'wake' },
  { id: 'e02', t: at(MON, '06:00'), kind: 'void', volumeMl: 400, urgency: 1 },
  {
    id: 'e03',
    t: at(MON, '07:00'),
    kind: 'intake',
    volumeMl: 240,
    beverage: 'coffee',
    caffeinated: true,
  },
  { id: 'e04', t: at(MON, '09:00'), kind: 'void', volumeMl: 250, urgency: 0 },
  {
    id: 'e05',
    t: at(MON, '10:30'),
    kind: 'leak',
    amount: 'drops',
    trigger: 'cough_sneeze_laugh',
    padChanged: false,
  },
  { id: 'e06', t: at(MON, '12:00'), kind: 'void', volumeMl: 200, urgency: 2 },
  {
    id: 'e07',
    t: at(MON, '12:00'),
    kind: 'intake',
    volumeMl: 500,
    beverage: 'water',
    caffeinated: false,
  },
  { id: 'e08', t: at(MON, '15:00'), kind: 'void', volumeMl: 300, urgency: 1 },
  {
    id: 'e09',
    t: at(MON, '16:00'),
    kind: 'leak',
    amount: 'moderate',
    trigger: 'urgency',
    padChanged: true,
  },
  { id: 'e10', t: at(MON, '18:00'), kind: 'void', volumeMl: 250, urgency: 0 },
  {
    id: 'e11',
    t: at(MON, '18:00'),
    kind: 'intake',
    volumeMl: 350,
    beverage: 'water',
    caffeinated: false,
  },
  { id: 'e12', t: at(MON, '22:00'), kind: 'void', volumeMl: 200, urgency: 1 },
  { id: 'e13', t: at(MON, '22:30'), kind: 'bed' },
  { id: 'e14', t: at(TUE, '02:00'), kind: 'void', volumeMl: 300, urgency: 3 },
  { id: 'e15', t: at(TUE, '06:00'), kind: 'wake' },
  { id: 'e16', t: at(TUE, '06:05'), kind: 'void', volumeMl: 350, urgency: 1 },
]
