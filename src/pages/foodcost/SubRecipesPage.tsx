/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Sub-Recipes Page
 * Prepared sauces, marinades, curry pastes, and batch items with yield & cost per output unit.
 * Automatically recalculates when component ingredients change.
 */

import React, { useState } from 'react';
import {
  CookingPot,
  Plus,
  Search,
  Trash2,
  Edit2,
  Info,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SubRecipe, SubRecipeLine } from '../../types/models';
import { calculateSubRecipeCost, convertRecipeLineToBaseUnit } from '../../engine/calculations';

export const SubRecipesPage: React.FC = () => {
  const { store, saveSubRecipe, deleteSubRecipe, ingredientsMap, subRecipesMap } = useStore();
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubRecipe, setEditingSubRecipe] = useState<SubRecipe | null>(null);

  // Form Fields
  const [nameTh, setNameTh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [batchQuantity, setBatchQuantity] = useState(1000);
  const [outputUnit, setOutputUnit] = useState('ml');
  const [yieldPercent, setYieldPercent] = useState(90);
  const [recipeLines, setRecipeLines] = useState<SubRecipeLine[]>([]);

  const openAddModal = () => {
    setEditingSubRecipe(null);
    setNameTh('');
    setNameEn('');
    setBatchQuantity(1000);
    setOutputUnit('ml');
    setYieldPercent(90);

    // Initial line if ingredients exist
    if (store.ingredients.length > 0) {
      setRecipeLines([
        {
          type: 'ingredient',
          itemId: store.ingredients[0].id,
          quantity: 100,
          unit: store.ingredients[0].baseUnit,
        },
      ]);
    } else {
      setRecipeLines([]);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (sub: SubRecipe) => {
    setEditingSubRecipe(sub);
    setNameTh(sub.nameTh);
    setNameEn(sub.nameEn);
    setBatchQuantity(sub.batchQuantity);
    setOutputUnit(sub.outputUnit);
    setYieldPercent(sub.yieldPercent);
    setRecipeLines(sub.recipeLines ? [...sub.recipeLines] : []);
    setIsModalOpen(true);
  };

  // Recipe Lines Handlers
  const addLine = () => {
    if (store.ingredients.length === 0) return;
    setRecipeLines([
      ...recipeLines,
      {
        type: 'ingredient',
        itemId: store.ingredients[0].id,
        quantity: 50,
        unit: store.ingredients[0].baseUnit,
      },
    ]);
  };

  const removeLine = (index: number) => {
    setRecipeLines(recipeLines.filter((_, idx) => idx !== index));
  };

  const updateLine = (index: number, updates: Partial<SubRecipeLine>) => {
    const updated = [...recipeLines];
    updated[index] = { ...updated[index], ...updates };
    setRecipeLines(updated);
  };

  // Live calculation of preview cost
  const previewCost = calculateSubRecipeCost(
    {
      recipeLines,
      batchQuantity: Number(batchQuantity) || 1,
      yieldPercent: Number(yieldPercent) || 100,
      outputUnit,
    },
    ingredientsMap,
    subRecipesMap
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameTh.trim()) return;

    const now = new Date().toISOString();

    const subData: SubRecipe = {
      id: editingSubRecipe ? editingSubRecipe.id : `sub_${Date.now()}`,
      nameTh: nameTh.trim(),
      nameEn: nameEn.trim(),
      recipeLines,
      batchQuantity: Number(batchQuantity) || 1,
      yieldPercent: Number(yieldPercent) || 100,
      outputUnit,
      costPerOutputUnit: previewCost,
      createdAt: editingSubRecipe ? editingSubRecipe.createdAt : now,
      updatedAt: now,
      version: editingSubRecipe ? editingSubRecipe.version + 1 : 1,
    };

    await saveSubRecipe(subData);
    setIsModalOpen(false);
  };

  const filtered = store.subRecipes.filter((s) => {
    return (
      s.nameTh.toLowerCase().includes(search.toLowerCase()) ||
      s.nameEn.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {/* Top action ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search sub-recipes by name..."
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
          <span>New Sub-Recipe</span>
        </button>
      </div>

      <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span>Exact Formula: </span>
          <code className="text-amber-900 bg-amber-100/60 px-1 py-0.5 rounded font-mono text-[11px]">
            costPerOutputUnit = (sum of recipe lines) / (batchQuantity * yieldPercent / 100)
          </code>
          <span className="block text-[11px] text-neutral-400 mt-0.5">
            Use for batch-prepared sauces, marinades, broths, and prepared pastes. Any cost increase in raw ingredients automatically propagates to sub-recipes.
          </span>
        </div>
      </div>

      {/* Sub-recipes Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <CookingPot className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-700">No sub-recipes found</p>
          <p className="text-xs text-neutral-400 mt-1">
            Create multi-ingredient batch preparations used across your menu dishes.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"
          >
            Create Sub-Recipe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sub) => {
            const calculatedCost = calculateSubRecipeCost(sub, ingredientsMap, subRecipesMap);

            return (
              <div
                key={sub.id}
                className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">{sub.nameTh}</h3>
                      <p className="text-xs text-neutral-400">{sub.nameEn || '—'}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(sub)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Edit Sub-Recipe"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete sub-recipe "${sub.nameTh}"?`)) {
                            deleteSubRecipe(sub.id);
                          }
                        }}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Sub-Recipe"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="py-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                      <span className="text-[10px] text-neutral-500 block">Batch Output</span>
                      <span className="font-bold text-neutral-800 tabular-nums">
                        {sub.batchQuantity} {sub.outputUnit}
                      </span>
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                      <span className="text-[10px] text-neutral-500 block">Yield %</span>
                      <span className="font-bold text-amber-700 tabular-nums">{sub.yieldPercent}%</span>
                    </div>

                    <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-emerald-800 block font-semibold">Cost / Output</span>
                      <span className="font-bold text-emerald-950 tabular-nums">
                        {calculatedCost.toFixed(4)} ฿ / {sub.outputUnit}
                      </span>
                    </div>
                  </div>

                  {/* Ingredient lines preview */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                      Recipe Lines ({sub.recipeLines?.length || 0})
                    </span>
                    <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
                      {sub.recipeLines && sub.recipeLines.length > 0 ? (
                        sub.recipeLines.map((line, idx) => {
                          const ing =
                            line.type === 'ingredient'
                              ? ingredientsMap.get(line.itemId)
                              : subRecipesMap.get(line.itemId);
                          const lineCost =
                            line.type === 'ingredient' && ing
                              ? convertRecipeLineToBaseUnit(line.quantity, line.unit, (ing as any).baseUnit) *
                                (ing as any).costPerBaseUnit
                              : 0;

                          return (
                            <div
                              key={idx}
                              className="flex justify-between items-center p-2 bg-white text-[11px]"
                            >
                              <span className="font-medium text-neutral-800 truncate max-w-[200px]">
                                {ing?.nameTh || 'Unknown Item'}
                              </span>
                              <div className="flex items-center gap-2 tabular-nums">
                                <span className="text-neutral-500">
                                  {line.quantity} {line.unit}
                                </span>
                                <span className="font-semibold text-neutral-800">
                                  {lineCost.toFixed(2)} ฿
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-2 text-neutral-400 text-center">No lines linked</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Version {sub.version}</span>
                  <span className="text-emerald-700 font-medium">● Auto-computed</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Sub-Recipe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl border border-neutral-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingSubRecipe ? `Edit Sub-Recipe: ${editingSubRecipe.nameTh}` : 'Create Sub-Recipe'}
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
                    placeholder="e.g. น้ำซุปกระดูกหมูเข้มข้น"
                    value={nameTh}
                    onChange={(e) => setNameTh(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-medium outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Name (English)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rich Tonkotsu Broth"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-medium outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Batch & Yield details */}
              <div className="grid grid-cols-3 gap-2.5 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <div>
                  <label className="block text-neutral-600 mb-1">Batch Output Qty</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={batchQuantity}
                    onChange={(e) => setBatchQuantity(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 font-bold tabular-nums outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1">Output Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ml, g, portion"
                    value={outputUnit}
                    onChange={(e) => setOutputUnit(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 font-bold outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1">Yield % (Simmer loss)</label>
                  <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5">
                    <input
                      type="number"
                      required
                      min="1"
                      max="200"
                      value={yieldPercent}
                      onChange={(e) => setYieldPercent(Number(e.target.value))}
                      className="w-full font-bold tabular-nums outline-hidden"
                    />
                    <span className="text-[10px] text-neutral-400 ml-1">%</span>
                  </div>
                </div>
              </div>

              {/* Ingredient Lines Builder */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800">
                    Ingredients in Batch ({recipeLines.length})
                  </span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Ingredient Line</span>
                  </button>
                </div>

                {recipeLines.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed border-neutral-200 text-center text-neutral-400">
                    No ingredients added yet. Click "+ Add Ingredient Line" to build this sub-recipe.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {recipeLines.map((line, idx) => {
                      const ing = ingredientsMap.get(line.itemId);
                      const lineCost =
                        ing && line.type === 'ingredient'
                          ? convertRecipeLineToBaseUnit(line.quantity, line.unit, ing.baseUnit) *
                            ing.costPerBaseUnit
                          : 0;

                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200"
                        >
                          <div className="flex-1">
                            <select
                              value={line.itemId}
                              onChange={(e) => {
                                const selectedIng = ingredientsMap.get(e.target.value);
                                updateLine(idx, {
                                  itemId: e.target.value,
                                  unit: selectedIng?.baseUnit || 'g',
                                });
                              }}
                              className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 font-medium outline-hidden"
                            >
                              {store.ingredients.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.nameTh} ({item.costPerBaseUnit.toFixed(4)} ฿/{item.baseUnit})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-24">
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={line.quantity}
                              onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                              className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 font-bold tabular-nums outline-hidden"
                            />
                          </div>

                          <div className="w-16">
                            <input
                              type="text"
                              value={line.unit}
                              onChange={(e) => updateLine(idx, { unit: e.target.value })}
                              className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 font-medium outline-hidden"
                            />
                          </div>

                          <div className="w-20 text-right font-bold text-neutral-800 tabular-nums">
                            {lineCost.toFixed(2)} ฿
                          </div>

                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="p-1 text-neutral-400 hover:text-rose-600"
                            title="Remove line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Real-time cost summary card */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    Computed Sub-Recipe Cost
                  </span>
                  <span className="text-xs text-emerald-700">
                    Yield applied: {batchQuantity} {outputUnit} * {yieldPercent}% = {(batchQuantity * yieldPercent) / 100} {outputUnit} net yield
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-emerald-950 tabular-nums">
                    {previewCost.toFixed(4)} ฿ / {outputUnit}
                  </span>
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
                  Save Sub-Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
