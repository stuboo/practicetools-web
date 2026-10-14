import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetStorageForTests, getItem, setItem } from '../../storage'
import { KEYS } from '../../storageKeys'
import type { DiaryEvent } from '../../types'
import { DiaryModule } from './DiaryModule'
import { fromInputValue, toLocalIso } from './time'

const PID = 'pkt-test'
type Stored = { events: DiaryEvent[]; unit: 'ml' | 'oz' }
const stored = () => getItem<Stored>(PID, KEYS.diary)

async function open(seenTeaching = true) {
  if (seenTeaching) await setItem(PID, KEYS.teachingSeen, true)
  const user = userEvent.setup()
  const utils = render(<DiaryModule packetId={PID} />)
  await screen.findByRole('button', { name: 'Peed' }).catch(() => undefined)
  return { user, ...utils }
}

beforeEach(() => {
  __resetStorageForTests()
})

describe('time helpers', () => {
  it('produces local ISO with offset', () => {
    expect(toLocalIso(new Date())).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$/)
    expect(fromInputValue('2026-11-01T06:00')).toMatch(/^2026-11-01T06:00:00[+-]\d\d:\d\d$/)
    expect(fromInputValue('nope')).toBeNull()
  })
})

describe('DiaryModule', () => {
  it('logs a void in 3 taps with a quick pick', async () => {
    const { user } = await open()
    let taps = 0
    const tap = async (name: string) => {
      await user.click(screen.getByRole('button', { name }))
      taps++
    }
    await tap('Peed')
    await tap('250')
    await tap('Save')
    expect(taps).toBe(3)
    await screen.findByText(/Peed, 250 mL/)
    const s = await stored()
    expect(s?.events).toHaveLength(1)
    expect(s?.events[0]).toMatchObject({ kind: 'void', volumeMl: 250, urgency: null })
    expect(s?.events[0].t).toMatch(/[+-]\d\d:\d\d$/)
  })

  it('saves void with urgency and unmeasured', async () => {
    const { user } = await open()
    await user.click(screen.getByRole('button', { name: 'Peed' }))
    await user.click(screen.getByRole('button', { name: "Didn't measure" }))
    await user.click(screen.getByRole('button', { name: "4: Couldn't hold it" }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText(/Didn't measure, urge 4/)
    expect((await stored())?.events[0]).toMatchObject({ kind: 'void', volumeMl: null, urgency: 4 })
  })

  it('saves a leak with correct codes', async () => {
    const { user } = await open()
    await user.click(screen.getByRole('button', { name: 'Leaked' }))
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Moderate' }))
    await user.click(screen.getByRole('button', { name: 'Cough, sneeze, or laugh' }))
    await user.click(screen.getByRole('button', { name: 'Yes' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText(/Leaked, Moderate/)
    expect((await stored())?.events[0]).toMatchObject({
      kind: 'leak',
      amount: 'moderate',
      trigger: 'cough_sneeze_laugh',
      padChanged: true,
    })
  })

  it('defaults coffee to caffeinated and water to not, editable', async () => {
    const { user } = await open()
    await user.click(screen.getByRole('button', { name: 'Drank' }))
    await user.click(screen.getByRole('button', { name: 'Coffee' }))
    expect(screen.getByLabelText('Contains caffeine')).toBeChecked()
    await user.click(screen.getByRole('button', { name: '8 oz cup' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText(/Drank Coffee/)
    expect((await stored())?.events[0]).toMatchObject({
      kind: 'intake',
      beverage: 'coffee',
      caffeinated: true,
      volumeMl: 237,
    })
    await user.click(screen.getByRole('button', { name: 'Drank' }))
    await user.click(screen.getByRole('button', { name: 'Water' }))
    expect(screen.getByLabelText('Contains caffeine')).not.toBeChecked()
    await user.click(screen.getByLabelText('Contains caffeine'))
    await user.type(screen.getByLabelText(/Or type an amount/), '300')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(async () => expect((await stored())?.events).toHaveLength(2))
    expect((await stored())?.events.find((e) => e.kind === 'intake' && e.beverage === 'water')).toMatchObject({
      caffeinated: true,
      volumeMl: 300,
    })
  })

  it('toggles Bed and Up', async () => {
    const { user } = await open()
    await user.click(screen.getByRole('button', { name: 'Bed' }))
    expect(screen.getByRole('button', { name: 'Up' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Up' }))
    expect(screen.getByRole('button', { name: 'Bed' })).toBeInTheDocument()
    expect((await stored())?.events.map((e) => e.kind)).toEqual(['bed', 'wake'])
  })

  it('edits and deletes an event', async () => {
    const { user } = await open()
    await user.click(screen.getByRole('button', { name: 'Peed' }))
    await user.click(screen.getByRole('button', { name: '250' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.click(await screen.findByRole('button', { name: /^Edit Peed/ }))
    await user.click(screen.getByRole('button', { name: '300' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText(/Peed, 300 mL/)
    expect((await stored())?.events).toHaveLength(1)
    expect((await stored())?.events[0]).toMatchObject({ volumeMl: 300 })
    await user.click(screen.getByRole('button', { name: /^Delete Peed/ }))
    await user.click(screen.getByRole('button', { name: /^Confirm delete/ }))
    expect(screen.queryAllByTestId('diary-event')).toHaveLength(0)
    expect((await stored())?.events).toHaveLength(0)
  })

  it('shows oz but stores mL', async () => {
    const { user } = await open()
    await user.click(screen.getByRole('button', { name: 'oz' }))
    await user.click(screen.getByRole('button', { name: 'Peed' }))
    await user.click(screen.getByRole('button', { name: '8' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText(/Peed, 8 oz/)
    const s = await stored()
    expect(s?.unit).toBe('oz')
    expect(s?.events[0]).toMatchObject({ kind: 'void', volumeMl: 237 })
  })

  it('persists across remount and shows teaching only once', async () => {
    const user = userEvent.setup()
    const first = render(<DiaryModule packetId={PID} />)
    await screen.findByText('How to keep your bladder diary', { selector: 'h2' })
    expect(screen.getByText(/stand-in for when you fall asleep/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    await user.click(screen.getByRole('button', { name: 'Peed' }))
    await user.click(screen.getByRole('button', { name: '200' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    first.unmount()
    render(<DiaryModule packetId={PID} />)
    await screen.findByText(/Peed, 200 mL/)
    expect(screen.queryByRole('button', { name: 'Got it' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'How to' }))
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument()
  })

  it('shows day indicator and finishes', async () => {
    const onFinished = vi.fn()
    await setItem(PID, KEYS.teachingSeen, true)
    const user = userEvent.setup()
    render(<DiaryModule packetId={PID} onFinished={onFinished} />)
    await screen.findByText('Day 1 of 3')
    expect(screen.getByText(/logged 0 of 3 days/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Finish diary' }))
    expect(onFinished).toHaveBeenCalledOnce()
    expect(await getItem(PID, KEYS.diaryFinished)).toBe(true)
    within(document.body)
  })
  it('editing an entry (time only) does not change its stored volume', async () => {
    await setItem(PID, KEYS.teachingSeen, true)
    await setItem(PID, KEYS.diary, {
      unit: 'oz',
      events: [{ id: 'v1', t: toLocalIso(new Date()), kind: 'void', volumeMl: 253, urgency: null }],
    })
    const user = userEvent.setup()
    render(<DiaryModule packetId={PID} />)
    await user.click(await screen.findByRole('button', { name: /^Edit Peed/ }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(async () => expect((await stored())?.events[0]).toMatchObject({ id: 'v1', volumeMl: 253 }))
  })
})
