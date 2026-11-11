/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Ingredients Page
 * Manage raw materials, purchasing units, yield %, base units, and price histories.
 * When ingredient prices are updated, every linked recipe, sub-recipe, and dish recalculates live.
 */

import React, { useState } from 'react';
import {
  Wheat,
  Plus,
  Search,
  Trash2,
  Edit2,
  TrendingUp,
  History,
  Info,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Ingredient, BaseUnit, PurchaseUnit, PriceHistoryEntry } from '../../types/models';
import { calculateIngredientCostPerBaseUnit } from '../../engine/calculations';

export const IngredientsPage: React.FC = () => {
  const { store, saveIngredient, deleteIngredient } = useStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<Ingredient | null>(null);

  // Form Fields
  const [nameTh, setNameTh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('Meat');
  const [purchasePrice, setPurchasePrice] = useState(180);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseUnit, setPurchaseUnit] = useState<PurchaseUnit>('kg');
  const [yieldPercent, setYieldPercent] = useState(90);
  const [baseUnit, setBaseUnit] = useState<BaseUnit>('g');
  const [priceChangeNote, setPriceChangeNote] = useState('');

  // Live calculation preview in form
  const previewCostPerBase = calculateIngredientCostPerBaseUnit(
    Number(purchasePrice) || 0,
    Number(purchaseQuantity) || 1,
    purchaseUnit,
    Number(yieldPercent) || 100,
    baseUnit
  );

  const openAddModal = () => {
    setEditingIngredient(null);
    setNameTh('');
    setNameEn('');
    setCategory('Meat');
    setPurchasePrice(180);
    setPurchaseQuantity(1);
    setPurchaseUnit('kg');
    setYieldPercent(90);
    setBaseUnit('g');
    setPriceChangeNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: Ingredient) => {
    setEditingIngredient(item);
    setNameTh(item.nameTh);
    setNameEn(item.nameEn);
    setCategory(item.category);
    setPurchasePrice(item.purchasePrice);
    setPurchaseQuantity(item.purchaseQuantity);
    setPurchaseUnit((item.purchaseUnit as PurchaseUnit) || 'kg');
    setYieldPercent(item.yieldPercent);
    setBaseUnit(item.baseUnit);
    setPriceChangeNote('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameTh.trim()) return;

    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];

    const newCostPerBase = calculateIngredientCostPerBaseUnit(
      Number(purchasePrice),
      Number(purchaseQuantity),
      purchaseUnit,
      Number(yieldPercent),
      baseUnit
    );

    let updatedHistory: PriceHistoryEntry[] = editingIngredient?.priceHistory
      ? [...editingIngredient.priceHistory]
      : [];

    if (editingIngredient) {
      // Check if price changed
      if (editingIngredient.purchasePrice !== Number(purchasePrice)) {
        updatedHistory.unshift({
          date: todayStr,
          price: Number(purchasePrice),
          quantity: Number(purchaseQuantity),
          unit: purchaseUnit,
          note: priceChangeNote.trim() || `Price updated: ${editingIngredient.purchasePrice} ฿ ➔ ${purchasePrice} ฿`,
        });
      }

      const updatedIng: Ingredient = {
        ...editingIngredient,
        nameTh: nameTh.trim(),
        nameEn: nameEn.trim(),
        category,
        purchasePrice: Number(purchasePrice),
        purchaseQuantity: Number(purchaseQuantity),
        purchaseUnit,
        yieldPercent: Number(yieldPercent),
        baseUnit,
        costPerBaseUnit: newCostPerBase,
        priceHistory: updatedHistory,
        updatedAt: now,
      };

      await saveIngredient(updatedIng);
    } else {
      // Create new
      const newIng: Ingredient = {
        id: `ing_${Date.now()}`,
        nameTh: nameTh.trim(),
        nameEn: nameEn.trim(),
        category,
        purchasePrice: Number(purchasePrice),
        purchaseQuantity: Number(purchaseQuantity),
        purchaseUnit,
        yieldPercent: Number(yieldPercent),
        baseUnit,
        costPerBaseUnit: newCostPerBase,
        priceHistory: [
          {
            date: todayStr,
            price: Number(purchasePrice),
            quantity: Number(purchaseQuantity),
            unit: purchaseUnit,
            note: 'Initial purchase price',
          },
        ],
        createdAt: now,
        updatedAt: now,
        version: 1,
      };

      await saveIngredient(newIng);
    }

    setIsModalOpen(false);
  };

  const categoriesList = Array.from(new Set(store.ingredients.map((i) => i.category)));

  const filtered = store.ingredients.filter((item) => {
    const matchSearch =
      item.nameTh.toLowerCase().includes(search.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {/* Top action ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by ingredient name (Thai / English)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-300 font-medium outline-hidden"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium outline-hidden shrink-0"
          >
            <option value="all">All Categories ({store.ingredients.length})</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Ingredient</span>
        </button>
      </div>

      {/* Live sync assurance notification */}
      <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Automatic Dynamic Recalculation:</span> When you edit an ingredient's purchase price or yield %, every sub-recipe, dish variant, and recipe breakdown that references it recalculates instantly without manual re-saving.
        </div>
      </div>

      {/* Ingredients Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Wheat className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-700">No ingredients match your filter</p>
          <p className="text-xs text-neutral-400 mt-1">
            Add raw meats, vegetables, dry goods, or condiments with their yield percentage.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"
          >
            Create New Ingredient
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Purchase Packaging</th>
                  <th className="px-4 py-3 text-right">Yield %</th>
                  <th className="px-4 py-3 text-right">Cost Per Base Unit</th>
                  <th className="px-4 py-3 text-center">Price History</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-neutral-900">{item.nameTh}</div>
                      <div className="text-[11px] text-neutral-400">{item.nameEn || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-800 font-medium">
                      {item.purchasePrice.toFixed(2)} ฿ / {item.purchaseQuantity} {item.purchaseUnit}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={`font-semibold inline-flex items-center gap-1 ${
                          item.yieldPercent < 100
                            ? 'text-amber-700'
                            : item.yieldPercent > 100
                            ? 'text-blue-700'
                            : 'text-neutral-700'
                        }`}
                        title={
                          item.yieldPercent < 100
                            ? `${100 - item.yieldPercent}% trimming/prep loss`
                            : item.yieldPercent > 100
                            ? `${item.yieldPercent - 100}% cooked absorption gain`
                            : '100% edible yield'
                        }
                      >
                        {item.yieldPercent}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-1 rounded">
                        {item.costPerBaseUnit.toFixed(4)} ฿ / {item.baseUnit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setHistoryModalItem(item)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>{item.priceHistory?.length || 1} logs</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Edit Ingredient"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete ingredient "${item.nameTh}"?`)) {
                              deleteIngredient(item.id);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Ingredient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Ingredient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-neutral-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingIngredient ? `Edit: ${editingIngredient.nameTh}` : 'Add New Ingredient'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Name (Thai) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. สันคอหมูสไลซ์"
                    value={nameTh}
                    onChange={(e) => setNameTh(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-medium outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Name (English)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sliced Pork Collar"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-medium outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Meat', 'Seafood', 'Vegetables', 'Dry Goods', 'Sauces & Seasoning', 'Dairy & Eggs'].map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                          category === cat
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Purchase Package & Cost Inputs */}
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Purchasing Package Details
                </span>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-neutral-600 mb-1">Purchase Price</label>
                    <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(Number(e.target.value))}
                        className="w-full text-xs font-bold tabular-nums outline-hidden"
                      />
                      <span className="text-[10px] text-neutral-400 ml-1">฿</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      required
                      min="0.001"
                      step="0.001"
                      value={purchaseQuantity}
                      onChange={(e) => setPurchaseQuantity(Number(e.target.value))}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold tabular-nums outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1">Unit</label>
                    <select
                      value={purchaseUnit}
                      onChange={(e) => setPurchaseUnit(e.target.value as PurchaseUnit)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs font-semibold outline-hidden"
                    >
                      <option value="kg">kg (กิโลกรัม)</option>
                      <option value="g">g (กรัม)</option>
                      <option value="l">L (ลิตร)</option>
                      <option value="ml">ml (มิลลิลิตร)</option>
                      <option value="piece">piece (ชิ้น/ฟอง)</option>
                      <option value="can">can (กระป๋อง)</option>
                      <option value="bottle">bottle (ขวด)</option>
                      <option value="pack">pack (แพ็ค)</option>
                    </select>
                  </div>
                </div>

                {editingIngredient && (
                  <div>
                    <label className="block text-neutral-500 text-[11px] mb-1">
                      Reason for Price Update (Logged to Price History)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Supplier price increase for Q4"
                      value={priceChangeNote}
                      onChange={(e) => setPriceChangeNote(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1 text-xs outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Yield & Recipe Base Unit */}
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Yield % &amp; Culinary Base Unit
                  </span>
                  <span className="text-[10px] text-neutral-400">Trimming or absorption</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 mb-1">Yield % (Edible Portion)</label>
                    <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5">
                      <input
                        type="number"
                        required
                        min="1"
                        max="500"
                        value={yieldPercent}
                        onChange={(e) => setYieldPercent(Number(e.target.value))}
                        className="w-full text-xs font-bold tabular-nums outline-hidden"
                      />
                      <span className="text-[10px] text-neutral-400 ml-1">%</span>
                    </div>

                    {/* Quick preset chips */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <button
                        type="button"
                        onClick={() => setYieldPercent(90)}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                      >
                        Pork/Beef 90%
                      </button>
                      <button
                        type="button"
                        onClick={() => setYieldPercent(85)}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                      >
                        Veg 85%
                      </button>
                      <button
                        type="button"
                        onClick={() => setYieldPercent(240)}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                      >
                        Cooked Rice 240%
                      </button>
                      <button
                        type="button"
                        onClick={() => setYieldPercent(100)}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                      >
                        100%
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1">Base Unit for Recipes</label>
                    <select
                      value={baseUnit}
                      onChange={(e) => setBaseUnit(e.target.value as BaseUnit)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold outline-hidden"
                    >
                      <option value="g">grams (g) - For solid weights</option>
                      <option value="ml">milliliters (ml) - For liquids</option>
                      <option value="piece">piece (ชิ้น/ฟอง) - For counts</option>
                    </select>
                  </div>
                </div>

                {/* Live calculated cost preview card */}
                <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-800 uppercase block">
                      Calculated Real-Time Cost
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Formula: {purchasePrice} ฿ / ({purchaseQuantity} {purchaseUnit} in {baseUnit} * {yieldPercent}%)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-950 tabular-nums">
                      {previewCostPerBase.toFixed(4)} ฿ / {baseUnit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  {editingIngredient ? 'Update & Sync All Recipes' : 'Save Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price History Inspection Modal */}
      {historyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  {historyModalItem.nameTh} ({historyModalItem.nameEn || 'Price Log'})
                </h3>
                <span className="text-[11px] text-neutral-400">Historical Purchasing Ledger</span>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalItem(null)}
                className="text-xs px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              >
                Close
              </button>
            </div>

            <div className="py-4 space-y-2 max-h-80 overflow-y-auto">
              {historyModalItem.priceHistory && historyModalItem.priceHistory.length > 0 ? (
                historyModalItem.priceHistory.map((hist, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100 text-xs"
                  >
                    <div>
                      <span className="font-bold text-neutral-900 tabular-nums">
                        {hist.price.toFixed(2)} ฿ / {hist.quantity} {hist.unit}
                      </span>
                      {hist.note && (
                        <span className="text-[11px] text-neutral-500 block mt-0.5">{hist.note}</span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400 tabular-nums">{hist.date}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-400 text-center py-6">No historical records logged yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
