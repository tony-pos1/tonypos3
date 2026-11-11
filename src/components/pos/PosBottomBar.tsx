/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD POS Bottom Bar Contract
 * Always-visible bottom bar:
 * - 1st: Permanent "Bill" card (linked to the floor plan with item count & total).
 * - Next: Food category cards (with add/delete category options).
 * - Selecting a category hides the zone bar and shows that category's menu full screen;
 *   tapping the Bill card brings the zone bar back.
 */

import React, { useState } from 'react';
import { Receipt, Plus, Trash2, Utensils, Check, X, Layers } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Category } from '../../types/models';

interface PosBottomBarProps {
  activeCategory: string | null; // null = floor plan / bill view, string = active categoryId
  onSelectCategory: (categoryId: string) => void;
  onSelectBill: () => void;
  onOpenOrderSheet?: () => void;
}

export const PosBottomBar: React.FC<PosBottomBarProps> = ({
  activeCategory,
  onSelectCategory,
  onSelectBill,
  onOpenOrderSheet,
}) => {
  const { store, cartItems, activeTableId, saveCategory, deleteCategory, lang, t } = useStore();

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatNameTh, setNewCatNameTh] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');

  // Calculate current cart totals
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const activeTable = activeTableId
    ? store.tables.find((t) => t.id === activeTableId)
    : null;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameTh.trim()) return;

    const newCat: Category = {
      id: `cat_${Date.now()}`,
      nameTh: newCatNameTh.trim(),
      nameEn: newCatNameEn.trim(),
      order: store.categories.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    await saveCategory(newCat);
    setNewCatNameTh('');
    setNewCatNameEn('');
    setShowAddCategoryModal(false);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-3 py-2.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {/* 1. PERMANENT "BILL" CARD (Linked to floor plan) */}
          <button
            type="button"
            onClick={() => {
              onSelectBill();
              if (onOpenOrderSheet) onOpenOrderSheet();
            }}
            className={`flex items-center gap-3 shrink-0 px-4 py-2 rounded-xl transition-all border ${
              activeCategory === null
                ? 'bg-neutral-900 border-neutral-900 text-white shadow-md ring-2 ring-neutral-900/20'
                : 'bg-neutral-100 hover:bg-neutral-200/80 border-neutral-300 text-neutral-800'
            }`}
            title="Return to floor plan and inspect active bill"
          >
            <div
              className={`p-1.5 rounded-lg ${
                activeCategory === null
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-neutral-800 border border-neutral-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
            </div>

            <div className="text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs uppercase tracking-wider">
                  {t('billCard')}
                </span>
                {activeTable && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      activeCategory === null
                        ? 'bg-amber-400 text-neutral-900'
                        : 'bg-neutral-900 text-white'
                    }`}
                  >
                    {activeTable.number}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] mt-0.5">
                <span
                  className={`font-semibold ${
                    activeCategory === null ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  {totalItemCount} {t('items')}
                </span>
                <span className="font-bold tabular-nums">
                  {totalCartAmount.toFixed(2)} ฿
                </span>
              </div>
            </div>
          </button>

          <div className="h-8 w-px bg-neutral-200 shrink-0 mx-1" />

          {/* 2. FOOD CATEGORY CARDS */}
          {store.categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            const dishCount = store.dishes.filter((d) => d.categoryId === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 shrink-0 px-3.5 py-2 rounded-xl transition-all border whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500 border-amber-600 text-neutral-950 font-bold shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Utensils className={`w-3.5 h-3.5 ${isSelected ? 'text-neutral-950' : 'text-neutral-400'}`} />
                <div className="text-left">
                  <span className="text-xs font-semibold block leading-tight">
                    {lang === 'th' ? cat.nameTh : cat.nameEn || cat.nameTh}
                  </span>
                  <span
                    className={`text-[10px] block leading-none mt-0.5 ${
                      isSelected ? 'text-neutral-900 font-medium' : 'text-neutral-400'
                    }`}
                  >
                    {dishCount} {t('items')}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Add Category Button */}
          <button
            type="button"
            onClick={() => setShowAddCategoryModal(true)}
            className="flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl border border-dashed border-neutral-300 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 text-xs font-semibold hover:bg-neutral-50 transition-colors"
            title={t('addCategory')}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('addCategory')}</span>
          </button>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-neutral-200 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="font-bold text-sm text-neutral-900">{t('addCategory')}</h3>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 pt-3">
              <div>
                <label className="block text-neutral-600 font-medium mb-1">
                  {t('categoryNameTh')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น กับข้าว, ของทานเล่น, เครื่องดื่ม"
                  value={newCatNameTh}
                  onChange={(e) => setNewCatNameTh(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 font-medium outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1">
                  {t('categoryNameEn')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Appetizers, Mains, Drinks"
                  value={newCatNameEn}
                  onChange={(e) => setNewCatNameEn(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 font-medium outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white font-bold hover:bg-neutral-800"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
