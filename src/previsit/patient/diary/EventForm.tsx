import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ozToMl } from '../../diary/units'
import type {
  Beverage,
  DiaryEvent,
  DiaryUnit,
  LeakAmount,
  LeakTrigger,
  Urgency,
} from '../../types'
import { BEVERAGES, LEAK_AMOUNTS, LEAK_TRIGGERS, URGENCY_LABELS, type FormKind } from './labels'
import { fromInputValue, newId, toInputValue, toLocalIso } from './time'

const DRINK_SIZES = [
  { label: '8 oz cup', oz: 8 },
  { label: '12 oz can', oz: 12 },
  { label: '16 oz bottle', oz: 16 },
]
const VOID_PICKS: Record<DiaryUnit, number[]> = {
  ml: [100, 200, 250, 300, 400, 500],
  oz: [4, 8, 10, 12, 16],
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'min-h-[44px] min-w-[44px] rounded-md border px-3 py-2 text-sm font-medium',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background hover:bg-accent',
      )}
    >
      {children}
    </button>
  )
}

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

function volumeToMl(text: string, unit: DiaryUnit): number | null {
  const n = parseFloat(text)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(unit === 'oz' ? ozToMl(n) : n)
}

function shownVolume(ml: number, unit: DiaryUnit): string {
  return unit === 'oz' ? String(Math.round((ml / 29.5735) * 2) / 2) : String(Math.round(ml / 5) * 5)
}

export function EventForm({
  kind,
  initial,
  unit,
  onSave,
  onCancel,
}: {
  kind: FormKind
  initial?: DiaryEvent
  unit: DiaryUnit
  onSave: (e: DiaryEvent) => void
  onCancel: () => void
}) {
  const [time, setTime] = useState(() => toInputValue(initial?.t ?? toLocalIso(new Date())))
  const init = initial?.kind === kind ? initial : undefined

  // void
  const iv = init?.kind === 'void' ? init : undefined
  const [voidText, setVoidText] = useState(iv?.volumeMl != null ? shownVolume(iv.volumeMl, unit) : '')
  const [unmeasured, setUnmeasured] = useState(iv ? iv.volumeMl == null : false)
  const [urgency, setUrgency] = useState<Urgency | null>(iv?.urgency ?? null)

  // leak
  const il = init?.kind === 'leak' ? init : undefined
  const [amount, setAmount] = useState<LeakAmount | null>(il?.amount ?? null)
  const [trigger, setTrigger] = useState<LeakTrigger | null>(il?.trigger ?? null)
  const [padChanged, setPadChanged] = useState(il?.padChanged ?? false)

  // intake
  const ik = init?.kind === 'intake' ? init : undefined
  const [beverage, setBeverage] = useState<Beverage | null>(ik?.beverage ?? null)
  const [caffeinated, setCaffeinated] = useState(ik?.caffeinated ?? false)
  const [pickMl, setPickMl] = useState<number | null>(null)
  const [customText, setCustomText] = useState(ik ? shownVolume(ik.volumeMl, unit) : '')

  // Editing must not silently change a stored volume: the box shows a rounded
  // value, so an untouched box keeps the original mL.
  const keepIfUntouched = (text: string, original: number | undefined) =>
    original !== undefined && text === shownVolume(original, unit) ? original : volumeToMl(text, unit)
  const drinkMl = customText.trim() ? keepIfUntouched(customText, ik?.volumeMl) : pickMl

  const canSave =
    time !== '' &&
    (kind === 'void'
      ? unmeasured || volumeToMl(voidText, unit) !== null
      : kind === 'leak'
        ? amount !== null && trigger !== null
        : kind === 'intake'
          ? beverage !== null && drinkMl !== null
          : true)

  function save() {
    const t = fromInputValue(time)
    if (!t || !canSave) return
    const id = initial?.id ?? newId()
    if (kind === 'void') {
      onSave({ id, t, kind: 'void', volumeMl: unmeasured ? null : keepIfUntouched(voidText, iv?.volumeMl ?? undefined), urgency })
    } else if (kind === 'leak' && amount && trigger) {
      onSave({ id, t, kind: 'leak', amount, trigger, padChanged })
    } else if (kind === 'intake' && beverage && drinkMl !== null) {
      onSave({ id, t, kind: 'intake', volumeMl: drinkMl, beverage, caffeinated })
    } else if (kind === 'bed' || kind === 'wake') {
      onSave({ id, t, kind })
    }
  }

  const title = { void: 'Peed', leak: 'Leaked', intake: 'Drank', bed: 'Went to bed', wake: 'Got up' }[kind]

  return (
    <form
      aria-label={`${initial ? 'Edit' : 'Log'}: ${title}`}
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <h2 className="text-xl font-bold">{initial ? `Edit: ${title}` : title}</h2>

      {kind === 'void' && (
        <>
          <Group legend={`How much? (${unit === 'oz' ? 'oz' : 'mL'})`}>
            {VOID_PICKS[unit].map((v) => (
              <Chip
                key={v}
                selected={!unmeasured && voidText === String(v)}
                onClick={() => {
                  setUnmeasured(false)
                  setVoidText(String(v))
                }}
              >
                {v}
              </Chip>
            ))}
            <Chip
              selected={unmeasured}
              onClick={() => {
                setUnmeasured(true)
                setVoidText('')
              }}
            >
              Didn't measure
            </Chip>
          </Group>
          <label className="block text-sm">
            Or type an amount ({unit === 'oz' ? 'oz' : 'mL'})
            <input
              type="number"
              inputMode="decimal"
              min="0"
              className="mt-1 block min-h-[44px] w-full rounded-md border border-input bg-background px-3"
              value={voidText}
              onChange={(e) => {
                setUnmeasured(false)
                setVoidText(e.target.value)
              }}
            />
          </label>
          <Group legend="How strong was the urge? (optional)">
            {([0, 1, 2, 3, 4] as Urgency[]).map((u) => (
              <Chip key={u} selected={urgency === u} onClick={() => setUrgency(urgency === u ? null : u)}>
                {u}: {URGENCY_LABELS[u]}
              </Chip>
            ))}
          </Group>
        </>
      )}

      {kind === 'leak' && (
        <>
          <Group legend="How much leaked?">
            {LEAK_AMOUNTS.map((a) => (
              <Chip key={a.value} selected={amount === a.value} onClick={() => setAmount(a.value)}>
                {a.label}
              </Chip>
            ))}
          </Group>
          <Group legend="What were you doing?">
            {LEAK_TRIGGERS.map((a) => (
              <Chip key={a.value} selected={trigger === a.value} onClick={() => setTrigger(a.value)}>
                {a.label}
              </Chip>
            ))}
          </Group>
          <Group legend="Did you change your pad or underwear?">
            <Chip selected={padChanged} onClick={() => setPadChanged(true)}>
              Yes
            </Chip>
            <Chip selected={!padChanged} onClick={() => setPadChanged(false)}>
              No
            </Chip>
          </Group>
        </>
      )}

      {kind === 'intake' && (
        <>
          <Group legend="What did you drink?">
            {BEVERAGES.map((b) => (
              <Chip
                key={b.value}
                selected={beverage === b.value}
                onClick={() => {
                  setBeverage(b.value)
                  setCaffeinated(b.caffeinated)
                }}
              >
                {b.label}
              </Chip>
            ))}
          </Group>
          <Group legend="How much?">
            {DRINK_SIZES.map((s) => {
              const ml = Math.round(ozToMl(s.oz))
              return (
                <Chip
                  key={s.oz}
                  selected={!customText.trim() && pickMl === ml}
                  onClick={() => {
                    setCustomText('')
                    setPickMl(ml)
                  }}
                >
                  {s.label}
                </Chip>
              )
            })}
          </Group>
          <label className="block text-sm">
            Or type an amount ({unit === 'oz' ? 'oz' : 'mL'})
            <input
              type="number"
              inputMode="decimal"
              min="0"
              className="mt-1 block min-h-[44px] w-full rounded-md border border-input bg-background px-3"
              value={customText}
              onChange={(e) => {
                setPickMl(null)
                setCustomText(e.target.value)
              }}
            />
          </label>
          <label className="flex min-h-[44px] items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={caffeinated}
              onChange={(e) => setCaffeinated(e.target.checked)}
            />
            Contains caffeine
          </label>
        </>
      )}

      <label className="block text-sm">
        Time
        <input
          type="datetime-local"
          className="mt-1 block min-h-[44px] w-full rounded-md border border-input bg-background px-3"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </label>

      <div className="flex gap-3">
        <Button type="submit" size="lg" className="min-h-[44px] flex-1" disabled={!canSave}>
          Save
        </Button>
        <Button type="button" variant="outline" size="lg" className="min-h-[44px]" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
