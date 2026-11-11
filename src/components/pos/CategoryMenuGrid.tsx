/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Category Menu Full-Screen Grid
 * Shown when a food category is selected from the bottom bar.
 * Menu cards show ONLY the uploadable food photo and the name below it (no outer price).
 */

import React, { useState } from 'react';
import { ArrowLeft, Search, UtensilsCrossed, Plus, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Dish } from '../../types/models';
import { DishImage } from '../common/DishImage';

interface CategoryMenuGridProps {
  categoryId: string;
  onSelectDish: (dish: Dish) => void;
  onBackToFloorPlan: () => void;
}

export const CategoryMenuGrid: React.FC<CategoryMenuGridProps> = ({
  categoryId,
  onSelectDish,
  onBackToFloorPlan,
}) => {
  const { store, lang, t } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const currentCategory = store.categories.find((c) => c.id === categoryId);
  const categoryTitle = currentCategory
    ? lang === 'th'
      ? currentCategory.nameTh
      : currentCategory.nameEn || currentCategory.nameTh
    : t('menu');

  const dishes = store.dishes.filter((d) => {
    if (d.categoryId !== categoryId) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.nameTh.toLowerCase().includes(q) ||
      (d.nameEn && d.nameEn.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Category Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToFloorPlan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-colors"
            title="Return to floor plan"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('tables')}</span>
          </button>

          <div>
            <h2 className="text-base font-extrabold text-neutral-900 leading-tight">
              {categoryTitle}
            </h2>
            <span className="text-xs text-neutral-400">
              {dishes.length} {t('items')}
            </span>
          </div>
        </div>

        {/* Search filter */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={lang === 'th' ? 'ค้นหาชื่ออาหาร...' : 'Search dishes...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white outline-hidden focus:border-amber-500 font-medium transition-colors"
          />
        </div>
      </div>

      {/* Grid of Dishes: Photo and name ONLY per requirement */}
      {dishes.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <UtensilsCrossed className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-700">No dishes in this category</p>
          <p className="text-xs text-neutral-400 mt-1">
            Add dishes to this category from the Menu section.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {dishes.map((dish) => (
            <button
              key={dish.id}
              type="button"
              onClick={() => onSelectDish(dish)}
              className="group cursor-pointer rounded-2xl bg-white border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              {/* Photo ONLY */}
              <div className="relative aspect-4/3 w-full bg-neutral-100 overflow-hidden">
                <DishImage photo={dish.photo} alt={dish.nameTh} />
              </div>

              {/* Name ONLY below photo */}
              <div className="p-3 text-center flex-1 flex flex-col justify-center">
                <span className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-1 group-hover:text-amber-800 transition-colors">
                  {lang === 'th' ? dish.nameTh : dish.nameEn || dish.nameTh}
                </span>
                {dish.nameEn && lang === 'th' && (
                  <span className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                    {dish.nameEn}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
