import { describe, expect, it } from 'vitest'
import { FlowState, flowNodes, flowReducer, initialFlowState } from './flow'

function run(...actions: Parameters<typeof flowReducer>[1][]): FlowState {
  return actions.reduce(flowReducer, initialFlowState)
}

describe('med coverage flow graph', () => {
  it('starts by asking for the prescription coverage (no drug-class step)', () => {
    expect(initialFlowState.nodeId).toBe('payerType')
    expect(flowNodes.payerType.text).toBe("What is the patient's prescription coverage?")
    expect(Object.keys(flowNodes)).not.toContain('drugClass')
  })

  it('offers exactly Medicare, WI Medicaid and commercial as payer types', () => {
    expect(flowNodes.payerType.options?.map((o) => o.value)).toEqual(['medicare', 'medicaid', 'commercial'])
  })

  it.each([
    [0, 'medicarePlan', 'medicare', 'search', ['medicare_plan']],
    [1, 'medicaidPayer', 'medicaid', 'pick', ['medicaid']],
    [2, 'commercialPayer', 'commercial', 'pick', ['commercial', 'pbm']],
  ] as const)('payer type option %i leads to %s', (index, nodeId, payerType, nodeType, kinds) => {
    const s = run({ type: 'chooseOption', index })
    expect(s.nodeId).toBe(nodeId)
    expect(s.payerType).toBe(payerType)
    expect(flowNodes[s.nodeId].type).toBe(nodeType)
    expect(flowNodes[s.nodeId].payerKinds).toEqual(kinds)
  })

  it('reaches the result once a payer is picked', () => {
    const s = run({ type: 'chooseOption', index: 0 }, { type: 'choosePayer', payerId: 42 })
    expect(s.nodeId).toBe('result')
    expect(s).toMatchObject({ payerType: 'medicare', payerId: 42 })
    expect(s.history).toEqual(['payerType', 'medicarePlan'])
  })

  it('ignores actions that do not fit the current node', () => {
    expect(run({ type: 'choosePayer', payerId: 1 })).toEqual(initialFlowState)
    expect(flowReducer(initialFlowState, { type: 'chooseOption', index: 9 })).toBe(initialFlowState)
    const atPick = run({ type: 'chooseOption', index: 2 })
    expect(flowReducer(atPick, { type: 'chooseOption', index: 0 })).toBe(atPick)
    const atResult = flowReducer(atPick, { type: 'choosePayer', payerId: 3 })
    expect(flowReducer(atResult, { type: 'choosePayer', payerId: 4 })).toBe(atResult)
  })

  it('back clears the answer given at the node it returns to', () => {
    const atResult = run({ type: 'chooseOption', index: 2 }, { type: 'choosePayer', payerId: 12 })
    const atPick = flowReducer(atResult, { type: 'back' })
    expect(atPick).toMatchObject({ nodeId: 'commercialPayer', payerId: null, payerType: 'commercial' })
    const atStart = flowReducer(atPick, { type: 'back' })
    expect(atStart).toEqual(initialFlowState)
    expect(flowReducer(atStart, { type: 'back' })).toBe(atStart)
  })

  it('reset returns to the start from anywhere', () => {
    const s = run({ type: 'chooseOption', index: 1 }, { type: 'choosePayer', payerId: 5 }, { type: 'reset' })
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
