/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Reports Page
 * Daily summaries, revenue breakdowns, and daily closing records.
 */

import React from 'react';
import { FileSpreadsheet, Calendar, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ReportsPage: React.FC = () => {
  const { store } = useStore();

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <h2 className="text-sm font-bold text-neutral-900">Daily Summaries &amp; Closing Reports</h2>
        <p className="text-xs text-neutral-500">
          Historical daily closing balances stored under <code>dailySummaries/&#123;YYYY-MM-DD&#125;</code>.
        </p>
      </div>

      {store.dailySummaries.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <FileSpreadsheet className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-700">No daily reports recorded yet</p>
          <p className="text-xs text-neutral-400 mt-1">
            As bills are paid and finalized, daily summaries update automatically in atomic batched writes.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Closing Date</th>
                  <th className="px-4 py-3 text-right">Paid Bills</th>
                  <th className="px-4 py-3 text-right">Gross Sales</th>
                  <th className="px-4 py-3 text-right">Net Sales</th>
                  <th className="px-4 py-3 text-right">Food Cost</th>
                  <th className="px-4 py-3 text-right">Gross Profit</th>
                  <th className="px-4 py-3 text-right">Cost %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {store.dailySummaries.map((summary) => {
                  const costPct =
                    summary.netSales > 0
                      ? Math.round((summary.totalFoodCost / summary.netSales) * 10000) / 100
                      : 0;

                  return (
                    <tr key={summary.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-neutral-900">
                        {summary.date}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                        {summary.paidBills}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-neutral-900 tabular-nums">
                        {summary.totalSales.toFixed(2)} ฿
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-800 tabular-nums">
                        {summary.netSales.toFixed(2)} ฿
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-amber-900 tabular-nums">
                        {summary.totalFoodCost.toFixed(2)} ฿
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700 tabular-nums">
                        {summary.grossProfit.toFixed(2)} ฿
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-neutral-800">
                        {costPct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
