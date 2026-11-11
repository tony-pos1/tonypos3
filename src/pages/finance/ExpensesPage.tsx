/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Expenses Management Page
 */

import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, Calendar, Tag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Expense, ExpenseCategory } from '../../types/models';

export const ExpensesPage: React.FC = () => {
  const { store, saveExpense, deleteExpense } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(1500);
  const [category, setCategory] = useState<ExpenseCategory>('rent');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const totalExpenses = store.expenses.reduce((s, e) => s + e.amount, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      category,
      title: title.trim(),
      amount: Number(amount) || 0,
      date,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    await saveExpense(newExpense);
    setTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Operating Expenses &amp; Overheads</h2>
          <p className="text-xs text-neutral-500">
            Rent, utilities, maintenance, and administrative costs used in P&amp;L and break-even calculations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-neutral-400 block uppercase">Total Recorded</span>
            <span className="text-sm font-bold text-neutral-900 tabular-nums">
              {totalExpenses.toFixed(2)} ฿
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {store.expenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <DollarSign className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-700">No expenses logged yet</p>
          <p className="text-xs text-neutral-400 mt-1">
            Log monthly shop overheads (rent, electricity, water, software) for accurate net profit calculation.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"
          >
            Log First Expense
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Expense Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {store.expenses.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-4 py-3 text-neutral-500 font-mono text-[11px] tabular-nums">
                      {item.date}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-900">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700 uppercase">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-neutral-900 tabular-nums">
                      {item.amount.toFixed(2)} ฿
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteExpense(item.id)}
                        className="text-neutral-300 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">Log Expense</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ค่าเช่าร้าน, ค่าไฟฟ้ารอบบิล"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-medium outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-600 mb-1">Amount (THB)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-medium outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-medium outline-hidden"
                  >
                    <option value="rent">Rent (ค่าเช่า)</option>
                    <option value="utilities">Utilities (ค่าน้ำ/ไฟ/เน็ต)</option>
                    <option value="labor">Labor (ค่าแรงพิเศษ)</option>
                    <option value="marketing">Marketing (การตลาด)</option>
                    <option value="maintenance">Maintenance (ซ่อมบำรุง)</option>
                    <option value="other">Other (อื่นๆ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-medium outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
