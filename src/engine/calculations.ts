/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Calculation Engine (Single Source of Truth)
 *
 * Exact business rules:
 * - costPerBaseUnit = purchasePrice / (purchaseQuantity in base unit * yieldPercent / 100)
 * - Automatic unit conversion (kg -> g, l -> ml, piece -> piece)
 * - Dish variant food cost = sum of recipe lines + packaging lines
 * - Food cost % = food cost / net price (net price EXCLUDES VAT and service charge)
 * - Platform fee = commission % * net sales (+ VAT on commission if set) + payment fee
 * - Gross profit = net sales - food cost
 * - Net profit = gross profit - platform fees - packaging - expenses - labor
 * - A bill item's cost is read from its saved snapshot, never recomputed from today's prices
 */

import {
  Ingredient,
  SubRecipe,
  PackagingItem,
  DishVariant,
  SalesChannel,
  BillItem,
  OptionGroup,
  BaseUnit,
} from '../types/models';

/**
 * Standard unit converter to base units (g, ml, piece).
 */
export function convertToBaseQuantity(quantity: number, fromUnit: string, targetBaseUnit: BaseUnit): number {
  const normUnit = fromUnit.trim().toLowerCase();

  if (targetBaseUnit === 'g') {
    if (normUnit === 'kg' || normUnit === 'kilogram' || normUnit === 'กก.' || normUnit === 'กิโลกรัม') {
      return quantity * 1000;
    }
    if (normUnit === 'g' || normUnit === 'gram' || normUnit === 'กรัม') {
      return quantity;
    }
    if (normUnit === 'mg' || normUnit === 'มิลลิกรัม') {
      return quantity / 1000;
    }
  }

  if (targetBaseUnit === 'ml') {
    if (normUnit === 'l' || normUnit === 'liter' || normUnit === 'litre' || normUnit === 'ลิตร') {
      return quantity * 1000;
    }
    if (normUnit === 'ml' || normUnit === 'milliliter' || normUnit === 'มล.' || normUnit === 'มิลลิลิตร') {
      return quantity;
    }
    if (normUnit === 'cl') {
      return quantity * 10;
    }
  }

  if (targetBaseUnit === 'piece') {
    // Piece / unit is 1:1
    return quantity;
  }

  // Fallback if units already match or unrecognized unit
  return quantity;
}

/**
 * Converts a recipe line quantity to the item's base unit.
 */
export function convertRecipeLineToBaseUnit(
  quantity: number,
  lineUnit: string,
  baseUnit: BaseUnit
): number {
  return convertToBaseQuantity(quantity, lineUnit, baseUnit);
}

/**
 * Calculates the cost per base unit of an ingredient.
 * Formula: purchasePrice / (purchaseQuantity in base unit * (yieldPercent / 100))
 */
export function calculateIngredientCostPerBaseUnit(
  purchasePrice: number,
  purchaseQuantity: number,
  purchaseUnit: string,
  yieldPercent: number,
  baseUnit: BaseUnit
): number {
  if (purchasePrice <= 0 || purchaseQuantity <= 0 || yieldPercent <= 0) {
    return 0;
  }

  const baseQuantity = convertToBaseQuantity(purchaseQuantity, purchaseUnit, baseUnit);
  const effectiveYieldQuantity = baseQuantity * (yieldPercent / 100);

  if (effectiveYieldQuantity <= 0) {
    return 0;
  }

  const costPerBase = purchasePrice / effectiveYieldQuantity;
  // Round to 6 decimal places to prevent float drift
  return Math.round(costPerBase * 1000000) / 1000000;
}

/**
 * Calculates the cost per output unit of a sub-recipe.
 * Formula: (sum of ingredient costs) / (batchQuantity * (yieldPercent / 100))
 */
export function calculateSubRecipeCost(
  subRecipe: Pick<SubRecipe, 'recipeLines' | 'batchQuantity' | 'yieldPercent' | 'outputUnit'>,
  ingredientsMap: Map<string, Ingredient>,
  subRecipesMap: Map<string, SubRecipe>
): number {
  let totalLineCost = 0;

  for (const line of subRecipe.recipeLines) {
    if (line.type === 'ingredient') {
      const ing = ingredientsMap.get(line.itemId);
      if (ing) {
        const qtyInBase = convertRecipeLineToBaseUnit(line.quantity, line.unit, ing.baseUnit);
        totalLineCost += qtyInBase * ing.costPerBaseUnit;
      }
    } else if (line.type === 'subRecipe') {
      const sub = subRecipesMap.get(line.itemId);
      if (sub) {
        totalLineCost += line.quantity * sub.costPerOutputUnit;
      }
    }
  }

  const effectiveYieldQuantity = subRecipe.batchQuantity * (subRecipe.yieldPercent / 100);
  if (effectiveYieldQuantity <= 0) {
    return 0;
  }

  return Math.round((totalLineCost / effectiveYieldQuantity) * 1000000) / 1000000;
}

/**
 * Calculates dish variant food cost and metrics.
 * Dish variant food cost = sum of recipe lines + packaging lines.
 * Food cost % = food cost / net price (net price EXCLUDES VAT and service charge).
 * Gross profit = net price - food cost.
 */
/**
 * Calculates the suggested selling price to achieve target food cost percentage.
 * Formula: foodCost / (targetFoodCostPercent / 100)
 */
export function calculateSuggestedPrice(foodCost: number, targetFoodCostPercent: number): number {
  if (foodCost <= 0 || targetFoodCostPercent <= 0) return 0;
  return Math.round((foodCost / (targetFoodCostPercent / 100)) * 100) / 100;
}

/**
 * Calculates dish variant food cost and metrics.
 * Dish variant food cost = sum of recipe lines + packaging lines.
 * Food cost % = food cost / net price (net price EXCLUDES VAT and service charge).
 * Gross profit = net price - food cost.
 */
export function calculateVariantCost(
  variant: DishVariant,
  ingredientsMap: Map<string, Ingredient>,
  subRecipesMap: Map<string, SubRecipe>,
  packagingMap: Map<string, PackagingItem>,
  targetFoodCostPercent: number = 30
): {
  foodCost: number;
  recipeCost: number;
  packagingCost: number;
  foodCostPercent: number;
  grossProfit: number;
  hasRecipe: boolean;
  suggestedPrice: number;
} {
  let recipeCost = 0;
  let packagingCost = 0;

  const hasRecipeLines = Array.isArray(variant.recipeLines) && variant.recipeLines.length > 0;
  const hasPackagingLines = Array.isArray(variant.packagingLines) && variant.packagingLines.length > 0;
  const hasRecipe = hasRecipeLines || hasPackagingLines;

  // 1. Calculate Recipe Lines
  if (hasRecipeLines) {
    for (const line of variant.recipeLines) {
      if (line.type === 'ingredient') {
        const ing = ingredientsMap.get(line.itemId);
        if (ing) {
          const qtyInBase = convertRecipeLineToBaseUnit(line.quantity, line.unit, ing.baseUnit);
          recipeCost += qtyInBase * ing.costPerBaseUnit;
        }
      } else if (line.type === 'subRecipe') {
        const sub = subRecipesMap.get(line.itemId);
        if (sub) {
          recipeCost += line.quantity * sub.costPerOutputUnit;
        }
      }
    }
  }

  // 2. Calculate Packaging Lines
  if (hasPackagingLines) {
    for (const pkgLine of variant.packagingLines) {
      const pkg = packagingMap.get(pkgLine.packagingId);
      if (pkg) {
        packagingCost += pkgLine.quantity * pkg.unitCost;
      }
    }
  }

  const totalFoodCost = Math.round((recipeCost + packagingCost) * 100) / 100;
  const netPrice = variant.price; // Variant price is net selling price (exclusive of VAT/service charge)

  let foodCostPercent = 0;
  if (netPrice > 0 && hasRecipe) {
    foodCostPercent = Math.round((totalFoodCost / netPrice) * 10000) / 100; // e.g. 25.00
  }

  const grossProfit = hasRecipe ? Math.round((netPrice - totalFoodCost) * 100) / 100 : netPrice;
  const suggestedPrice = hasRecipe ? calculateSuggestedPrice(totalFoodCost, targetFoodCostPercent) : 0;

  return {
    foodCost: totalFoodCost,
    recipeCost: Math.round(recipeCost * 100) / 100,
    packagingCost: Math.round(packagingCost * 100) / 100,
    foodCostPercent,
    grossProfit,
    hasRecipe,
    suggestedPrice,
  };
}

/**
 * Calculates the cost delta of an option choice from its cost lines.
 */
export function calculateOptionChoiceCost(
  costLines: Array<{ type: 'ingredient' | 'packaging'; itemId: string; quantity: number; unit: string }> | undefined,
  ingredientsMap: Map<string, Ingredient>,
  packagingMap: Map<string, PackagingItem>
): number {
  if (!costLines || costLines.length === 0) return 0;

  let totalCost = 0;
  for (const line of costLines) {
    if (line.type === 'ingredient') {
      const ing = ingredientsMap.get(line.itemId);
      if (ing) {
        const qtyInBase = convertRecipeLineToBaseUnit(line.quantity, line.unit, ing.baseUnit);
        totalCost += qtyInBase * ing.costPerBaseUnit;
      }
    } else if (line.type === 'packaging') {
      const pkg = packagingMap.get(line.itemId);
      if (pkg) {
        totalCost += line.quantity * pkg.unitCost;
      }
    }
  }

  return Math.round(totalCost * 100) / 100;
}

/**
 * Calculates platform fee for sales channel.
 * Platform fee = commission % * net sales (+ VAT on commission if set) + payment fee
 */
export function calculatePlatformFee(
  netSales: number,
  channel: Pick<SalesChannel, 'commissionPercent' | 'paymentFeePercent' | 'vatOnCommissionPercent'>
): {
  commissionAmount: number;
  vatOnCommission: number;
  paymentFeeAmount: number;
  totalPlatformFee: number;
} {
  if (netSales <= 0) {
    return {
      commissionAmount: 0,
      vatOnCommission: 0,
      paymentFeeAmount: 0,
      totalPlatformFee: 0,
    };
  }

  const commissionAmount = netSales * (channel.commissionPercent / 100);
  const vatOnCommission = commissionAmount * (channel.vatOnCommissionPercent / 100);
  const paymentFeeAmount = netSales * (channel.paymentFeePercent / 100);
  const totalPlatformFee = commissionAmount + vatOnCommission + paymentFeeAmount;

  return {
    commissionAmount: Math.round(commissionAmount * 100) / 100,
    vatOnCommission: Math.round(vatOnCommission * 100) / 100,
    paymentFeeAmount: Math.round(paymentFeeAmount * 100) / 100,
    totalPlatformFee: Math.round(totalPlatformFee * 100) / 100,
  };
}

/**
 * Calculates Net Profit.
 * Formula: gross profit - platform fees - packaging - expenses - labor
 */
export function calculateNetProfit(
  grossProfit: number,
  platformFees: number,
  packagingExpenses: number,
  operatingExpenses: number,
  laborExpenses: number
): number {
  const net = grossProfit - platformFees - packagingExpenses - operatingExpenses - laborExpenses;
  return Math.round(net * 100) / 100;
}

/**
 * Calculates bill financial totals including VAT and Service Charge.
 * Note: Net price excludes VAT and service charge.
 */
export function calculateBillTotals(
  items: BillItem[],
  discount: number,
  serviceChargePercent: number,
  vatPercent: number
): {
  subtotal: number;
  discountedSubtotal: number;
  serviceChargeAmount: number;
  vatAmount: number;
  total: number;
  totalFoodCost: number;
  netSales: number;
  grossProfit: number;
} {
  // 1. Subtotal is sum of all item total prices
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // 2. Total food cost from SAVED snapshots
  const totalFoodCost = items.reduce((sum, item) => sum + item.totalFoodCost, 0);

  // 3. Discount applied
  const safeDiscount = Math.min(discount, subtotal);
  const discountedSubtotal = Math.max(0, subtotal - safeDiscount);

  // 4. Service charge (applied on discounted subtotal)
  const serviceChargeAmount = Math.round((discountedSubtotal * (serviceChargePercent / 100)) * 100) / 100;

  // 5. VAT (applied on discounted subtotal + service charge)
  const taxableAmount = discountedSubtotal + serviceChargeAmount;
  const vatAmount = Math.round((taxableAmount * (vatPercent / 100)) * 100) / 100;

  // 6. Final grand total
  const total = Math.round((discountedSubtotal + serviceChargeAmount + vatAmount) * 100) / 100;

  // 7. Net sales (EXCLUDES VAT and Service Charge)
  const netSales = discountedSubtotal;

  // 8. Gross profit
  const grossProfit = Math.round((netSales - totalFoodCost) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountedSubtotal: Math.round(discountedSubtotal * 100) / 100,
    serviceChargeAmount,
    vatAmount,
    total,
    totalFoodCost: Math.round(totalFoodCost * 100) / 100,
    netSales,
    grossProfit,
  };
}

/**
 * Creates an immutable snapshot for a BillItem at point of sale.
 */
export function createBillItemSnapshot(
  dish: { id: string; nameTh: string; nameEn: string },
  variant: DishVariant,
  quantity: number,
  selectedOptionChoices: Array<{
    group: OptionGroup;
    choiceId: string;
  }>,
  ingredientsMap: Map<string, Ingredient>,
  subRecipesMap: Map<string, SubRecipe>,
  packagingMap: Map<string, PackagingItem>,
  notes?: string
): BillItem {
  // Current calculated variant cost at the instant of ordering
  const variantCost = calculateVariantCost(variant, ingredientsMap, subRecipesMap, packagingMap);

  const optionSnapshots = selectedOptionChoices.map(({ group, choiceId }) => {
    const choice = group.choices.find((c) => c.id === choiceId);
    const costDelta = choice ? calculateOptionChoiceCost(choice.costLines, ingredientsMap, packagingMap) : 0;
    return {
      groupId: group.id,
      choiceId,
      groupName: group.nameTh || group.nameEn,
      choiceName: choice ? (choice.nameTh || choice.nameEn) : 'Unknown',
      priceDelta: choice ? choice.priceDelta : 0,
      costDelta,
    };
  });

  const totalOptionsPriceDelta = optionSnapshots.reduce((acc, opt) => acc + opt.priceDelta, 0);
  const totalOptionsCostDelta = optionSnapshots.reduce((acc, opt) => acc + opt.costDelta, 0);

  const unitPrice = variant.price;
  const unitFoodCost = variantCost.foodCost;

  const itemUnitPriceWithOpts = unitPrice + totalOptionsPriceDelta;
  const itemUnitCostWithOpts = unitFoodCost + totalOptionsCostDelta;

  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
    dishId: dish.id,
    variantId: variant.id,
    dishNameTh: dish.nameTh,
    dishNameEn: dish.nameEn,
    variantNameTh: variant.nameTh,
    variantNameEn: variant.nameEn,
    unitPrice: itemUnitPriceWithOpts,
    unitFoodCost: itemUnitCostWithOpts,
    selectedOptions: optionSnapshots,
    quantity,
    totalPrice: Math.round(itemUnitPriceWithOpts * quantity * 100) / 100,
    totalFoodCost: Math.round(itemUnitCostWithOpts * quantity * 100) / 100,
    notes,
  };
}

/**
 * Generates human readable bill number BK-YYYYMMDD-XXXX
 */
export function formatBillNumber(dateStr: string, sequenceNumber: number): string {
  const cleanDate = dateStr.replace(/[^0-9]/g, '');
  const paddedSeq = String(sequenceNumber).padStart(4, '0');
  return `BK-${cleanDate}-${paddedSeq}`;
}
