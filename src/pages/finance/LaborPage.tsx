/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Labor & Shifts Management Page
 */

import React, { useState } from 'react';
import { Users, Plus, Trash2, Clock, Banknote } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Employee, Shift } from '../../types/models';

export const LaborPage: React.FC = () => {
  const { store, saveEmployee, deleteEmployee, saveShift } = useStore();
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Head Chef');
  const [wageType, setWageType] = useState<'hourly' | 'monthly'>('monthly');
  const [wageRate, setWageRate] = useState(15000);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      name: name.trim(),
      role,
      wageType,
      wageRate: Number(wageRate) || 0,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    await saveEmployee(newEmp);
    setName('');
    setShowAddModal(false);
  };

  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Staff Labor &amp; Shift Register</h2>
          <p className="text-xs text-neutral-500">
            Track front-of-house and kitchen staff wages, active shifts, and register cash floats.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Employee</span>
        </button>
      </div>

      {store.employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-700">No staff profiles registered</p>
          <p className="text-xs text-neutral-400 mt-1">
            Add team members with hourly or monthly wages to compute restaurant labor overhead.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"
          >
            Add Employee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {store.employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between pb-2 border-b border-neutral-100">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-900">{emp.name}</h3>
                    <span className="text-[11px] text-neutral-500">{emp.role}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteEmployee(emp.id)}
                    className="text-neutral-300 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="py-3">
                  <span className="text-[10px] text-neutral-400 block uppercase">
                    Wage Rate ({emp.wageType})
                  </span>
                  <span className="text-base font-bold text-neutral-900 tabular-nums">
                    {emp.wageRate.toLocaleString()} ฿ {emp.wageType === 'hourly' ? '/ hr' : '/ mo'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-medium">● Active Staff</span>
                <span className="text-neutral-400">v{emp.version}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">Add Employee Profile</h3>
            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. สมชาย ใจดี"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-medium outline-hidden"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Position / Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-medium outline-hidden"
                >
                  <option value="Head Chef">Head Chef (หัวหน้าเชฟ)</option>
                  <option value="Line Cook">Line Cook (ผู้ช่วยกุ๊ก)</option>
                  <option value="Barista">Barista (บาริสต้า)</option>
                  <option value="Service Staff">Service Staff (พนักงานเสิร์ฟ)</option>
                  <option value="Cashier">Cashier (แคชเชียร์)</option>
                  <option value="Dishwasher">Dishwasher (ล้างจาน/ทำความสะอาด)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-600 mb-1">Wage Type</label>
                  <select
                    value={wageType}
                    onChange={(e) => setWageType(e.target.value as 'hourly' | 'monthly')}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-medium outline-hidden"
                  >
                    <option value="monthly">Monthly (รายเดือน)</option>
                    <option value="hourly">Hourly (รายชั่วโมง)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1">Wage Rate (THB)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={wageRate}
                    onChange={(e) => setWageRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-medium outline-hidden"
                  />
                </div>
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
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
