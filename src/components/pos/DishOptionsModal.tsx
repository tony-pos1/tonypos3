/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Dish Options & Variant Selection Modal
 * Freezes an immutable snapshot of unit price AND unit food cost at the moment of ordering.
 */

import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, Check, UtensilsCrossed, Sparkles, ChefHat } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Dish, DishVariant, BillItem } from '../../types/models';
import { createBillItemSnapshot, calculateVariantCost } from '../../engine/calculations';
import { DishImage } from '../common/DishImage';

interface DishOptionsModalProps {
  dish: Dish;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: BillItem) => void;
}

export const DishOptionsModal: React.FC<DishOptionsModalProps> = ({
  dish,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { store, ingredientsMap, subRecipesMap, packagingMap, optionGroupsMap, lang, t } = useStore();

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    dish.variants[0]?.id || ''
  );
  const [selectedOptions, setSelectedOptions] = useState<
    Array<{ groupId: string; choiceId: string }>
  >([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  const currentVariant = useMemo(() => {
    return dish.variants.find((v) => v.id === selectedVariantId) || dish.variants[0];
  }, [dish.variants, selectedVariantId]);

  // Calculate live cost metrics for the current variant
  const variantCost = useMemo(() => {
    if (!currentVariant) {
      return { foodCost: 0, foodCostPercent: 0, grossProfit: 0, hasRecipe: false };
    }
    return calculateVariantCost(
      currentVariant,
      ingredientsMap,
      subRecipesMap,
      packagingMap,
      store.settings.targetFoodCostPercent
    );
  }, [currentVariant, ingredientsMap, subRecipesMap, packagingMap, store.settings.targetFoodCostPercent]);

  // Attached Option Groups
  const attachedGroups = useMemo(() => {
    return (dish.optionGroupIds || [])
      .map((id) => optionGroupsMap.get(id))
      .filter(Boolean);
  }, [dish.optionGroupIds, optionGroupsMap]);

  // Handle option choice selection
  const handleToggleOptionChoice = (
    groupId: string,
    choiceId: string,
    maxChoices: number
  ) => {
    setSelectedOptions((prev) => {
      const existingInGroup = prev.filter((o) => o.groupId === groupId);
      const isAlreadySelected = prev.some(
        (o) => o.groupId === groupId && o.choiceId === choiceId
      );

      if (isAlreadySelected) {
        return prev.filter(
          (o) => !(o.groupId === groupId && o.choiceId === choiceId)
        );
      }

      // If single-choice group (maxChoices === 1)
      if (maxChoices === 1) {
        const withoutCurrentGroup = prev.filter((o) => o.groupId !== groupId);
        return [...withoutCurrentGroup, { groupId, choiceId }];
      }

      // If multi-choice group, respect maxChoices limit
      if (maxChoices > 1 && existingInGroup.length >= maxChoices) {
        return prev;
      }

      return [...prev, { groupId, choiceId }];
    });
  };

  // Calculate current total price and cost per unit with selected options
  const { currentUnitPrice, currentUnitCost } = useMemo(() => {
    if (!currentVariant) return { currentUnitPrice: 0, currentUnitCost: 0 };

    let price = currentVariant.price;
    let cost = variantCost.foodCost;

    for (const opt of selectedOptions) {
      const group = optionGroupsMap.get(opt.groupId);
      const choice = group?.choices.find((c) => c.id === opt.choiceId);
      if (choice) {
        price += choice.priceDelta || 0;
      }
    }

    return {
      currentUnitPrice: price,
      currentUnitCost: cost,
    };
  }, [currentVariant, variantCost.foodCost, selectedOptions, optionGroupsMap]);

  const handleAddOrder = () => {
    if (!currentVariant) return;

    // Prepare option objects for snapshot engine
    const selectedChoicesWithGroup = selectedOptions
      .map((opt) => {
        const group = optionGroupsMap.get(opt.groupId);
        if (!group) return null;
        return {
          group,
          choiceId: opt.choiceId,
        };
      })
      .filter(Boolean) as Array<{ group: any; choiceId: string }>;

    // Frozen snapshot of price and cost at this exact moment
    const itemSnapshot = createBillItemSnapshot(
      {
        id: dish.id,
        nameTh: dish.nameTh,
        nameEn: dish.nameEn,
      },
      currentVariant,
      quantity,
      selectedChoicesWithGroup,
      ingredientsMap,
      subRecipesMap,
      packagingMap,
      notes.trim() || undefined
    );

    onConfirm(itemSnapshot);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-start justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-neutral-200">
              <DishImage photo={dish.photo} alt={dish.nameTh} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                {lang === 'th' ? dish.nameTh : dish.nameEn || dish.nameTh}
              </h3>
              {dish.nameEn && lang === 'th' && (
                <p className="text-xs text-neutral-400">{dish.nameEn}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-neutral-900 tabular-nums">
                  {currentUnitPrice.toFixed(2)} ฿
                </span>
                <span className="text-[11px] text-neutral-400">
                  ({t('unitCost')}: {currentUnitCost.toFixed(2)} ฿)
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
          {/* Variants Selector */}
          <div>
            <label className="block text-neutral-700 font-bold mb-2">
              {t('variant')} ({dish.variants.length})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dish.variants.map((v) => {
                const isSelected = v.id === selectedVariantId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-800'
                    }`}
                  >
                    <div>
                      <span className="font-bold block text-xs">
                        {lang === 'th' ? v.nameTh : v.nameEn || v.nameTh}
                      </span>
                      {v.nameEn && lang === 'th' && (
                        <span className={`text-[10px] block ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          {v.nameEn}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-xs tabular-nums ml-2">
                      {v.price.toFixed(2)} ฿
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attached Option Groups */}
          {attachedGroups.map((group) => {
            if (!group) return null;
            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-800 font-bold">
                    {lang === 'th' ? group.nameTh : group.nameEn || group.nameTh}
                  </label>
                  <span className="text-[10px] text-neutral-400">
                    {group.required ? '(Required)' : '(Optional)'} • Max {group.maxChoices || 1}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {group.choices.map((choice) => {
                    const isSelected = selectedOptions.some(
                      (o) => o.groupId === group.id && o.choiceId === choice.id
                    );

                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() =>
                          handleToggleOptionChoice(
                            group.id,
                            choice.id,
                            group.maxChoices || 1
                          )
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50 text-amber-950 font-semibold'
                            : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-700'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <span className="block truncate">
                            {lang === 'th' ? choice.nameTh : choice.nameEn || choice.nameTh}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold tabular-nums shrink-0">
                          {choice.priceDelta > 0 ? `+${choice.priceDelta} ฿` : '+0 ฿'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Kitchen / Order Notes */}
          <div>
            <label className="block text-neutral-700 font-bold mb-1">
              {t('notes')}
            </label>
            <input
              type="text"
              placeholder={lang === 'th' ? 'เช่น เผ็ดน้อย, ไม่ใส่ผักชี, หวาน 50%' : 'e.g. Less spicy, no cilantro'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 font-medium text-xs outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <span className="font-bold text-neutral-700">{t('quantity')}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 text-neutral-700 font-bold"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-bold text-sm tabular-nums text-neutral-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 text-neutral-700 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Snapshot Price & Confirm button */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 block font-medium uppercase tracking-wider">
              {t('total')}
            </span>
            <span className="text-base sm:text-lg font-bold text-neutral-900 tabular-nums">
              {(currentUnitPrice * quantity).toFixed(2)} ฿
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 font-semibold text-xs"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleAddOrder}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addToOrder')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
