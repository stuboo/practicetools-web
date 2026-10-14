// Clinic API calls (spec §8.2). The lookup key travels only in the body.

import apiClient from '@/api/client'

export type RedeemResponse = {
  envelope: string // JSON of an Envelope
  created_at: string
  expires_at: string
}

export async function redeem(lookup: string): Promise<RedeemResponse> {
  const res = await apiClient.post<RedeemResponse>('/previsit/redeem', {
    lookup,
  })
  return res.data
}

export async function deleteSubmission(lookup: string): Promise<void> {
  await apiClient.delete('/previsit/submissions', { data: { lookup } })
}
