import { describe, expect, it } from 'vitest'
import { FlowState, flowNodes, flowReducer, initialFlowState } from './flow'

function run(...actions: Parameters<typeof flowReducer>[1][]): FlowState {
  return actions.reduce(flowReducer, initialFlowState)
}

describe('med coverage flow graph', () => {
  it('starts at the drug class question', () => {
    expect(initialFlowState.nodeId).toBe('drugClass')
    expect(flowNodes[initialFlowState.nodeId].type).toBe('class')
  })

  it('goes class -> payer type with the class remembered', () => {
    const s = run({ type: 'chooseClass', code: 'oab_beta3' })
    expect(s.nodeId).toBe('payerType')
    expect(s.classCode).toBe('oab_beta3')
  })

  it('offers exactly Medicare, WI Medicaid and commercial as payer types', () => {
    expect(flowNodes.payerType.options?.map((o) => o.value)).toEqual(['medicare', 'medicaid', 'commercial'])
  })

  it.each([
    [0, 'medicarePlan', 'medicare', 'search', ['medicare_plan']],
    [1, 'medicaidPayer', 'medicaid', 'pick', ['medicaid']],
    [2, 'commercialPayer', 'commercial', 'pick', ['commercial', 'pbm']],
  ] as const)('payer type option %i leads to %s', (index, nodeId, payerType, nodeType, kinds) => {
    const s = run({ type: 'chooseClass', code: 'oab_beta3' }, { type: 'chooseOption', index })
    expect(s.nodeId).toBe(nodeId)
    expect(s.payerType).toBe(payerType)
    expect(flowNodes[s.nodeId].type).toBe(nodeType)
    expect(flowNodes[s.nodeId].payerKinds).toEqual(kinds)
  })

  it('reaches the result once a payer is picked', () => {
    const s = run(
      { type: 'chooseClass', code: 'oab_antimuscarinic' },
      { type: 'chooseOption', index: 0 },
      { type: 'choosePayer', payerId: 42 }
    )
    expect(s.nodeId).toBe('result')
    expect(s).toMatchObject({ classCode: 'oab_antimuscarinic', payerType: 'medicare', payerId: 42 })
    expect(s.history).toEqual(['drugClass', 'payerType', 'medicarePlan'])
  })

  it('ignores actions that do not fit the current node', () => {
    expect(run({ type: 'choosePayer', payerId: 1 })).toEqual(initialFlowState)
    expect(run({ type: 'chooseOption', index: 0 })).toEqual(initialFlowState)
    const atType = run({ type: 'chooseClass', code: 'oab_beta3' })
    expect(flowReducer(atType, { type: 'chooseOption', index: 9 })).toBe(atType)
    expect(flowReducer(atType, { type: 'chooseClass', code: 'oab_antimuscarinic' })).toBe(atType)
  })

  it('back clears the answer given at the node it returns to', () => {
    const atResult = run(
      { type: 'chooseClass', code: 'oab_beta3' },
      { type: 'chooseOption', index: 2 },
      { type: 'choosePayer', payerId: 12 }
    )
    const atPick = flowReducer(atResult, { type: 'back' })
    expect(atPick).toMatchObject({ nodeId: 'commercialPayer', payerId: null, payerType: 'commercial' })
    const atType = flowReducer(atPick, { type: 'back' })
    expect(atType).toMatchObject({ nodeId: 'payerType', payerType: null, classCode: 'oab_beta3' })
    const atClass = flowReducer(atType, { type: 'back' })
    expect(atClass).toEqual(initialFlowState)
    expect(flowReducer(atClass, { type: 'back' })).toBe(atClass)
  })

  it('reset returns to the start from anywhere', () => {
    const s = run({ type: 'chooseClass', code: 'oab_beta3' }, { type: 'chooseOption', index: 1 }, { type: 'reset' })
    expect(s).toEqual(initialFlowState)
  })

  it('every edge points at a real node', () => {
    for (const node of Object.values(flowNodes)) {
      for (const target of [node.next, ...(node.options ?? []).map((o) => o.nextNodeId)]) {
        if (target) expect(flowNodes[target]).toBeDefined()
      }
    }
  })
})
