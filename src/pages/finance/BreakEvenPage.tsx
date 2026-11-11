/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Break-Even Analysis Page
 */

import React, { useState } from 'react';
import { Scale, Info, TrendingUp, Calculator } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const BreakEvenPage: React.FC = () => {
  const { store } = useStore();

  const totalExpenses = store.expenses.reduce((s, e) => s + e.amount, 0);
  const totalLabor = store.employees.reduce((s, emp) => {
    return s + (emp.wageType === 'monthly' ? emp.wageRate : emp.wageRate * 160);
  }, 0);

  // Default fixed costs
  const [fixedOverhead, setFixedOverhead] = useState(
    totalExpenses + totalLabor > 0 ? totalExpenses + totalLabor : 45000
  );
  const [targetMarginPct, setTargetMarginPct] = useState(65); // 100 - food cost %

  // Break-even revenue = Fixed Costs / (Gross Margin % / 100)
  const breakEvenRevenue =
    targetMarginPct > 0 ? Math.round((fixedOverhead / (targetMarginPct / 100)) * 100) / 100 : 0;
  const dailyRequiredSales = Math.round((breakEvenRevenue / 30) * 100) / 100;

  return (
    <div className="space-y-5 pb-12 max-w-5xl mx-auto">
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <h2 className="text-sm font-bold text-neutral-900">Break-Even Analysis Calculator</h2>
        <p className="text-xs text-neutral-500">
          Determine the exact sales volume needed to cover fixed overheads based on food cost margin.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Overhead &amp; Margin Inputs
          </h3>

          <div>
            <label className="block text-xs text-neutral-600 mb-1">
              Monthly Fixed Costs (Rent + Labor + Utilities)
            </label>
            <div className="flex items-center rounded-lg border border-neutral-300 px-3 py-2 bg-white">
              <input
                type="number"
                min="0"
                value={fixedOverhead}
                onChange={(e) => setFixedOverhead(Number(e.target.value))}
                className="w-full text-sm font-bold tabular-nums outline-hidden"
              />
              <span className="text-xs text-neutral-400 ml-2">฿ / mo</span>
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Calculated from current recorded expenses ({totalExpenses.toLocaleString()} ฿) and staff ({totalLabor.toLocaleString()} ฿).
            </span>
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1">
              Average Gross Margin % (100% - Food Cost %)
            </label>
            <div className="flex items-center rounded-lg border border-neutral-300 px-3 py-2 bg-white">
              <input
                type="number"
                min="1"
                max="99"
                value={targetMarginPct}
                onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                className="w-full text-sm font-bold tabular-nums outline-hidden"
              />
              <span className="text-xs text-neutral-400 ml-2">%</span>
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Target Food Cost: {store.settings.targetFoodCostPercent}% → Target Margin: {100 - store.settings.targetFoodCostPercent}%.
            </span>
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-amber-50/70 border border-amber-200/80 p-5 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-4">
              Break-Even Targets
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-[11px] text-neutral-600 block">Monthly Break-Even Sales:</span>
                <span className="text-2xl font-bold text-neutral-900 tabular-nums">
                  {breakEvenRevenue.toLocaleString()} ฿
                </span>
              </div>

              <div>
                <span className="text-[11px] text-neutral-600 block">Daily Target (30 days):</span>
                <span className="text-xl font-bold text-amber-900 tabular-nums">
                  {dailyRequiredSales.toLocaleString()} ฿ / day
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-200/60 text-[11px] text-amber-800">
            Formula: Break-even Revenue = Monthly Fixed Costs / (Gross Margin % / 100)
          </div>
        </div>
      </div>
    </div>
  );
};
