/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Profit & Loss (P&L) Statement Page
 * Precision profit calculation: Gross Profit = Net Sales - Food Cost;
 * Net Profit = Gross Profit - Platform Fees - Packaging - Expenses - Labor.
 */

import React from 'react';
import { TrendingUp, DollarSign, PieChart, ShieldCheck, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { calculateNetProfit } from '../../engine/calculations';

export const PnlPage: React.FC = () => {
  const { store } = useStore();

  const paidBills = store.bills.filter((b) => b.status === 'paid');

  const grossSales = paidBills.reduce((s, b) => s + b.total, 0);
  const vatTotal = paidBills.reduce((s, b) => s + b.vatAmount, 0);
  const serviceChargeTotal = paidBills.reduce((s, b) => s + b.serviceChargeAmount, 0);

  // Net Sales excludes VAT and service charge
  const netSales = Math.max(0, grossSales - vatTotal - serviceChargeTotal);

  // Food cost from snapshots
  const foodCost = paidBills.reduce((s, b) => s + b.totalFoodCost, 0);

  // Gross profit
  const grossProfit = Math.max(0, netSales - foodCost);

  // Estimated platform fees
  const platformFees = paidBills.reduce((acc, b) => {
    const channel = store.channels.find((c) => c.id === b.channelId);
    if (!channel || channel.commissionPercent === 0) return acc;
    const comm = (b.total * channel.commissionPercent) / 100;
    const vatOnComm = (comm * channel.vatOnCommissionPercent) / 100;
    return acc + comm + vatOnComm;
  }, 0);

  // Expenses & Labor
  const operatingExpenses = store.expenses.reduce((s, e) => s + e.amount, 0);
  const laborExpenses = store.employees.reduce((s, emp) => {
    return s + (emp.wageType === 'monthly' ? emp.wageRate : emp.wageRate * 160);
  }, 0);
  const packagingExpenses = 0; // If tracked separately

  // Net Profit
  const netProfit = calculateNetProfit(
    grossProfit,
    platformFees,
    packagingExpenses,
    operatingExpenses,
    laborExpenses
  );

  const grossMarginPercent = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
  const netMarginPercent = netSales > 0 ? (netProfit / netSales) * 100 : 0;
  const foodCostPercent = netSales > 0 ? (foodCost / netSales) * 100 : 0;

  return (
    <div className="space-y-5 pb-12 max-w-5xl mx-auto">
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <h2 className="text-sm font-bold text-neutral-900">Profit &amp; Loss (P&amp;L) Statement</h2>
        <p className="text-xs text-neutral-500">
          Executive financial engine: Gross Profit = Net Sales - Food Cost; Net Profit = Gross Profit - Platform Fees - Overheads - Labor.
        </p>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[10px] text-neutral-500 block uppercase font-medium">Net Sales (Excl. VAT)</span>
          <span className="text-xl font-bold text-neutral-900 tabular-nums">
            {netSales.toLocaleString(undefined, { minimumFractionDigits: 2 })} ฿
          </span>
          <span className="text-[11px] text-neutral-400 block mt-0.5">
            Gross Sales: {grossSales.toFixed(2)} ฿
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[10px] text-neutral-500 block uppercase font-medium">Gross Profit</span>
          <span className="text-xl font-bold text-emerald-700 tabular-nums">
            {grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} ฿
          </span>
          <span className="text-[11px] text-emerald-800 font-medium block mt-0.5">
            Margin: {grossMarginPercent.toFixed(1)}% · Food Cost: {foodCostPercent.toFixed(1)}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[10px] text-neutral-500 block uppercase font-medium">Net Profit</span>
          <span
            className={`text-xl font-bold tabular-nums ${
              netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} ฿
          </span>
          <span className="text-[11px] text-neutral-500 block mt-0.5">
            Net Margin: {netMarginPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Formal P&L Ledger Breakdown */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-200 font-bold text-xs text-neutral-700">
          Financial Ledger Breakdown
        </div>

        <div className="divide-y divide-neutral-100 text-xs">
          <div className="p-3.5 flex justify-between font-semibold text-neutral-900">
            <span>Gross Revenue (Total customer receipts)</span>
            <span className="tabular-nums">{grossSales.toFixed(2)} ฿</span>
          </div>

          <div className="p-3.5 pl-6 flex justify-between text-neutral-500">
            <span>Less: Output VAT collected</span>
            <span className="tabular-nums font-mono">-{vatTotal.toFixed(2)} ฿</span>
          </div>

          <div className="p-3.5 pl-6 flex justify-between text-neutral-500">
            <span>Less: Service charge</span>
            <span className="tabular-nums font-mono">-{serviceChargeTotal.toFixed(2)} ฿</span>
          </div>

          <div className="p-3.5 flex justify-between bg-neutral-50/70 font-bold text-neutral-900">
            <span>1. Net Sales</span>
            <span className="tabular-nums">{netSales.toFixed(2)} ฿</span>
          </div>

          <div className="p-3.5 pl-6 flex justify-between text-amber-900">
            <span>Less: Cost of Goods Sold (Food Cost from snapshots)</span>
            <span className="tabular-nums font-mono font-semibold">-{foodCost.toFixed(2)} ฿</span>
          </div>

          <div className="p-3.5 flex justify-between bg-emerald-50/40 font-bold text-emerald-900 text-sm">
            <span>2. Gross Profit</span>
            <span className="tabular-nums">{grossProfit.toFixed(2)} ฿</span>
          </div>

          <div className="p-3.5 pl-6 flex justify-between text-neutral-600">
            <span>Less: Delivery Platform Fees &amp; VAT on GP</span>
            <span className="tabular-nums font-mono">-{platformFees.toFixed(2)} ฿</span>
          </div>

          <div className="p-3.5 pl-6 flex justify-between text-neutral-600">
            <span>Less: Operating Expenses (Rent, Utilities, Supplies)</span>
            <span className="tabular-nums font-mono">-{operatingExpenses.toFixed(2)} ฿</span>
          </div>

          <div className="p-3.5 pl-6 flex justify-between text-neutral-600">
            <span>Less: Staff Labor &amp; Wages</span>
            <span className="tabular-nums font-mono">-{laborExpenses.toFixed(2)} ฿</span>
          </div>

          <div className="p-4 flex justify-between bg-neutral-900 text-white font-bold text-sm">
            <span>3. Final Net Profit</span>
            <span
              className={`tabular-nums ${
                netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {netProfit.toFixed(2)} ฿
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
