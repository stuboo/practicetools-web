import axios, { AxiosResponse } from 'axios'
import apiClient from './client'
import {
  MedCovChange,
  MedCovClass,
  MedCovMeta,
  MedCovPayer,
  MedCovPayerDetail,
  MedCovRequestResult,
  PayerKind,
} from '../types/medCoverage'

const BASE = '/med-coverage/v1'

async function getClasses(): Promise<MedCovClass[]> {
  const response: AxiosResponse<MedCovClass[]> = await apiClient.get(`${BASE}/classes`)
  return response.data
}

export interface PayerSearch {
  kind?: PayerKind
  q?: string
  limit?: number
}

async function searchPayers({ kind, q, limit }: PayerSearch = {}): Promise<MedCovPayer[]> {
  const params: Record<string, string | number> = {}
  if (kind) params.kind = kind
  if (q) params.q = q
  if (limit) params.limit = limit
  const response: AxiosResponse<MedCovPayer[]> = await apiClient.get(`${BASE}/payers`, { params })
  return response.data
}

async function getPayer(id: number): Promise<MedCovPayerDetail> {
  const response: AxiosResponse<MedCovPayerDetail> = await apiClient.get(`${BASE}/payers/${id}`)
  return response.data
}

async function getChanges({ payerId, limit }: { payerId?: number; limit?: number } = {}): Promise<MedCovChange[]> {
  const params: Record<string, number> = {}
  if (payerId) params.payer_id = payerId
  if (limit) params.limit = limit
  const response: AxiosResponse<MedCovChange[]> = await apiClient.get(`${BASE}/changes`, { params })
  return response.data
}

async function getMeta(): Promise<MedCovMeta> {
  const response: AxiosResponse<MedCovMeta> = await apiClient.get(`${BASE}/meta`)
  return response.data
}

/**
 * Ask for a payer to be researched. Every HTTP outcome is mapped to a status
 * the request box can word for the MA; the endpoint lands after the card, so
 * a 404/501 ("not open yet") is an expected answer, not a crash.
 */
async function requestPayer(name: string): Promise<MedCovRequestResult> {
  try {
    await apiClient.post(`${BASE}/requests`, { name })
    return { status: 'requested' }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response
      if (status === 422) {
        const detail = (data as { detail?: unknown } | undefined)?.detail
        return {
          status: 'invalid',
          message: typeof detail === 'string' && detail ? detail : 'Plan or PBM name only',
        }
      }
      if (status === 404 || status === 405 || status === 501) return { status: 'closed' }
      if (status === 429) return { status: 'rate_limited' }
    }
    return { status: 'error' }
  }
}

const MedCoverageAPI = Object.freeze({
  getClasses,
  searchPayers,
  getPayer,
  getChanges,
  getMeta,
  requestPayer,
})

export default MedCoverageAPI
