/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Recipes Costing Page
 * Deep dive into dish variant recipe lines, packaging lines, calculated food cost, and profit margins.
 * Includes interactive recipe editor, warning colors for > target food cost %, and suggested price calculations.
 */

import React, { useState } from 'react';
import {
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Package,
  Wheat,
  CookingPot,
  Plus,
  Trash2,
  Edit2,
  Search,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Dish, DishVariant, RecipeLine, PackagingLine } from '../../types/models';
import {
  calculateVariantCost,
  convertRecipeLineToBaseUnit,
  calculateSuggestedPrice,
} from '../../engine/calculations';

export const RecipesPage: React.FC = () => {
  const { store, saveDish, ingredientsMap, subRecipesMap, packagingMap } = useStore();
  const [selectedDishId, setSelectedDishId] = useState<string>(store.dishes[0]?.id || '');
  const [search, setSearch] = useState('');

  // Quick Recipe Line Editing Modal
  const [editingVariant, setEditingVariant] = useState<{
    dish: Dish;
    variantIndex: number;
  } | null>(null);

  const selectedDish =
    store.dishes.find((d) => d.id === selectedDishId) || store.dishes[0];

  const handleUpdateVariantLines = async (
    dish: Dish,
    variantIndex: number,
    recipeLines: RecipeLine[],
    packagingLines: PackagingLine[]
  ) => {
    const updatedVariants = [...dish.variants];
    updatedVariants[variantIndex] = {
      ...updatedVariants[variantIndex],
      recipeLines,
      packagingLines,
    };

    const updatedDish: Dish = {
      ...dish,
      variants: updatedVariants,
      updatedAt: new Date().toISOString(),
      version: dish.version + 1,
    };

    await saveDish(updatedDish);
  };

  const filteredDishes = store.dishes.filter(
    (d) =>
      d.nameTh.toLowerCase().includes(search.toLowerCase()) ||
      d.nameEn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {/* Top selector ribbon */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Recipes Costing &amp; Margin Breakdown</h2>
          <p className="text-xs text-neutral-500">
            For each dish and variant, inspect recipe lines, packaging lines, real-time food cost %, and suggested prices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-neutral-400" />
            <input
              type="text"
              placeholder="Filter dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-neutral-300 font-medium outline-hidden w-40"
            />
          </div>

          <select
            value={selectedDish?.id || ''}
            onChange={(e) => setSelectedDishId(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold outline-hidden max-w-xs truncate"
          >
            {filteredDishes.map((dish) => (
              <option key={dish.id} value={dish.id}>
                {dish.nameTh} {dish.nameEn ? `(${dish.nameEn})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedDish ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <BookOpen className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-700">No dishes available</p>
          <p className="text-xs text-neutral-400 mt-1">
            Create a menu dish in Menu &amp; Library to start costing its recipe.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dish Header Card */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedDish.photo ? (
                <img
                  src={selectedDish.photo}
                  alt={selectedDish.nameTh}
                  className="w-12 h-12 rounded-xl object-cover border border-neutral-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-neutral-900">{selectedDish.nameTh}</h3>
                <p className="text-xs text-neutral-400">{selectedDish.nameEn || 'Recipe Specs'}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                Target Food Cost
              </span>
              <span className="text-sm font-bold text-amber-800">
                {store.settings.targetFoodCostPercent}%
              </span>
            </div>
          </div>

          {/* Variants Breakdown */}
          {selectedDish.variants.map((variant, vIdx) => {
            const costResult = calculateVariantCost(
              variant,
              ingredientsMap,
              subRecipesMap,
              packagingMap,
              store.settings.targetFoodCostPercent
            );

            const isOverTarget =
              costResult.hasRecipe &&
              costResult.foodCostPercent > store.settings.targetFoodCostPercent;

            return (
              <div
                key={variant.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-4"
              >
                {/* Variant Header & KPIs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Variant #{vIdx + 1}
                    </span>
                    <h4 className="text-base font-bold text-neutral-900">
                      {variant.nameTh} {variant.nameEn ? `(${variant.nameEn})` : ''}
                    </h4>
                  </div>

                  {costResult.hasRecipe ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                        <span className="text-[10px] text-neutral-500 block">Selling Price</span>
                        <span className="text-sm font-bold text-neutral-900 tabular-nums">
                          {variant.price.toFixed(2)} ฿
                        </span>
                      </div>

                      <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                        <span className="text-[10px] text-neutral-500 block">Food Cost</span>
                        <span className="text-sm font-bold text-neutral-900 tabular-nums">
                          {costResult.foodCost.toFixed(2)} ฿
                        </span>
                      </div>

                      <div
                        className={`p-2.5 rounded-lg border ${
                          isOverTarget
                            ? 'bg-amber-100/70 border-amber-300 text-amber-900 font-bold'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] block opacity-80">Food Cost %</span>
                          {isOverTarget && <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />}
                        </div>
                        <span className="text-sm font-bold tabular-nums">
                          {costResult.foodCostPercent.toFixed(1)}%
                        </span>
                        <span className="text-[9px] block opacity-70 mt-0.5">
                          {isOverTarget ? 'Exceeds target' : 'Within budget'}
                        </span>
                      </div>

                      <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-200 text-blue-900">
                        <span className="text-[10px] block opacity-80">Suggested Price</span>
                        <span className="text-sm font-bold tabular-nums">
                          {costResult.suggestedPrice.toFixed(2)} ฿
                        </span>
                        <span className="text-[9px] block opacity-70 mt-0.5">
                          For {store.settings.targetFoodCostPercent}% target
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 text-neutral-600 font-medium text-xs">
                      <AlertTriangle className="w-4 h-4 text-neutral-400" />
                      <span>No recipe linked</span>
                    </div>
                  )}
                </div>

                {/* Recipe Lines & Packaging Lines Grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recipe Lines */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                      <div className="flex items-center gap-1.5">
                        <Wheat className="w-4 h-4 text-amber-600" />
                        <span>Recipe Ingredients ({variant.recipeLines.length})</span>
                      </div>
                      <span className="text-neutral-400 text-[10px] font-normal">
                        Subtotal: {costResult.recipeCost.toFixed(2)} ฿
                      </span>
                    </div>

                    {variant.recipeLines.length === 0 ? (
                      <p className="text-xs text-neutral-400 p-3 bg-neutral-50 rounded-lg text-center">
                        No recipe linked
                      </p>
                    ) : (
                      <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden text-xs">
                        {variant.recipeLines.map((line, idx) => {
                          const ing =
                            line.type === 'ingredient'
                              ? ingredientsMap.get(line.itemId)
                              : subRecipesMap.get(line.itemId);

                          const lineCost =
                            line.type === 'ingredient' && ing
                              ? convertRecipeLineToBaseUnit(
                                  line.quantity,
                                  line.unit,
                                  (ing as any).baseUnit
                                ) * (ing as any).costPerBaseUnit
                              : 0;

                          return (
                            <div key={idx} className="flex justify-between items-center p-2.5 bg-white">
                              <div>
                                <span className="font-semibold text-neutral-900 block">
                                  {ing?.nameTh || 'Item'}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  {line.quantity} {line.unit}{' '}
                                  {ing && (ing as any).costPerBaseUnit ? (
                                    <>· @ {(ing as any).costPerBaseUnit.toFixed(4)} ฿/{(ing as any).baseUnit}</>
                                  ) : null}
                                </span>
                              </div>
                              <span className="font-bold text-neutral-800 tabular-nums">
                                {lineCost.toFixed(2)} ฿
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Packaging Lines */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span>Takeaway Packaging ({variant.packagingLines.length})</span>
                      </div>
                      <span className="text-neutral-400 text-[10px] font-normal">
                        Subtotal: {costResult.packagingCost.toFixed(2)} ฿
                      </span>
                    </div>

                    {variant.packagingLines.length === 0 ? (
                      <p className="text-xs text-neutral-400 p-3 bg-neutral-50 rounded-lg text-center">
                        No packaging items attached.
                      </p>
                    ) : (
                      <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden text-xs">
                        {variant.packagingLines.map((pkgLine, idx) => {
                          const pkg = packagingMap.get(pkgLine.packagingId);
                          const lineCost = pkg ? pkg.unitCost * pkgLine.quantity : 0;

                          return (
                            <div key={idx} className="flex justify-between items-center p-2.5 bg-white">
                              <div>
                                <span className="font-semibold text-neutral-900 block">
                                  {pkg?.name || 'Box'}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  x{pkgLine.quantity} @ {pkg?.unitCost.toFixed(2)} ฿/pc
                                </span>
                              </div>
                              <span className="font-bold text-neutral-800 tabular-nums">
                                {lineCost.toFixed(2)} ฿
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
