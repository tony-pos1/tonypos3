/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Bills & History Page
 * View past orders with immutable cost snapshots, payment status, and food cost margins.
 */

import React, { useState } from 'react';
import {
  Receipt,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Eye,
  CreditCard,
  QrCode,
  Banknote,
  Percent,
  Printer,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Bill, BillStatus } from '../types/models';
import { createBillItemSnapshot, calculateBillTotals } from '../engine/calculations';
import { ReceiptModal } from '../components/pos/ReceiptModal';

export const BillsHistoryPage: React.FC = () => {
  const { store, commitBill, getNextBillNumber, ingredientsMap, subRecipesMap, packagingMap } =
    useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BillStatus>('all');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [billForReceipt, setBillForReceipt] = useState<Bill | null>(null);

  // Quick order generation for testing the snapshot flow
  const handleCreateTestOrder = async () => {
    if (store.dishes.length === 0) {
      alert('Please add at least one dish in Menu before placing a test bill.');
      return;
    }

    const dish = store.dishes[0];
    const variant = dish.variants[0];
    const billNumber = await getNextBillNumber();
    const now = new Date().toISOString();

    const snapshotItem = createBillItemSnapshot(
      dish,
      variant,
      2,
      [],
      ingredientsMap,
      subRecipesMap,
      packagingMap
    );

    const totals = calculateBillTotals(
      [snapshotItem],
      0,
      store.settings.serviceChargePercent,
      store.settings.vatPercent
    );

    const newBill: Bill = {
      id: `bill_${Date.now()}`,
      billNumber,
      channelId: store.channels[0]?.id || 'ch_dine_in',
      tableName: store.tables[0]?.number || 'Takeaway',
      items: [snapshotItem],
      subtotal: totals.subtotal,
      discount: 0,
      serviceChargePercent: store.settings.serviceChargePercent,
      serviceChargeAmount: totals.serviceChargeAmount,
      vatPercent: store.settings.vatPercent,
      vatAmount: totals.vatAmount,
      total: totals.total,
      totalFoodCost: totals.totalFoodCost,
      payments: [
        {
          id: `pay_${Date.now()}`,
          method: 'cash',
          amount: totals.total,
          timestamp: now,
        },
      ],
      status: 'paid',
      createdAt: now,
      updatedAt: now,
      paidAt: now,
      version: 1,
    };

    await commitBill(newBill);
    setSelectedBill(newBill);
  };

  const filteredBills = store.bills.filter((b) => {
    const matchSearch =
      b.billNumber.toLowerCase().includes(search.toLowerCase()) ||
      (b.tableName && b.tableName.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {/* Controls ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by Bill # or Table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-300 font-medium outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | BillStatus)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium outline-hidden"
          >
            <option value="all">All Statuses ({store.bills.length})</option>
            <option value="paid">Paid</option>
            <option value="open">Open</option>
            <option value="voided">Voided</option>
          </select>

          <button
            type="button"
            onClick={handleCreateTestOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Test Bill</span>
          </button>
        </div>
      </div>

      {/* Bills Table */}
      {filteredBills.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Receipt className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-700">No bills recorded yet</p>
          <p className="text-xs text-neutral-400 mt-1">
            Bills with immutable sale-time cost snapshots will appear here as orders are placed.
          </p>
          <button
            type="button"
            onClick={handleCreateTestOrder}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"
          >
            Simulate First POS Bill
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Bill Number</th>
                  <th className="px-4 py-3">Date &amp; Time</th>
                  <th className="px-4 py-3">Channel / Table</th>
                  <th className="px-4 py-3 text-right">Items</th>
                  <th className="px-4 py-3 text-right">Total Food Cost</th>
                  <th className="px-4 py-3 text-right">Selling Total</th>
                  <th className="px-4 py-3 text-right">Cost %</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredBills.map((bill) => {
                  const costPct =
                    bill.total > 0
                      ? Math.round((bill.totalFoodCost / (bill.total - bill.vatAmount - bill.serviceChargeAmount)) * 10000) / 100
                      : 0;
                  const channel = store.channels.find((c) => c.id === bill.channelId);

                  return (
                    <tr key={bill.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-neutral-900">
                        {bill.billNumber}
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-[11px] tabular-nums">
                        {new Date(bill.createdAt).toLocaleString('th-TH', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-neutral-800 block">
                          {bill.tableName || 'Dine-In'}
                        </span>
                        <span className="text-[10px] text-neutral-400 block">
                          {channel?.name || 'Standard POS'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                        {bill.items.reduce((s, i) => s + i.quantity, 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-800 tabular-nums">
                        {bill.totalFoodCost.toFixed(2)} ฿
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-neutral-900 tabular-nums">
                        {bill.total.toFixed(2)} ฿
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-amber-700">
                        {costPct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            bill.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : bill.status === 'voided'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {bill.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setBillForReceipt(bill)}
                            className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                            title="Print thermal receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedBill(bill)}
                            className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition-colors"
                          >
                            Snapshot
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bill Snapshot Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <span className="text-[10px] text-neutral-400 font-mono block">SALE-TIME SNAPSHOT</span>
                <h3 className="text-sm font-bold text-neutral-900 font-mono">
                  {selectedBill.billNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="text-xs font-semibold px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              >
                Close
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/60 text-[11px] text-amber-900">
                Rule verified: Bill items store their food cost at the exact moment of sale. If ingredient purchase prices change tomorrow, this bill's food cost remains mathematically preserved.
              </div>

              {/* Items Snapshot Table */}
              <div className="space-y-2">
                <span className="font-semibold text-neutral-700 block">Ordered Items &amp; Snapshots</span>
                <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
                  {selectedBill.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white space-y-1">
                      <div className="flex justify-between items-start font-medium text-neutral-900">
                        <div>
                          <span>{item.dishNameTh}</span>
                          <span className="text-neutral-500 ml-1">({item.variantNameTh})</span>
                          <span className="text-neutral-400 font-mono text-[10px] ml-1.5">
                            x{item.quantity}
                          </span>
                        </div>
                        <span className="font-bold tabular-nums">{item.totalPrice.toFixed(2)} ฿</span>
                      </div>

                      <div className="flex justify-between text-[11px] text-neutral-500 pt-1">
                        <span>Unit Sale Price: {item.unitPrice.toFixed(2)} ฿</span>
                        <span className="text-amber-800 font-medium">
                          Unit Cost Snapshot: {item.unitFoodCost.toFixed(2)} ฿
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-1.5 text-neutral-600 text-xs font-medium">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-semibold text-neutral-900">
                    {selectedBill.subtotal.toFixed(2)} ฿
                  </span>
                </div>
                {selectedBill.serviceChargeAmount > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span>Service Charge ({selectedBill.serviceChargePercent}%):</span>
                    <span className="tabular-nums font-semibold text-neutral-900">
                      +{selectedBill.serviceChargeAmount.toFixed(2)} ฿
                    </span>
                  </div>
                )}
                {selectedBill.vatAmount > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span>VAT ({selectedBill.vatPercent}%):</span>
                    <span className="tabular-nums font-semibold text-neutral-900">
                      +{selectedBill.vatAmount.toFixed(2)} ฿
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-neutral-200 font-bold text-neutral-900 text-sm">
                  <span>Total Amount:</span>
                  <span className="tabular-nums text-emerald-700">
                    {selectedBill.total.toFixed(2)} ฿
                  </span>
                </div>
                <div className="flex justify-between pt-1 text-[11px] text-amber-800">
                  <span>Recorded Food Cost:</span>
                  <span className="tabular-nums font-semibold">
                    {selectedBill.totalFoodCost.toFixed(2)} ฿
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {billForReceipt && (
        <ReceiptModal
          bill={billForReceipt}
          isOpen={Boolean(billForReceipt)}
          onClose={() => setBillForReceipt(null)}
          isPreCheck={billForReceipt.status === 'open'}
        />
      )}
    </div>
  );
};
