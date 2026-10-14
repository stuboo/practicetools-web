// Patient-facing API calls. A separate axios instance with NO auth
// interceptors: patient calls carry no token and must never trigger the
// 401 logout redirect in src/api/client.ts.

import axios from 'axios'
import type { Envelope } from '../crypto/envelope'
import { getItem, setItem } from '../storage'
import { KEYS } from '../storageKeys'

const patientClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

export type SubmitResult =
  | { ok: true; expiresAt: string }
  | { ok: false; reason: 'conflict' | 'offline' | 'rate_limited' | 'error' }

/** POST /previsit/submissions. The envelope is sent as a JSON string. */
export async function submitEnvelope(lookup: string, envelope: Envelope): Promise<SubmitResult> {
  try {
    const res = await patientClient.post<{ expires_at: string }>('/previsit/submissions', {
      lookup,
      envelope: JSON.stringify(envelope),
    })
    return { ok: true, expiresAt: res.data.expires_at }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 409) return { ok: false, reason: 'conflict' }
      if (err.response?.status === 429) return { ok: false, reason: 'rate_limited' }
      if (!err.response) return { ok: false, reason: 'offline' }
    }
    return { ok: false, reason: 'error' }
  }
}

// 'submitted' is recorded by the server itself on a successful submission.
export type PrevisitEvent = 'packet_opened' | 'module_completed' | 'diary_finished'

/** Anonymous analytics. Failures are swallowed; never surfaced to the patient. */
export async function sendEvent(packetId: string, event: PrevisitEvent, moduleId?: string): Promise<void> {
  try {
    await patientClient.post('/previsit/events', {
      packet_id: packetId,
      event,
      ...(moduleId ? { module_id: moduleId } : {}),
    })
  } catch {
    // intentionally ignored
  }
}

/**
 * Sends an event at most once per device per packet (flag kept in on-device
 * storage, cleared by "Erase my data"), to stay under the shared rate bucket.
 */
export async function sendEventOnce(packetId: string, event: PrevisitEvent, moduleId?: string): Promise<void> {
  try {
    const flag = `${event}:${moduleId ?? ''}`
    const sent = (await getItem<string[]>(packetId, KEYS.eventsSent)) ?? []
    if (sent.includes(flag)) return
    await setItem(packetId, KEYS.eventsSent, [...sent, flag])
    await sendEvent(packetId, event, moduleId)
  } catch {
    // intentionally ignored
  }
}
