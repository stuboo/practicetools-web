import { ReactNode, useReducer, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Search } from 'lucide-react'
import MedCoverageAPI from '../../api/medCoverage'
import { useDebounce } from '../../hooks/useDebounce'
import { MedCovDrug, MedCovPayer, PayerKind } from '../../types/medCoverage'
import { FlowNode, flowReducer, getNode, initialFlowState } from './util/flow'
import ChangesPanel from './ChangesPanel'
import RequestBox from './RequestBox'
import ResultView from './ResultView'

const STALE = 5 * 60_000

export default function MedCoverage() {
  const [state, dispatch] = useReducer(flowReducer, initialFlowState)
  const node = getNode(state.nodeId)
  const classes = useQuery(['medcov', 'classes'], MedCoverageAPI.getClasses, { staleTime: STALE })
  // Results show every class; /v1/classes only sets their order.
  const classOrder = classes.data?.map((c) => c.code)
  const catalogue = classes.data?.flatMap((c) => c.drugs)
  const payerTypeText = getNode('payerType').options?.find((o) => o.value === state.payerType)?.text

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-gray-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold sm:text-3xl">Med Coverage</h1>
          <p className="text-sm text-gray-600">Which OAB med each plan covers, and what its PA needs.</p>
        </header>

        {state.history.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <button
              type="button"
              onClick={() => dispatch({ type: 'back' })}
              className="inline-flex items-center gap-1 font-medium text-blue-700"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
            </button>
            <button type="button" onClick={() => dispatch({ type: 'reset' })} className="text-gray-600 underline">
              Start over
            </button>
            <span className="min-w-0 break-words text-gray-500">
              {payerTypeText}
            </span>
          </div>
        )}

        <main className="flex flex-col gap-4">
          {node.type !== 'result' && <h2 className="text-lg font-semibold">{node.text}</h2>}

          {node.type === 'question' && (
            <div className="flex flex-col gap-2">
              {node.options?.map((option, index) => (
                <ChoiceButton key={option.value} onClick={() => dispatch({ type: 'chooseOption', index })}>
                  {option.text}
                </ChoiceButton>
              ))}
            </div>
          )}

          {node.type === 'search' && (
            <>
              <MedicareSearch node={node} onPick={(payerId) => dispatch({ type: 'choosePayer', payerId })} />
              <RequestBox />
            </>
          )}

          {node.type === 'pick' && (
            <>
              <PayerPick node={node} onPick={(payerId) => dispatch({ type: 'choosePayer', payerId })} />
              <RequestBox />
            </>
          )}

          {node.type === 'result' && state.payerId != null && (
            <ResultStep payerId={state.payerId} classOrder={classOrder} catalogue={catalogue} />
          )}
        </main>

        <hr className="border-gray-200" />
        <ChangesPanel />
      </div>
    </div>
  )
}

function ChoiceButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left font-medium shadow-sm transition-colors hover:border-blue-400 hover:bg-blue-50"
    >
      {children}
    </button>
  )
}

function PayerButton({ payer, onPick }: { payer: MedCovPayer; onPick: (id: number) => void }) {
  const plan = payer.plan
  return (
    <ChoiceButton onClick={() => onPick(payer.id)}>
      <span className="block break-words">{plan ? plan.plan_name : payer.name}</span>
      <span className="block break-words text-xs font-normal text-gray-500">
        {plan
          ? [plan.contract_plan, plan.contract_name || plan.org_name, plan.plan_type].filter(Boolean).join(' · ')
          : payer.pbm_name
          ? `Pharmacy benefit: ${payer.pbm_name}`
          : payer.kind === 'pbm'
          ? 'PBM'
          : ''}
      </span>
    </ChoiceButton>
  )
}

function MedicareSearch({ node, onPick }: { node: FlowNode; onPick: (id: number) => void }) {
  const [text, setText] = useState('')
  const q = useDebounce(text.trim(), 300)
  const kind = node.payerKinds?.[0] as PayerKind
  const results = useQuery(['medcov', 'payers', kind, q], () => MedCoverageAPI.searchPayers({ kind, q }), {
    enabled: q.length >= 2,
    staleTime: STALE,
  })

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-700">Plan name or contract-plan ID (for example H5216-001)</span>
        <span className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
            aria-label="Search Medicare plans"
            className="w-full min-w-0 rounded border border-gray-300 bg-white p-2 pl-8"
          />
        </span>
      </label>
      {q.length < 2 ? (
        <p className="text-sm text-gray-600">Type at least 2 characters.</p>
      ) : results.isLoading ? (
        <p className="text-sm text-gray-600">Searching…</p>
      ) : results.isError ? (
        <p className="text-sm text-red-700">Plans could not be loaded.</p>
      ) : results.data && results.data.length === 0 ? (
        <p className="text-sm text-gray-600">No Medicare plan matches “{q}”.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {results.data?.map((p) => (
            <PayerButton key={p.id} payer={p} onPick={onPick} />
          ))}
        </div>
      )}
    </div>
  )
}

function PayerPick({ node, onPick }: { node: FlowNode; onPick: (id: number) => void }) {
  const kinds = node.payerKinds ?? []
  const payers = useQuery(
    ['medcov', 'payers', ...kinds],
    async () => {
      const lists = await Promise.all(kinds.map((kind) => MedCoverageAPI.searchPayers({ kind, limit: 200 })))
      return lists.flat().sort((a, b) => a.name.localeCompare(b.name))
    },
    { staleTime: STALE }
  )
  if (payers.isLoading) return <p className="text-sm text-gray-600">Loading…</p>
  if (payers.isError) return <p className="text-sm text-red-700">Payers could not be loaded.</p>
  if (!payers.data?.length) return <p className="text-sm text-gray-600">No payers published yet.</p>
  return (
    <div className="flex flex-col gap-2">
      {payers.data.map((p) => (
        <PayerButton key={p.id} payer={p} onPick={onPick} />
      ))}
    </div>
  )
}

function ResultStep({
  payerId,
  classOrder,
  catalogue,
}: {
  payerId: number
  classOrder?: string[]
  catalogue?: MedCovDrug[]
}) {
  const detail = useQuery(['medcov', 'payer', payerId], () => MedCoverageAPI.getPayer(payerId), {
    staleTime: STALE,
  })
  const meta = useQuery(['medcov', 'meta'], MedCoverageAPI.getMeta, { staleTime: STALE })
  if (detail.isLoading) return <p className="text-sm text-gray-600">Loading coverage…</p>
  if (detail.isError || !detail.data) {
    return <p className="text-sm text-red-700">Coverage for this payer could not be loaded.</p>
  }
  return (
    <ResultView
      detail={detail.data}
      classOrder={classOrder}
      currentPlanYear={meta.data?.cms_release?.plan_year ?? null}
      catalogue={catalogue}
    />
  )
}
