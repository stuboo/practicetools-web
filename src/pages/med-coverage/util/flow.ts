// The Med Coverage decision flow as a node graph, in the same spirit as
// scheduling/util/workflow.ts: the page renders whatever node the state points
// at, and every transition goes through flowReducer so it can be tested
// without rendering anything.

import { ClassCode, PayerKind } from '../../../types/medCoverage'

export type FlowNodeId =
  | 'drugClass'
  | 'payerType'
  | 'medicarePlan'
  | 'medicaidPayer'
  | 'commercialPayer'
  | 'result'

export type FlowNodeType = 'class' | 'question' | 'search' | 'pick' | 'result'

export type PayerType = 'medicare' | 'medicaid' | 'commercial'

export interface FlowOption {
  text: string
  value: PayerType
  nextNodeId: FlowNodeId
}

export interface FlowNode {
  id: FlowNodeId
  type: FlowNodeType
  text: string
  /** Fixed answers for a question node. */
  options?: FlowOption[]
  /** Payer kinds a search or pick node lists. */
  payerKinds?: PayerKind[]
  /** Where a class, search or pick node goes once answered. */
  next?: FlowNodeId
}

export const flowNodes: Record<FlowNodeId, FlowNode> = {
  drugClass: {
    id: 'drugClass',
    type: 'class',
    text: 'Which kind of medication?',
    next: 'payerType',
  },
  payerType: {
    id: 'payerType',
    type: 'question',
    text: "What is the patient's prescription coverage?",
    options: [
      { text: 'Medicare (Part D or Medicare Advantage)', value: 'medicare', nextNodeId: 'medicarePlan' },
      { text: 'WI Medicaid', value: 'medicaid', nextNodeId: 'medicaidPayer' },
      { text: 'Commercial plan or PBM', value: 'commercial', nextNodeId: 'commercialPayer' },
    ],
  },
  medicarePlan: {
    id: 'medicarePlan',
    type: 'search',
    text: 'Find the Medicare plan',
    payerKinds: ['medicare_plan'],
    next: 'result',
  },
  medicaidPayer: {
    id: 'medicaidPayer',
    type: 'pick',
    text: 'Pick the Medicaid program',
    payerKinds: ['medicaid'],
    next: 'result',
  },
  commercialPayer: {
    id: 'commercialPayer',
    type: 'pick',
    text: 'Pick the plan or PBM',
    payerKinds: ['commercial', 'pbm'],
    next: 'result',
  },
  result: {
    id: 'result',
    type: 'result',
    text: 'Coverage',
  },
}

export interface FlowState {
  nodeId: FlowNodeId
  classCode: ClassCode | null
  payerType: PayerType | null
  payerId: number | null
  /** Nodes already answered, oldest first, for Back. */
  history: FlowNodeId[]
}

export type FlowAction =
  | { type: 'chooseClass'; code: ClassCode }
  | { type: 'chooseOption'; index: number }
  | { type: 'choosePayer'; payerId: number }
  | { type: 'back' }
  | { type: 'reset' }

export const initialFlowState: FlowState = {
  nodeId: 'drugClass',
  classCode: null,
  payerType: null,
  payerId: null,
  history: [],
}

export function getNode(id: FlowNodeId): FlowNode {
  return flowNodes[id]
}

function advance(state: FlowState, to: FlowNodeId, patch: Partial<FlowState>): FlowState {
  return { ...state, ...patch, nodeId: to, history: [...state.history, state.nodeId] }
}

/** Clear every answer given at or after `nodeId`, so Back never leaves stale picks behind. */
function clearFrom(state: FlowState, nodeId: FlowNodeId): FlowState {
  switch (flowNodes[nodeId].type) {
    case 'class':
      return { ...state, classCode: null, payerType: null, payerId: null }
    case 'question':
      return { ...state, payerType: null, payerId: null }
    case 'search':
    case 'pick':
      return { ...state, payerId: null }
    default:
      return state
  }
}

/**
 * Apply one user action. An action that does not fit the current node (say,
 * picking a payer while the class question is showing) returns the state
 * unchanged rather than jumping somewhere unexpected.
 */
export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  const node = flowNodes[state.nodeId]
  switch (action.type) {
    case 'chooseClass':
      if (node.type !== 'class' || !node.next || !action.code) return state
      return advance(state, node.next, { classCode: action.code })
    case 'chooseOption': {
      const option = node.type === 'question' ? node.options?.[action.index] : undefined
      if (!option) return state
      return advance(state, option.nextNodeId, { payerType: option.value })
    }
    case 'choosePayer':
      if ((node.type !== 'search' && node.type !== 'pick') || !node.next) return state
      return advance(state, node.next, { payerId: action.payerId })
    case 'back': {
      if (state.history.length === 0) return state
      const previous = state.history[state.history.length - 1]
      return clearFrom(
        { ...state, nodeId: previous, history: state.history.slice(0, -1) },
        previous
      )
    }
    case 'reset':
      return initialFlowState
  }
}
