/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Financial Dashboard Page
 */

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Wheat,
  Store,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const DashboardPage: React.FC = () => {
  const { store } = useStore();

  const paidBills = store.bills.filter((b) => b.status === 'paid');
  const grossSales = paidBills.reduce((s, b) => s + b.total, 0);
  const vatTotal = paidBills.reduce((s, b) => s + b.vatAmount, 0);
  const serviceChargeTotal = paidBills.reduce((s, b) => s + b.serviceChargeAmount, 0);
  const netSales = Math.max(0, grossSales - vatTotal - serviceChargeTotal);
  const totalFoodCost = paidBills.reduce((s, b) => s + b.totalFoodCost, 0);
  const grossProfit = Math.max(0, netSales - totalFoodCost);

  const actualFoodCostPercent =
    netSales > 0 ? Math.round((totalFoodCost / netSales) * 10000) / 100 : 0;
  const isHealthyFoodCost = actualFoodCostPercent <= store.settings.targetFoodCostPercent;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[10px] text-neutral-400 block uppercase font-medium">Net Sales</span>
          <span className="text-xl font-bold text-neutral-900 tabular-nums">
            {netSales.toLocaleString(undefined, { minimumFractionDigits: 2 })} ฿
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">
            {paidBills.length} completed bills
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[10px] text-neutral-400 block uppercase font-medium">Total Food Cost</span>
          <span className="text-xl font-bold text-neutral-800 tabular-nums">
            {totalFoodCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} ฿
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">
            From sale-time snapshots
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-neutral-400 block uppercase font-medium">
              Actual Food Cost %
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isHealthyFoodCost
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              Target: {store.settings.targetFoodCostPercent}%
            </span>
          </div>
          <span
            className={`text-xl font-bold tabular-nums ${
              isHealthyFoodCost ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {actualFoodCostPercent.toFixed(1)}%
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">
            {isHealthyFoodCost ? 'Within target budget' : 'Exceeds target limit'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[10px] text-neutral-400 block uppercase font-medium">Gross Profit</span>
          <span className="text-xl font-bold text-emerald-700 tabular-nums">
            {grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} ฿
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">
            Net Sales minus Food Cost
          </span>
        </div>
      </div>

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Channel Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            Active Sales Channels
          </h3>
          <div className="space-y-2">
            {store.channels.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 text-xs"
              >
                <div>
                  <span className="font-semibold text-neutral-900 block">{ch.name}</span>
                  <span className="text-[10px] text-neutral-400">
                    GP Fee: {ch.commissionPercent}% · Payment: {ch.paymentFeePercent}%
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-neutral-200 text-neutral-700">
                  {ch.packagingChargedToCustomer ? 'Packaging billed' : 'Store packaging'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health & Single Source of Truth */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
              Data Model &amp; Storage Architecture
            </h3>
            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Single Source of Truth store for POS and Food Cost</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dishes store zero static cost; live calculation engine computes margins</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Atomic transactions for sequential bill numbers &amp; optimistic concurrency</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Export &amp; import JSON backup validation ready</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Restaurant: {store.settings.restaurantName}</span>
            <span>Target Food Cost: {store.settings.targetFoodCostPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
