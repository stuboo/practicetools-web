/**
 * CoverageTable component
 * Displays a comparison table of medications in a category
 */

import type { CoverageTable as CoverageTableType } from '../../../types/coverage';

interface CoverageTableProps {
  table: CoverageTableType;
}

function BooleanCell({ value }: { value: boolean | undefined }) {
  if (value === undefined || value === null) {
    return <span className="text-gray-400">—</span>;
  }
  return value ? (
    <span className="text-amber-600 font-medium">Yes</span>
  ) : (
    <span className="text-green-600">No</span>
  );
}

export function CoverageTable({ table }: CoverageTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">
          {table.category_display_name}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">{table.insurance_plan}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Medication
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tier
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Prior Auth
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Step Therapy
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Qty Limit
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Preferred
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.medications.map((med, idx) => (
              <tr
                key={`${med.medication}-${idx}`}
                className={med.is_query_drug ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''}
              >
                <td className="px-4 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${med.is_query_drug ? 'text-blue-900' : 'text-gray-900'}`}>
                      {med.medication}
                    </span>
                    {med.is_query_drug && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        searched
                      </span>
                    )}
                  </div>
                  {med.generic_name && med.generic_name !== med.medication && (
                    <div className="text-xs text-gray-500">{med.generic_name}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-center">
                  {med.tier ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {med.tier}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-center">
                  <BooleanCell value={med.prior_auth} />
                </td>
                <td className="px-3 py-2 text-sm text-center">
                  <BooleanCell value={med.step_therapy} />
                </td>
                <td className="px-3 py-2 text-sm text-center">
                  {med.quantity_limit ? (
                    <span className="text-gray-700">{med.quantity_limit}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-center">
                  <BooleanCell value={med.preferred} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes for any medications */}
      {table.medications.some((m) => m.notes) && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 mb-1">Notes</h4>
          <ul className="space-y-1">
            {table.medications
              .filter((m) => m.notes)
              .map((m, idx) => (
                <li key={idx} className="text-xs text-gray-600">
                  <span className="font-medium">{m.medication}:</span> {m.notes}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
