import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from './client'
import MedCoverageAPI from './medCoverage'

vi.mock('./client', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const post = vi.mocked(apiClient.post)
const get = vi.mocked(apiClient.get)

function httpError(status: number, data: unknown = {}) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('fail', String(status), config, null, { status, statusText: '', headers: {}, config, data })
}

describe('MedCoverageAPI', () => {
  beforeEach(() => {
    post.mockReset()
    get.mockReset()
  })

  it('searches payers with only the params given', async () => {
    get.mockResolvedValue({ data: [] })
    await MedCoverageAPI.searchPayers({ kind: 'medicare_plan', q: 'H5216-001' })
    expect(get).toHaveBeenCalledWith('/med-coverage/v1/payers', { params: { kind: 'medicare_plan', q: 'H5216-001' } })
  })

  it('maps request outcomes', async () => {
    post.mockResolvedValueOnce({ status: 201, data: { status: 'requested' } })
    expect(await MedCoverageAPI.requestPayer('Trilogy')).toEqual({ status: 'requested' })
    expect(post).toHaveBeenCalledWith('/med-coverage/v1/requests', { name: 'Trilogy' })

    post.mockRejectedValueOnce(httpError(422, { detail: 'Plan or PBM name only' }))
    expect(await MedCoverageAPI.requestPayer('x')).toEqual({ status: 'invalid', message: 'Plan or PBM name only' })

    // FastAPI's own validation errors put a list in detail; never show that raw.
    post.mockRejectedValueOnce(httpError(422, { detail: [{ msg: 'too long' }] }))
    expect(await MedCoverageAPI.requestPayer('x')).toEqual({ status: 'invalid', message: 'Plan or PBM name only' })

    post.mockRejectedValueOnce(httpError(404))
    expect(await MedCoverageAPI.requestPayer('x')).toEqual({ status: 'closed' })

    post.mockRejectedValueOnce(httpError(501))
    expect(await MedCoverageAPI.requestPayer('x')).toEqual({ status: 'closed' })

    post.mockRejectedValueOnce(httpError(429))
    expect(await MedCoverageAPI.requestPayer('x')).toEqual({ status: 'rate_limited' })

    post.mockRejectedValueOnce(httpError(500))
    expect(await MedCoverageAPI.requestPayer('x')).toEqual({ status: 'error' })

    post.mockRejectedValueOnce(new Error('network'))
    expect(await MedCoverageAPI.requestPayer('x')).toEqual({ status: 'error' })
  })
})
