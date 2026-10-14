import type { Module, Packet } from '../types'

const modules = import.meta.glob<Packet>('./*.json', { eager: true, import: 'default' })

const PACKETS: Packet[] = Object.values(modules)

// Packets whose content still contains TODO-REVIEW placeholders. The app shows
// a "Draft content" banner for these (spec §4.3).
export const DRAFT_PACKETS: readonly string[] = ['new-incontinence']

export const listPackets = (): Packet[] => PACKETS

export const getPacket = (id: string): Packet | undefined => PACKETS.find((p) => p.id === id)

export const isDraftPacket = (id: string): boolean => DRAFT_PACKETS.includes(id)

// Recommended start date for a module: visit date minus startOffsetDays.
// Date-only arithmetic in UTC so DST never shifts the day. visitDate is YYYY-MM-DD.
export const recommendedStartDate = (visitDate: string, module: Pick<Module, 'startOffsetDays'>): string => {
  const [y, m, d] = visitDate.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d - module.startOffsetDays))
  return date.toISOString().slice(0, 10)
}
