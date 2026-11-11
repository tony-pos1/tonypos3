/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Menu Management Page
 *
 * Requirements:
 * - Menu cards (food types) show ONLY the uploadable food photo and the name below it, NO price.
 * - Prices show inside the card when opened to see its options/variants.
 * - Photos are compressed before saving.
 * - Dish variants with recipe builder (ingredients + sub-recipes + packaging lines).
 * - Food cost, food cost %, gross profit live with warning color when > target %.
 * - Suggested price for target food cost %.
 * - Dishes with no recipe show "No recipe linked", never a made-up cost.
 * - Option groups tick-box attachment.
 * - Category management (add, delete, reorder).
 */

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Image as ImageIcon,
  Upload,
  Camera,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowUp,
  ArrowDown,
  Tag,
  BookOpen,
  Wheat,
  Package,
  CookingPot,
  Info,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Dish, DishVariant, RecipeLine, PackagingLine, Category } from '../types/models';
import { calculateVariantCost, convertRecipeLineToBaseUnit } from '../engine/calculations';
import { compressImageFile } from '../utils/imageCompressor';
import { OptionGroupsPage } from './foodcost/OptionGroupsPage';
import { DishImage } from '../components/common/DishImage';

export const MenuPage: React.FC = () => {
  const {
    store,
    saveDish,
    deleteDish,
    saveCategory,
    deleteCategory,
    reorderCategories,
    ingredientsMap,
    subRecipesMap,
    packagingMap,
    optionGroupsMap,
    saveImage,
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'menu' | 'optionGroups'>('menu');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // Detail Modal for a clicked Dish Card
  const [selectedDishForDetail, setSelectedDishForDetail] = useState<Dish | null>(null);

  // Edit / Create Dish Modal
  const [isDishEditorOpen, setIsDishEditorOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // Dish Editor Form State
  const [dishNameTh, setDishNameTh] = useState('');
  const [dishNameEn, setDishNameEn] = useState('');
  const [dishCategoryId, setDishCategoryId] = useState('');
  const [dishPhoto, setDishPhoto] = useState<string | undefined>(undefined);
  const [dishVariants, setDishVariants] = useState<DishVariant[]>([]);
  const [attachedOptionGroupIds, setAttachedOptionGroupIds] = useState<string[]>([]);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  // Category Manager Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatNameTh, setNewCatNameTh] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');

  // Open Dish Editor
  const openCreateDishModal = () => {
    setEditingDish(null);
    setDishNameTh('');
    setDishNameEn('');
    setDishCategoryId(store.categories[0]?.id || 'cat_main');
    setDishPhoto(undefined);
    setAttachedOptionGroupIds(store.optionGroups.map((g) => g.id));
    setDishVariants([
      {
        id: `var_${Date.now()}_1`,
        nameTh: 'หมู (Pork)',
        nameEn: 'Pork',
        price: 80,
        recipeLines: store.ingredients[0]
          ? [
              {
                type: 'ingredient',
                itemId: store.ingredients[0].id,
                quantity: 100,
                unit: store.ingredients[0].baseUnit,
              },
            ]
          : [],
        packagingLines: [],
      },
    ]);
    setIsDishEditorOpen(true);
  };

  const openEditDishModal = (dish: Dish) => {
    setEditingDish(dish);
    setDishNameTh(dish.nameTh);
    setDishNameEn(dish.nameEn);
    setDishCategoryId(dish.categoryId);
    setDishPhoto(dish.photo);
    setAttachedOptionGroupIds([...dish.optionGroupIds]);
    setDishVariants(
      dish.variants.map((v) => ({
        ...v,
        recipeLines: [...v.recipeLines],
        packagingLines: [...v.packagingLines],
      }))
    );
    setIsDishEditorOpen(true);
  };

  // Image Upload with client-side compression and document isolation
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressingPhoto(true);
      try {
        const compressed = await compressImageFile(file, 600, 600, 0.75);
        const imageId = await saveImage(compressed);
        setDishPhoto(imageId);
      } catch (err) {
        alert('Failed to compress and save image');
      } finally {
        setIsCompressingPhoto(false);
      }
    }
  };

  // Dish Variants Handlers
  const addVariant = () => {
    const newVariant: DishVariant = {
      id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nameTh: 'ตัวเลือกใหม่ (New Variant)',
      nameEn: 'New Variant',
      price: 80,
      recipeLines: [],
      packagingLines: [],
    };
    setDishVariants([...dishVariants, newVariant]);
  };

  const removeVariant = (index: number) => {
    if (dishVariants.length <= 1) {
      alert('A dish must have at least one variant.');
      return;
    }
    setDishVariants(dishVariants.filter((_, idx) => idx !== index));
  };

  const updateVariant = (index: number, updates: Partial<DishVariant>) => {
    const updated = [...dishVariants];
    updated[index] = { ...updated[index], ...updates };
    setDishVariants(updated);
  };

  // Recipe Line inside Variant
  const addRecipeLineToVariant = (variantIndex: number) => {
    if (store.ingredients.length === 0) return;
    const updated = [...dishVariants];
    const defaultIng = store.ingredients[0];
    updated[variantIndex].recipeLines.push({
      type: 'ingredient',
      itemId: defaultIng.id,
      quantity: 50,
      unit: defaultIng.baseUnit,
    });
    setDishVariants(updated);
  };

  const removeRecipeLineFromVariant = (variantIndex: number, lineIndex: number) => {
    const updated = [...dishVariants];
    updated[variantIndex].recipeLines = updated[variantIndex].recipeLines.filter(
      (_, idx) => idx !== lineIndex
    );
    setDishVariants(updated);
  };

  // Packaging Line inside Variant
  const addPackagingLineToVariant = (variantIndex: number) => {
    if (store.packaging.length === 0) {
      alert('Please add packaging items in Food Cost > Packaging first.');
      return;
    }
    const updated = [...dishVariants];
    const defaultPkg = store.packaging[0];
    updated[variantIndex].packagingLines.push({
      packagingId: defaultPkg.id,
      quantity: 1,
    });
    setDishVariants(updated);
  };

  const removePackagingLineFromVariant = (variantIndex: number, pkgIndex: number) => {
    const updated = [...dishVariants];
    updated[variantIndex].packagingLines = updated[variantIndex].packagingLines.filter(
      (_, idx) => idx !== pkgIndex
    );
    setDishVariants(updated);
  };

  // Option group toggle
  const toggleOptionGroup = (groupId: string) => {
    if (attachedOptionGroupIds.includes(groupId)) {
      setAttachedOptionGroupIds(attachedOptionGroupIds.filter((id) => id !== groupId));
    } else {
      setAttachedOptionGroupIds([...attachedOptionGroupIds, groupId]);
    }
  };

  // Save Dish
  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishNameTh.trim()) return;

    const now = new Date().toISOString();

    const dishData: Dish = {
      id: editingDish ? editingDish.id : `dish_${Date.now()}`,
      nameTh: dishNameTh.trim(),
      nameEn: dishNameEn.trim(),
      categoryId: dishCategoryId || store.categories[0]?.id || 'cat_main',
      photo: dishPhoto,
      active: true,
      variants: dishVariants,
      optionGroupIds: attachedOptionGroupIds,
      createdAt: editingDish ? editingDish.createdAt : now,
      updatedAt: now,
      version: editingDish ? editingDish.version + 1 : 1,
    };

    await saveDish(dishData);
    setIsDishEditorOpen(false);

    // If detail modal was open for this dish, update it
    if (selectedDishForDetail?.id === dishData.id) {
      setSelectedDishForDetail(dishData);
    }
  };

  // Category Actions
  const handleAddCategory = async (e: React.FormEvent) => {
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
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...store.categories];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newCategories.length) return;

    const temp = newCategories[index];
    newCategories[index] = newCategories[target];
    newCategories[target] = temp;

    reorderCategories(newCategories);
  };

  const filteredDishes = store.dishes.filter((dish) => {
    if (selectedCategoryId === 'all') return true;
    return dish.categoryId === selectedCategoryId;
  });

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {/* Tab Switcher: Menu vs Option Groups Library */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('menu')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubTab === 'menu'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Menu Dishes ({store.dishes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('optionGroups')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubTab === 'optionGroups'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Option Group Library ({store.optionGroups.length})</span>
          </button>
        </div>

        {activeSubTab === 'menu' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Categories ({store.categories.length})
            </button>
            <button
              type="button"
              onClick={openCreateDishModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Dish</span>
            </button>
          </div>
        )}
      </div>

      {/* OPTION GROUPS TAB */}
      {activeSubTab === 'optionGroups' && <OptionGroupsPage />}

      {/* MENU DISHES TAB */}
      {activeSubTab === 'menu' && (
        <div className="space-y-4">
          {/* Categories Tab Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategoryId === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              All Dishes ({store.dishes.length})
            </button>
            {store.categories.map((cat) => {
              const count = store.dishes.filter((d) => d.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedCategoryId === cat.id
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {cat.nameTh} ({count})
                </button>
              );
            })}
          </div>

          {/* User requirement reminder banner */}
          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span>Display Design: </span>
              <span>
                Menu cards show <strong>ONLY the compressed food photo and the name below it</strong> (no outer price). Click any card to open and inspect variant prices, live food cost %, suggested prices, and attached options.
              </span>
            </div>
          </div>

          {/* Dish Grid: Cards show ONLY photo and name below it */}
          {filteredDishes.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
              <UtensilsCrossed className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-700">No dishes in this category</p>
              <p className="text-xs text-neutral-400 mt-1">
                Add a menu dish with variants and linked recipe ingredients.
              </p>
              <button
                type="button"
                onClick={openCreateDishModal}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"
              >
                Add Menu Dish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  onClick={() => setSelectedDishForDetail(dish)}
                  className="group cursor-pointer rounded-2xl bg-white border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  title="Click to view prices and variant options"
                >
                  {/* Food Photo Container - ONLY Photo */}
                  <div className="relative aspect-4/3 w-full bg-neutral-100 overflow-hidden">
                    <DishImage photo={dish.photo} alt={dish.nameTh} />
                  </div>

                  {/* Name Container Below Photo - ONLY Name, NO Price */}
                  <div className="p-3 text-center flex-1 flex flex-col justify-center">
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-1 group-hover:text-amber-800 transition-colors">
                      {dish.nameTh}
                    </h4>
                    {dish.nameEn && (
                      <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                        {dish.nameEn}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DISH DETAIL MODAL (Opened when clicking a menu card to see prices, variants, recipes) */}
      {selectedDishForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 max-h-[92vh] overflow-y-auto">
            {/* Header with Photo & Title */}
            <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 shrink-0">
                  <DishImage photo={selectedDishForDetail.photo} alt={selectedDishForDetail.nameTh} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    {selectedDishForDetail.nameTh}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {selectedDishForDetail.nameEn || 'Menu Item'}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-neutral-500 uppercase px-2 py-0.5 rounded bg-neutral-100">
                    {store.categories.find((c) => c.id === selectedDishForDetail.categoryId)?.nameTh || 'Main'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    openEditDishModal(selectedDishForDetail);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Recipe</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDishForDetail(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dish Variants & Detailed Prices Breakdown */}
            <div className="py-4 space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                  Variant Options &amp; Selling Prices ({selectedDishForDetail.variants.length})
                </span>

                <div className="space-y-3">
                  {selectedDishForDetail.variants.map((variant) => {
                    const costMetrics = calculateVariantCost(
                      variant,
                      ingredientsMap,
                      subRecipesMap,
                      packagingMap,
                      store.settings.targetFoodCostPercent
                    );

                    const isOverTarget =
                      costMetrics.hasRecipe &&
                      costMetrics.foodCostPercent > store.settings.targetFoodCostPercent;

                    return (
                      <div
                        key={variant.id}
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3"
                      >
                        {/* Variant Title & Price */}
                        <div className="flex justify-between items-center pb-2 border-b border-neutral-200/80">
                          <div>
                            <span className="text-sm font-bold text-neutral-900 block">
                              {variant.nameTh}
                            </span>
                            {variant.nameEn && (
                              <span className="text-[11px] text-neutral-400">{variant.nameEn}</span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-neutral-400 block uppercase font-medium">
                              Selling Price
                            </span>
                            <span className="text-base font-bold text-neutral-900 tabular-nums">
                              {variant.price.toFixed(2)} ฿
                            </span>
                          </div>
                        </div>

                        {/* Recipe Status & Calculations */}
                        {!costMetrics.hasRecipe ? (
                          <div className="p-2.5 rounded-lg bg-neutral-100 text-neutral-600 font-medium text-center">
                            No recipe linked
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                              <span className="text-[10px] text-neutral-500 block">Food Cost</span>
                              <span className="font-bold text-neutral-900 tabular-nums">
                                {costMetrics.foodCost.toFixed(2)} ฿
                              </span>
                            </div>

                            <div
                              className={`p-2.5 rounded-lg border ${
                                isOverTarget
                                  ? 'bg-amber-100/70 border-amber-300 text-amber-900 font-semibold'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] block opacity-80">Food Cost %</span>
                                {isOverTarget && <AlertTriangle className="w-3 h-3 text-amber-700" />}
                              </div>
                              <span className="font-bold tabular-nums">
                                {costMetrics.foodCostPercent.toFixed(1)}%
                              </span>
                              <span className="text-[9px] block opacity-80 mt-0.5">
                                Target: {store.settings.targetFoodCostPercent}%
                              </span>
                            </div>

                            <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                              <span className="text-[10px] text-neutral-500 block">Gross Profit</span>
                              <span className="font-bold text-emerald-700 tabular-nums">
                                {costMetrics.grossProfit.toFixed(2)} ฿
                              </span>
                            </div>

                            <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-200 text-blue-900">
                              <span className="text-[10px] block opacity-80">Suggested Price</span>
                              <span className="font-bold tabular-nums">
                                {costMetrics.suggestedPrice.toFixed(2)} ฿
                              </span>
                              <span className="text-[9px] block opacity-70 mt-0.5">
                                For {store.settings.targetFoodCostPercent}% cost
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Recipe lines preview */}
                        {costMetrics.hasRecipe && (
                          <div className="text-[11px] text-neutral-500 space-y-1 pt-1">
                            <span className="font-semibold block text-neutral-600">
                              Recipe lines:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {variant.recipeLines.map((l, lIdx) => {
                                const ing =
                                  l.type === 'ingredient'
                                    ? ingredientsMap.get(l.itemId)
                                    : subRecipesMap.get(l.itemId);
                                return (
                                  <span
                                    key={lIdx}
                                    className="px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700"
                                  >
                                    {ing?.nameTh || 'Item'}: {l.quantity} {l.unit}
                                  </span>
                                );
                              })}
                              {variant.packagingLines.map((p, pIdx) => {
                                const pkg = packagingMap.get(p.packagingId);
                                return (
                                  <span
                                    key={`pkg_${pIdx}`}
                                    className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800"
                                  >
                                    {pkg?.name}: x{p.quantity}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Attached Option Groups */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                  Attached Modifiers &amp; Options ({selectedDishForDetail.optionGroupIds.length})
                </span>

                {selectedDishForDetail.optionGroupIds.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic">No option groups attached to this dish.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDishForDetail.optionGroupIds.map((grpId) => {
                      const group = optionGroupsMap.get(grpId);
                      if (!group) return null;

                      return (
                        <div
                          key={group.id}
                          className="p-3 rounded-lg border border-neutral-200 bg-white space-y-1.5"
                        >
                          <div className="flex justify-between items-center font-semibold text-neutral-900">
                            <span>{group.nameTh} ({group.nameEn})</span>
                            <span className="text-[10px] text-neutral-400">
                              {group.required ? 'Required' : 'Optional'}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {group.choices.map((c) => (
                              <span
                                key={c.id}
                                className="px-2 py-0.5 rounded text-[11px] bg-neutral-50 border border-neutral-200 text-neutral-700"
                              >
                                {c.nameTh} {c.priceDelta > 0 ? `(+${c.priceDelta} ฿)` : '(+0 ฿)'}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISH EDITOR & RECIPE BUILDER MODAL */}
      {isDishEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingDish ? `Edit Recipe & Dish: ${editingDish.nameTh}` : 'Create Menu Dish & Recipe'}
              </h3>
              <button
                type="button"
                onClick={() => setIsDishEditorOpen(false)}
                className="text-xs px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-5 pt-4 text-xs">
              {/* Photo Upload & Main details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Photo upload with compression */}
                <div className="space-y-1.5">
                  <label className="block text-neutral-600 font-medium">Food Photo</label>
                  <div className="relative aspect-4/3 w-full rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden flex flex-col items-center justify-center text-neutral-400">
                    <DishImage photo={dishPhoto} alt="Food preview" />

                    <label className="absolute inset-0 bg-neutral-900/40 opacity-0 hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                      <Upload className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-semibold">
                        {isCompressingPhoto ? 'Compressing...' : 'Upload & Compress'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {dishPhoto && (
                    <button
                      type="button"
                      onClick={() => setDishPhoto(undefined)}
                      className="text-[10px] text-rose-600 hover:underline block"
                    >
                      Remove photo
                    </button>
                  )}
                </div>

                {/* Names and Category */}
                <div className="md:col-span-2 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-600 font-medium mb-1">
                        Dish Name (Thai) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ข้าวหมูกรอบคั่วพริกเกลือ"
                        value={dishNameTh}
                        onChange={(e) => setDishNameTh(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-medium outline-hidden focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 font-medium mb-1">
                        Dish Name (English)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Crispy Pork with Chili Salt"
                        value={dishNameEn}
                        onChange={(e) => setDishNameEn(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-medium outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-600 font-medium mb-1">Menu Category</label>
                    <select
                      value={dishCategoryId}
                      onChange={(e) => setDishCategoryId(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 font-medium outline-hidden"
                    >
                      {store.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameTh} ({c.nameEn})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dish Variants & Recipes Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Dish Variants &amp; Ingredient Recipes
                    </h4>
                    <span className="text-[11px] text-neutral-400">
                      Configure variations (e.g. Pork / Chicken / Seafood) with recipes and packaging.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {dishVariants.map((variant, vIdx) => {
                    const costMetrics = calculateVariantCost(
                      variant,
                      ingredientsMap,
                      subRecipesMap,
                      packagingMap,
                      store.settings.targetFoodCostPercent
                    );
                    const isOverTarget =
                      costMetrics.hasRecipe &&
                      costMetrics.foodCostPercent > store.settings.targetFoodCostPercent;

                    return (
                      <div
                        key={variant.id}
                        className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3"
                      >
                        {/* Variant Name & Price */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              required
                              placeholder="Variant Name (e.g. หมู Pork)"
                              value={variant.nameTh}
                              onChange={(e) => updateVariant(vIdx, { nameTh: e.target.value })}
                              className="font-bold text-neutral-900 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs outline-hidden"
                            />
                            <input
                              type="text"
                              placeholder="English (optional)"
                              value={variant.nameEn}
                              onChange={(e) => updateVariant(vIdx, { nameEn: e.target.value })}
                              className="text-neutral-600 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs outline-hidden"
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center rounded-md border border-neutral-300 bg-white px-2 py-1">
                              <span className="text-[10px] text-neutral-400 mr-1">Price:</span>
                              <input
                                type="number"
                                required
                                min="0"
                                value={variant.price}
                                onChange={(e) =>
                                  updateVariant(vIdx, { price: Number(e.target.value) })
                                }
                                className="w-20 font-bold tabular-nums outline-hidden"
                              />
                              <span className="text-[10px] text-neutral-400 ml-1">฿</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeVariant(vIdx)}
                              className="p-1 text-neutral-400 hover:text-rose-600"
                              title="Delete variant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Live Cost & Suggested Price Bar */}
                        {costMetrics.hasRecipe ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="bg-white p-2 rounded-lg border border-neutral-200">
                              <span className="text-[10px] text-neutral-500 block">Food Cost:</span>
                              <span className="font-bold text-neutral-900 tabular-nums">
                                {costMetrics.foodCost.toFixed(2)} ฿
                              </span>
                            </div>

                            <div
                              className={`p-2 rounded-lg border ${
                                isOverTarget
                                  ? 'bg-amber-100/70 border-amber-300 text-amber-900 font-bold'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              }`}
                            >
                              <span className="text-[10px] block opacity-80">Food Cost %:</span>
                              <span className="font-bold tabular-nums">
                                {costMetrics.foodCostPercent.toFixed(1)}%
                              </span>
                            </div>

                            <div className="bg-white p-2 rounded-lg border border-neutral-200">
                              <span className="text-[10px] text-neutral-500 block">Gross Profit:</span>
                              <span className="font-bold text-emerald-700 tabular-nums">
                                {costMetrics.grossProfit.toFixed(2)} ฿
                              </span>
                            </div>

                            <div className="bg-blue-50/70 p-2 rounded-lg border border-blue-200 text-blue-900">
                              <span className="text-[10px] block opacity-80">Suggested Price:</span>
                              <span className="font-bold tabular-nums">
                                {costMetrics.suggestedPrice.toFixed(2)} ฿
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-neutral-200/50 text-neutral-600 font-medium text-[11px] text-center">
                            No recipe linked (Food cost will not be made up)
                          </div>
                        )}

                        {/* Recipe Lines Builder */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-neutral-700">Recipe Lines:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => addRecipeLineToVariant(vIdx)}
                                className="text-amber-800 font-semibold hover:underline"
                              >
                                + Add Ingredient
                              </button>
                              <button
                                type="button"
                                onClick={() => addPackagingLineToVariant(vIdx)}
                                className="text-blue-800 font-semibold hover:underline"
                              >
                                + Add Packaging
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            {variant.recipeLines.map((line, lIdx) => {
                              const ing = ingredientsMap.get(line.itemId);
                              const lineCost = ing
                                ? convertRecipeLineToBaseUnit(line.quantity, line.unit, ing.baseUnit) *
                                  ing.costPerBaseUnit
                                : 0;

                              return (
                                <div
                                  key={lIdx}
                                  className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-neutral-200 text-xs"
                                >
                                  <select
                                    value={line.itemId}
                                    onChange={(e) => {
                                      const updatedVariants = [...dishVariants];
                                      const selectedIng = ingredientsMap.get(e.target.value);
                                      updatedVariants[vIdx].recipeLines[lIdx].itemId = e.target.value;
                                      if (selectedIng) {
                                        updatedVariants[vIdx].recipeLines[lIdx].unit = selectedIng.baseUnit;
                                      }
                                      setDishVariants(updatedVariants);
                                    }}
                                    className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1 outline-hidden"
                                  >
                                    {store.ingredients.map((item) => (
                                      <option key={item.id} value={item.id}>
                                        {item.nameTh} ({item.costPerBaseUnit.toFixed(4)} ฿/{item.baseUnit})
                                      </option>
                                    ))}
                                  </select>

                                  <input
                                    type="number"
                                    min="0.1"
                                    step="any"
                                    value={line.quantity}
                                    onChange={(e) => {
                                      const updatedVariants = [...dishVariants];
                                      updatedVariants[vIdx].recipeLines[lIdx].quantity = Number(
                                        e.target.value
                                      );
                                      setDishVariants(updatedVariants);
                                    }}
                                    className="w-20 rounded border border-neutral-300 bg-white px-2 py-1 tabular-nums font-bold outline-hidden"
                                  />

                                  <span className="w-12 text-neutral-400 text-[11px]">{line.unit}</span>

                                  <span className="w-16 text-right font-bold text-neutral-800 tabular-nums">
                                    {lineCost.toFixed(2)} ฿
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => removeRecipeLineFromVariant(vIdx, lIdx)}
                                    className="p-1 text-neutral-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}

                            {variant.packagingLines.map((pkgLine, pIdx) => {
                              const pkg = packagingMap.get(pkgLine.packagingId);
                              const lineCost = pkg ? pkg.unitCost * pkgLine.quantity : 0;

                              return (
                                <div
                                  key={`pkg_${pIdx}`}
                                  className="flex items-center gap-2 p-1.5 rounded-lg bg-blue-50/50 border border-blue-200 text-xs"
                                >
                                  <select
                                    value={pkgLine.packagingId}
                                    onChange={(e) => {
                                      const updatedVariants = [...dishVariants];
                                      updatedVariants[vIdx].packagingLines[pIdx].packagingId =
                                        e.target.value;
                                      setDishVariants(updatedVariants);
                                    }}
                                    className="flex-1 rounded border border-blue-300 bg-white px-2 py-1 outline-hidden"
                                  >
                                    {store.packaging.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        [Packaging] {p.name} ({p.unitCost.toFixed(2)} ฿/pc)
                                      </option>
                                    ))}
                                  </select>

                                  <input
                                    type="number"
                                    min="1"
                                    value={pkgLine.quantity}
                                    onChange={(e) => {
                                      const updatedVariants = [...dishVariants];
                                      updatedVariants[vIdx].packagingLines[pIdx].quantity = Number(
                                        e.target.value
                                      );
                                      setDishVariants(updatedVariants);
                                    }}
                                    className="w-20 rounded border border-blue-300 bg-white px-2 py-1 tabular-nums font-bold outline-hidden"
                                  />

                                  <span className="w-12 text-neutral-400 text-[11px]">pcs</span>

                                  <span className="w-16 text-right font-bold text-neutral-800 tabular-nums">
                                    {lineCost.toFixed(2)} ฿
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => removePackagingLineFromVariant(vIdx, pIdx)}
                                    className="p-1 text-neutral-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Option Groups Checklist: "just tick the groups to attach" */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider block">
                  Attach Option Groups ({attachedOptionGroupIds.length} selected)
                </span>
                <span className="text-[11px] text-neutral-400 block">
                  Tick the option modifier groups that apply to this dish.
                </span>

                {store.optionGroups.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic">
                    No option groups in library. Create option groups in Option Group Library tab.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {store.optionGroups.map((grp) => {
                      const isAttached = attachedOptionGroupIds.includes(grp.id);
                      return (
                        <div
                          key={grp.id}
                          onClick={() => toggleOptionGroup(grp.id)}
                          className={`cursor-pointer p-3 rounded-xl border flex items-center justify-between transition-colors ${
                            isAttached
                              ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-semibold'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <div>
                            <span className="text-xs block">{grp.nameTh}</span>
                            <span className="text-[10px] text-neutral-400 block font-normal">
                              {grp.choices.length} choices · {grp.required ? 'Mandatory' : 'Optional'}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isAttached}
                            onChange={() => {}}
                            className="rounded text-amber-600 pointer-events-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsDishEditorOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  {editingDish ? 'Update Dish & Recipes' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MANAGER MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">Manage Menu Categories</h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-xs px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              >
                Close
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Add New Category */}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Category Name (Thai)"
                  value={newCatNameTh}
                  onChange={(e) => setNewCatNameTh(e.target.value)}
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 outline-hidden"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 shrink-0"
                >
                  Add
                </button>
              </form>

              {/* Categories Reordering List */}
              <div className="space-y-1.5 divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden">
                {store.categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 bg-white text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveCategory(idx, 'up')}
                          className="p-1 text-neutral-400 hover:text-neutral-900 disabled:opacity-20"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === store.categories.length - 1}
                          onClick={() => moveCategory(idx, 'down')}
                          className="p-1 text-neutral-400 hover:text-neutral-900 disabled:opacity-20"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-semibold text-neutral-900">{cat.nameTh}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete category "${cat.nameTh}"?`)) {
                          deleteCategory(cat.id);
                        }
                      }}
                      className="p-1 text-neutral-300 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
