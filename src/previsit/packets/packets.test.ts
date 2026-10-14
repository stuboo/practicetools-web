// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { DRAFT_PACKETS, getPacket, isDraftPacket, listPackets, recommendedStartDate } from './index'
import { getQuestionnaire } from '../questionnaires/registry'
import type { Block, Packet } from '../types'

const PUBLIC_DIR = path.resolve(__dirname, '../../../public/previsit')

const blockTexts = (b: Block): string[] => {
  switch (b.type) {
    case 'heading':
    case 'paragraph':
    case 'callout':
      return [b.text]
    case 'list':
      return b.items
    case 'link':
      return [b.text, b.href]
    case 'video':
      return b.caption ? [b.caption] : []
    case 'image':
      return [b.alt]
  }
}

const allText = (p: Packet): string[] => [
  p.title,
  p.visitLabel,
  ...p.modules.flatMap((m) => [m.title, ...(m.kind === 'info' ? m.blocks.flatMap(blockTexts) : [])]),
]

describe('packets', () => {
  const packets = listPackets()

  it('loads new-incontinence', () => {
    expect(packets.length).toBeGreaterThan(0)
    expect(getPacket('new-incontinence')?.modules.map((m) => m.id)).toEqual([
      'welcome',
      'what-to-expect',
      'quid-questionnaire',
      'bladder-diary',
      'getting-here',
      'share',
    ])
    expect(getPacket('nope')).toBeUndefined()
    expect(isDraftPacket('new-incontinence')).toBe(true)
  })

  describe.each(packets.map((p) => [p.id, p] as const))('%s', (_id, packet) => {
    it('has kebab-case packet and module ids, unique module ids', () => {
      expect(packet.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      const ids = packet.modules.map((m) => m.id)
      ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/))
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('has exactly one share module, last', () => {
      expect(packet.modules.filter((m) => m.kind === 'share')).toHaveLength(1)
      expect(packet.modules[packet.modules.length - 1].kind).toBe('share')
    })

    it('uses registered questionnaires, only cleared ones when not a draft', () => {
      for (const m of packet.modules) {
        if (m.kind !== 'questionnaire') continue
        const q = getQuestionnaire(m.questionnaireId)
        expect(q, `questionnaire ${m.questionnaireId}`).toBeDefined()
        if (!isDraftPacket(packet.id)) expect(q?.licenseStatus).toBe('cleared')
      }
    })

    it('has integer startOffsetDays between 0 and 30', () => {
      for (const m of packet.modules) {
        expect(Number.isInteger(m.startOffsetDays)).toBe(true)
        expect(m.startOffsetDays).toBeGreaterThanOrEqual(0)
        expect(m.startOffsetDays).toBeLessThanOrEqual(30)
      }
    })

    it('references image files that exist in public/previsit', () => {
      for (const m of packet.modules) {
        if (m.kind !== 'info') continue
        for (const b of m.blocks) {
          if (b.type !== 'image') continue
          const rel = b.src.replace(/^\/?previsit\//, '')
          expect(fs.existsSync(path.join(PUBLIC_DIR, rel)), b.src).toBe(true)
        }
      }
    })

    it('contains TODO-REVIEW only if listed in DRAFT_PACKETS', () => {
      const hasTodo = allText(packet).some((t) => t.includes('TODO-REVIEW:'))
      if (hasTodo) expect(DRAFT_PACKETS).toContain(packet.id)
    })

    it('ends every info module with the call-the-clinic line', () => {
      for (const m of packet.modules) {
        if (m.kind !== 'info') continue
        const texts = m.blocks.filter((b) => b.type === 'paragraph').map((b) => (b as { text: string }).text)
        expect(texts.slice(-2)[0]).toBe('Questions before your visit? Call the clinic.')
        expect(texts[texts.length - 1]).toMatch(/^TODO-REVIEW: .*phone/i)
      }
    })
  })
})

describe('recommendedStartDate', () => {
  it('subtracts offset days from the visit date', () => {
    expect(recommendedStartDate('2026-11-03', { startOffsetDays: 5 })).toBe('2026-10-29')
    expect(recommendedStartDate('2026-11-03', { startOffsetDays: 0 })).toBe('2026-11-03')
    expect(recommendedStartDate('2026-03-05', { startOffsetDays: 14 })).toBe('2026-02-19')
  })
})
