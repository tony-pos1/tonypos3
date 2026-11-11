/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Calculation Tests Page (Self-Test Engine)
 * Runs and displays automated verification of all core formulas with Pass/Fail badges.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Calculator,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { runAllCalculationTests, TestCaseResult } from '../engine/testSuite';
import {
  calculateIngredientCostPerBaseUnit,
  calculateVariantCost,
} from '../engine/calculations';
import { Ingredient, DishVariant } from '../types/models';

export const CalculationTestsPage: React.FC = () => {
  const [testSuite, setTestSuite] = useState(() => runAllCalculationTests());
  const [filter, setFilter] = useState<'all' | 'core' | 'recipe' | 'finance' | 'pos'>('all');

  // Interactive Live Calculator Sandbox
  const [customPrice, setCustomPrice] = useState(180);
  const [customQty, setCustomQty] = useState(1);
  const [customUnit, setCustomUnit] = useState('kg');
  const [customYield, setCustomYield] = useState(90);
  const [customRecipeQty, setCustomRecipeQty] = useState(100);
  const [customRecipeUnit, setCustomRecipeUnit] = useState('g');
  const [customSellingPrice, setCustomSellingPrice] = useState(80);

  const handleRerun = () => {
    setTestSuite(runAllCalculationTests());
  };

  // Live calculation for sandbox
  const liveCostPerG = calculateIngredientCostPerBaseUnit(
    customPrice,
    customQty,
    customUnit,
    customYield,
    'g'
  );

  const liveRecipeCost = Math.round(customRecipeQty * liveCostPerG * 100) / 100;
  const liveFoodCostPercent =
    customSellingPrice > 0
      ? Math.round((liveRecipeCost / customSellingPrice) * 10000) / 100
      : 0;
  const liveGrossProfit = Math.round((customSellingPrice - liveRecipeCost) * 100) / 100;

  const filteredResults =
    filter === 'all'
      ? testSuite.results
      : testSuite.results.filter((r) => r.category === filter);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Hero Verification Banner */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-neutral-900">
              Calculation Engine Self-Test Suite
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Automated verification verifying pork 180 THB/kg (90% yield), sub-recipes, platform commissions, snapshots, and profit engines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-neutral-800">
              {testSuite.passedCount} / {testSuite.totalCount} Tests Passed
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">
              {testSuite.allPassed ? '100% Formulas Validated' : 'Some Tests Failed'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRerun}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-run All Tests</span>
          </button>
        </div>
      </div>

      {/* Interactive Live Formula Sandbox */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Interactive Test: Pork 180 THB / 90% Yield / 100g Recipe / 80 THB Sale
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setCustomPrice(180);
              setCustomQty(1);
              setCustomUnit('kg');
              setCustomYield(90);
              setCustomRecipeQty(100);
              setCustomRecipeUnit('g');
              setCustomSellingPrice(80);
            }}
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline"
          >
            Reset to Spec Defaults
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs mb-4">
          <div>
            <label className="block text-[11px] text-neutral-600 mb-1">Purchase Price</label>
            <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5">
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(Number(e.target.value))}
                className="w-full text-xs font-semibold tabular-nums outline-hidden"
              />
              <span className="text-[10px] text-neutral-400 ml-1">THB</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-600 mb-1">Purchase Qty</label>
            <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5">
              <input
                type="number"
                value={customQty}
                onChange={(e) => setCustomQty(Number(e.target.value))}
                className="w-full text-xs font-semibold tabular-nums outline-hidden"
              />
              <span className="text-[10px] text-neutral-400 ml-1">kg</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-600 mb-1">Yield % (Trimming)</label>
            <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5">
              <input
                type="number"
                value={customYield}
                onChange={(e) => setCustomYield(Number(e.target.value))}
                className="w-full text-xs font-semibold tabular-nums outline-hidden"
              />
              <span className="text-[10px] text-neutral-400 ml-1">%</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-600 mb-1">Recipe Qty</label>
            <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5">
              <input
                type="number"
                value={customRecipeQty}
                onChange={(e) => setCustomRecipeQty(Number(e.target.value))}
                className="w-full text-xs font-semibold tabular-nums outline-hidden"
              />
              <span className="text-[10px] text-neutral-400 ml-1">g</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-600 mb-1">Selling Price (Net)</label>
            <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5">
              <input
                type="number"
                value={customSellingPrice}
                onChange={(e) => setCustomSellingPrice(Number(e.target.value))}
                className="w-full text-xs font-semibold tabular-nums outline-hidden"
              />
              <span className="text-[10px] text-neutral-400 ml-1">THB</span>
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <div className="text-[10px] text-neutral-500 mb-1">Verification Status</div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {liveCostPerG === 0.2 && liveRecipeCost === 20 && liveFoodCostPercent === 25
                  ? 'MATCHES SPEC'
                  : 'CUSTOM RESULT'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic calculation output ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-amber-200/60 text-xs">
          <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/50">
            <span className="text-[10px] text-neutral-500 block">Cost Per Base Unit (g)</span>
            <span className="text-sm font-bold text-neutral-900 tabular-nums">
              {liveCostPerG.toFixed(4)} THB / g
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">
              180 THB / (1,000g * 90%)
            </span>
          </div>

          <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/50">
            <span className="text-[10px] text-neutral-500 block">Recipe Cost (100g)</span>
            <span className="text-sm font-bold text-neutral-900 tabular-nums">
              {liveRecipeCost.toFixed(2)} THB
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">
              100g * 0.20 THB/g
            </span>
          </div>

          <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/50">
            <span className="text-[10px] text-neutral-500 block">Food Cost %</span>
            <span className="text-sm font-bold text-amber-700 tabular-nums">
              {liveFoodCostPercent.toFixed(2)} %
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">
              20.00 THB / 80.00 THB
            </span>
          </div>

          <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/50">
            <span className="text-[10px] text-neutral-500 block">Gross Profit</span>
            <span className="text-sm font-bold text-emerald-700 tabular-nums">
              {liveGrossProfit.toFixed(2)} THB
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">
              80.00 THB - 20.00 THB
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-200 pb-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          All Tests ({testSuite.totalCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('core')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'core'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Core Spec &amp; Conversion
        </button>
        <button
          type="button"
          onClick={() => setFilter('recipe')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'recipe'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Recipes &amp; Sub-recipes
        </button>
        <button
          type="button"
          onClick={() => setFilter('finance')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'finance'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Finance &amp; Commissions
        </button>
        <button
          type="button"
          onClick={() => setFilter('pos')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'pos'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          POS Snapshots
        </button>
      </div>

      {/* Test Case Cards List */}
      <div className="space-y-4">
        {filteredResults.map((test, index) => (
          <div
            key={test.id}
            className={`rounded-xl border p-4 transition-all bg-white ${
              test.passed ? 'border-neutral-200' : 'border-rose-300 bg-rose-50/20'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-neutral-100">
              <div className="flex items-start gap-2.5">
                <span className="text-xs font-mono text-neutral-400 mt-0.5">
                  #{String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-2">
                    {test.name}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">{test.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                    test.passed
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {test.passed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PASSED</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>FAILED</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Steps & Expected vs Actual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs">
              <div className="space-y-1 bg-neutral-50 p-3 rounded-lg border border-neutral-100 font-mono text-[11px] text-neutral-600">
                <div className="text-[10px] font-sans font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Step-by-Step Mathematical Verification
                </div>
                {test.steps.map((step, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {step}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Expected Values
                  </div>
                  <div className="space-y-1">
                    {Object.entries(test.expected).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-[11px]">
                        <span className="text-neutral-500">{k}:</span>
                        <span className="font-semibold text-neutral-800 tabular-nums">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <div className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider mb-2">
                    Calculated Engine Values
                  </div>
                  <div className="space-y-1">
                    {Object.entries(test.actual).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-[11px]">
                        <span className="text-neutral-500">{k}:</span>
                        <span className="font-semibold text-emerald-900 tabular-nums">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
