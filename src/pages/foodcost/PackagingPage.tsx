/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Packaging Items Page
 * Takeaway containers, bowls, cups, cutlery, and bags with unit cost for delivery and takeaway recipes.
 */

import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit2, Search, Info } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PackagingItem } from '../../types/models';

export const PackagingPage: React.FC = () => {
  const { store, savePackaging, deletePackaging } = useStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PackagingItem | null>(null);

  const [name, setName] = useState('');
  const [unitCost, setUnitCost] = useState(3.5);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setUnitCost(3.5);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PackagingItem) => {
    setEditingItem(item);
    setName(item.name);
    setUnitCost(item.unitCost);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = new Date().toISOString();

    const packagingData: PackagingItem = {
      id: editingItem ? editingItem.id : `pkg_${Date.now()}`,
      name: name.trim(),
      unitCost: Number(unitCost) || 0,
      createdAt: editingItem ? editingItem.createdAt : now,
      updatedAt: now,
      version: editingItem ? editingItem.version + 1 : 1,
    };

    await savePackaging(packagingData);
    setIsModalOpen(false);
  };

  const filtered = store.packaging.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search packaging items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-300 font-medium outline-hidden"
          />
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Packaging Item</span>
        </button>
      </div>

      <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span>Packaging Cost Policy: </span>
          <span>
            Packaging costs are attached to dish variants or sales channels (e.g. Kraft Box 800ml, Soup Bowl, Chopsticks pack, Sauce Cups). When a packaging item unit cost is modified, all dish variants using it update automatically.
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-700">No packaging items found</p>
          <p className="text-xs text-neutral-400 mt-1">
            Register takeaway boxes, bags, and cutlery to calculate true packaging costs for delivery.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"
          >
            Create First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-neutral-700">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-900">{item.name}</h3>
                  <span className="text-sm font-bold text-neutral-800 tabular-nums">
                    {item.unitCost.toFixed(2)} ฿ / piece
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Edit item"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete packaging "${item.name}"?`)) {
                      deletePackaging(item.id);
                    }
                  }}
                  className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">
              {editingItem ? `Edit Packaging: ${editingItem.name}` : 'Add Packaging Item'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. กล่องกระดาษคราฟท์ 800ml"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-medium outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Unit Cost (THB / piece) *</label>
                <div className="flex items-center rounded-lg border border-neutral-300 px-3 py-1.5 bg-white">
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.05"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full font-bold tabular-nums outline-hidden"
                  />
                  <span className="text-[11px] text-neutral-400 ml-1">฿</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
