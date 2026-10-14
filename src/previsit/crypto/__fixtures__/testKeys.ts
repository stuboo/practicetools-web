// TEST ONLY. This P-256 key pair exists solely for unit and component tests.
// It protects nothing. NEVER use it as, or alongside, the real practice key.

import type { SubmissionPayload } from '../../types'
import { sealEnvelope, type Envelope } from '../envelope'

export const TEST_ONLY_PUBLIC_JWK: JsonWebKey = {
  kty: 'EC',
  crv: 'P-256',
  x: 'P213d1k15XOG1jDQYFsxLXQzriS91nDgIrI3yfjlSXg',
  y: 'OVYgsT6ufaqC5zGlq477W5aUGR822S-xUyvu2X71jtI',
}

export const TEST_ONLY_PRIVATE_JWK: JsonWebKey = {
  ...TEST_ONLY_PUBLIC_JWK,
  d: 'k0EhggSh0Sj0_Ly3WKOSG93CifVotbdk_lpBXofAQ44',
}

export const TEST_ONLY_CODE = 'ABCDE-FGHJJ'

/** Builds an envelope sealed to the TEST ONLY public key, for component tests. */
export function buildTestEnvelope(
  payload: SubmissionPayload,
  code: string
): Promise<Envelope> {
  return sealEnvelope(payload, code, TEST_ONLY_PUBLIC_JWK)
}
