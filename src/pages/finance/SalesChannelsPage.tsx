/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Sales Channels Page
 * Manage Dine-in, Takeaway, Grab, LINE MAN, ShopeeFood, Robinhood, Direct, Other
 * with commission %, payment fee %, VAT on commission %, and customer packaging rules.
 */

import React, { useState } from 'react';
import { Store, Percent, Check, AlertCircle, Info, Calculator } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SalesChannel } from '../../types/models';
import { calculatePlatformFee } from '../../engine/calculations';

export const SalesChannelsPage: React.FC = () => {
  const { store, saveSalesChannel } = useStore();
  const [editingChannel, setEditingChannel] = useState<SalesChannel | null>(null);

  // Quick simulator
  const [simSales, setSimSales] = useState(1000);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    await saveSalesChannel(editingChannel);
    setEditingChannel(null);
  };

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Sales Channels &amp; Delivery Commissions</h2>
          <p className="text-xs text-neutral-500">
            Configure Dine-in, Takeaway, Grab, LINE MAN, ShopeeFood, Robinhood, and Direct delivery channels.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Calculator className="w-4 h-4 text-neutral-400" />
          <span className="text-neutral-500">Simulation Sales:</span>
          <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-2.5 py-1">
            <input
              type="number"
              value={simSales}
              onChange={(e) => setSimSales(Number(e.target.value))}
              className="w-16 font-semibold tabular-nums text-xs outline-hidden"
            />
            <span className="text-[11px] text-neutral-400 ml-1">฿</span>
          </div>
        </div>
      </div>

      <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span>Calculation Rule: </span>
          <code className="text-amber-900 bg-amber-100/60 px-1 py-0.5 rounded font-mono text-[11px]">
            Platform Fee = (commission % * net sales) + (VAT on commission) + (payment fee % * net sales)
          </code>
        </div>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {store.channels.map((channel) => {
          const simFee = calculatePlatformFee(simSales, channel);

          return (
            <div
              key={channel.id}
              className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100 text-neutral-700">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-neutral-900">{channel.name}</h3>
                      <span className="text-[10px] text-neutral-400 uppercase font-mono">
                        {channel.type}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingChannel({ ...channel })}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                  >
                    Edit Rates
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 text-xs">
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                    <span className="text-[10px] text-neutral-500 block">Commission %</span>
                    <span className="text-sm font-bold text-neutral-900 tabular-nums">
                      {channel.commissionPercent}%
                    </span>
                  </div>

                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                    <span className="text-[10px] text-neutral-500 block">Payment Fee %</span>
                    <span className="text-sm font-bold text-neutral-900 tabular-nums">
                      {channel.paymentFeePercent}%
                    </span>
                  </div>

                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                    <span className="text-[10px] text-neutral-500 block">VAT on Comm %</span>
                    <span className="text-sm font-bold text-neutral-900 tabular-nums">
                      {channel.vatOnCommissionPercent}%
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Packaging charged to customer:</span>
                    <span className="font-semibold text-neutral-800">
                      {channel.packagingChargedToCustomer ? 'Yes (Separate fee)' : 'No (Covered by store)'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-neutral-100 text-amber-900 font-medium">
                    <span>Platform fee on {simSales} ฿:</span>
                    <span className="tabular-nums font-bold">
                      {simFee.totalPlatformFee.toFixed(2)} ฿ ({((simFee.totalPlatformFee / simSales) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Channel Modal */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">
              Configure {editingChannel.name}
            </h3>
            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 mb-1">Commission % (GP)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editingChannel.commissionPercent}
                  onChange={(e) =>
                    setEditingChannel({
                      ...editingChannel,
                      commissionPercent: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-medium outline-hidden"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Payment Gateway Fee %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editingChannel.paymentFeePercent}
                  onChange={(e) =>
                    setEditingChannel({
                      ...editingChannel,
                      paymentFeePercent: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-medium outline-hidden"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">VAT on Commission % (e.g. 7%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editingChannel.vatOnCommissionPercent}
                  onChange={(e) =>
                    setEditingChannel({
                      ...editingChannel,
                      vatOnCommissionPercent: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-medium outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pkgCharge"
                  checked={editingChannel.packagingChargedToCustomer}
                  onChange={(e) =>
                    setEditingChannel({
                      ...editingChannel,
                      packagingChargedToCustomer: e.target.checked,
                    })
                  }
                  className="rounded text-amber-600"
                />
                <label htmlFor="pkgCharge" className="text-neutral-700">
                  Charge packaging container to customer
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
