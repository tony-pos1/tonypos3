/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Calculation Engine Test Suite
 * Validates user-specified core test cases and business calculations.
 */

import {
  calculateIngredientCostPerBaseUnit,
  calculateVariantCost,
  calculateSubRecipeCost,
  calculatePlatformFee,
  calculateNetProfit,
  calculateBillTotals,
  convertToBaseQuantity,
  createBillItemSnapshot,
  calculateSuggestedPrice,
} from './calculations';
import {
  Ingredient,
  SubRecipe,
  PackagingItem,
  DishVariant,
  SalesChannel,
  OptionGroup,
} from '../types/models';

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'recipe' | 'finance' | 'pos';
  passed: boolean;
  expected: Record<string, number | string>;
  actual: Record<string, number | string>;
  steps: string[];
}

export function runAllCalculationTests(): {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  results: TestCaseResult[];
} {
  const results: TestCaseResult[] = [];

  // ==========================================
  // TEST 1: The Exact Required User Spec Test
  // "pork 180 THB per 1 kg, yield 90%, a recipe using 100 g -> cost per g = 0.20 THB, recipe cost 20.00 THB; selling price 80 THB -> food cost 25.00%"
  // ==========================================
  {
    const purchasePrice = 180; // THB
    const purchaseQuantity = 1; // kg
    const purchaseUnit = 'kg';
    const yieldPercent = 90; // %
    const baseUnit = 'g';

    // 1. Calculate cost per base unit (g)
    const costPerG = calculateIngredientCostPerBaseUnit(
      purchasePrice,
      purchaseQuantity,
      purchaseUnit,
      yieldPercent,
      baseUnit
    );

    // 2. Mock ingredient in map
    const mockPork: Ingredient = {
      id: 'ing_pork_test',
      nameTh: 'เนื้อหมู',
      nameEn: 'Pork',
      category: 'Meat',
      purchaseUnit: 'kg',
      purchaseQuantity: 1,
      purchasePrice: 180,
      yieldPercent: 90,
      baseUnit: 'g',
      costPerBaseUnit: costPerG,
      priceHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    const ingredientsMap = new Map<string, Ingredient>([[mockPork.id, mockPork]]);
    const subRecipesMap = new Map<string, SubRecipe>();
    const packagingMap = new Map<string, PackagingItem>();

    // 3. Mock variant using 100g of pork, selling price 80 THB
    const mockVariant: DishVariant = {
      id: 'var_pork_skewers',
      nameTh: 'หมูปิ้งธรรมดา',
      nameEn: 'Regular Grilled Pork',
      price: 80,
      recipeLines: [
        {
          type: 'ingredient',
          itemId: mockPork.id,
          quantity: 100,
          unit: 'g',
        },
      ],
      packagingLines: [],
    };

    const variantCostResult = calculateVariantCost(
      mockVariant,
      ingredientsMap,
      subRecipesMap,
      packagingMap
    );

    const expectedCostPerG = 0.20;
    const expectedRecipeCost = 20.00;
    const expectedFoodCostPercent = 25.00;

    const costPerGPass = Math.abs(costPerG - expectedCostPerG) < 0.0001;
    const recipeCostPass = Math.abs(variantCostResult.recipeCost - expectedRecipeCost) < 0.01;
    const foodCostPercentPass = Math.abs(variantCostResult.foodCostPercent - expectedFoodCostPercent) < 0.01;

    results.push({
      id: 'test_user_spec_pork',
      name: 'User Spec: Pork 180 THB/kg (90% yield) -> 100g recipe (80 THB sale)',
      description: 'Pork 180 THB / 1 kg (90% yield) -> cost per g = 0.20 THB. Recipe using 100g -> 20.00 THB. Selling price 80 THB -> food cost 25.00%.',
      category: 'core',
      passed: costPerGPass && recipeCostPass && foodCostPercentPass,
      expected: {
        'Cost per gram': '0.20 THB/g',
        'Recipe cost (100g)': '20.00 THB',
        'Food cost %': '25.00%',
        'Gross profit': '60.00 THB',
      },
      actual: {
        'Cost per gram': `${costPerG.toFixed(2)} THB/g`,
        'Recipe cost (100g)': `${variantCostResult.recipeCost.toFixed(2)} THB`,
        'Food cost %': `${variantCostResult.foodCostPercent.toFixed(2)}%`,
        'Gross profit': `${variantCostResult.grossProfit.toFixed(2)} THB`,
      },
      steps: [
        '1. Convert 1 kg to base unit g: 1,000 g',
        '2. Apply 90% yield: 1,000 g * 0.90 = 900 g edible pork',
        '3. Cost per gram: 180 THB / 900 g = 0.20 THB/g',
        '4. Recipe line 100 g pork: 100 g * 0.20 THB/g = 20.00 THB',
        '5. Selling price: 80.00 THB (net, excluding VAT & service charge)',
        '6. Food Cost %: 20.00 / 80.00 * 100 = 25.00%',
        '7. Gross Profit: 80.00 - 20.00 = 60.00 THB',
      ],
    });
  }

  // ==========================================
  // TEST 2: Sub-Recipe Batch & Evaporation Yield
  // Sauce batch: 2 ingredients + 10% cooking reduction (90% yield)
  // ==========================================
  {
    const soySauce: Ingredient = {
      id: 'ing_soy_sauce',
      nameTh: 'ซีอิ๊วขาว',
      nameEn: 'Light Soy Sauce',
      category: 'Sauces',
      purchaseUnit: 'l',
      purchaseQuantity: 1,
      purchasePrice: 60, // 60 THB / 1000 ml = 0.06 THB/ml
      yieldPercent: 100,
      baseUnit: 'ml',
      costPerBaseUnit: 0.06,
      priceHistory: [],
      createdAt: '',
      updatedAt: '',
      version: 1,
    };

    const sugar: Ingredient = {
      id: 'ing_sugar',
      nameTh: 'น้ำตาลทราย',
      nameEn: 'Sugar',
      category: 'Dry Goods',
      purchaseUnit: 'kg',
      purchaseQuantity: 1,
      purchasePrice: 28, // 28 THB / 1000 g = 0.028 THB/g
      yieldPercent: 100,
      baseUnit: 'g',
      costPerBaseUnit: 0.028,
      priceHistory: [],
      createdAt: '',
      updatedAt: '',
      version: 1,
    };

    const ingredientsMap = new Map([
      [soySauce.id, soySauce],
      [sugar.id, sugar],
    ]);

    // Sub-recipe batch: 500ml soy sauce (30 THB) + 100g sugar (2.8 THB) = 32.8 THB
    // Batch output: 500 ml with 90% yield (450 ml yield)
    // Cost per ml = 32.8 / 450 = 0.072889 THB/ml
    const subRecipe: SubRecipe = {
      id: 'sub_teriyaki',
      nameTh: 'ซอสเทอริยากิโฮมเมด',
      nameEn: 'Homemade Teriyaki Sauce',
      recipeLines: [
        { type: 'ingredient', itemId: soySauce.id, quantity: 500, unit: 'ml' },
        { type: 'ingredient', itemId: sugar.id, quantity: 100, unit: 'g' },
      ],
      batchQuantity: 500,
      yieldPercent: 90,
      outputUnit: 'ml',
      costPerOutputUnit: 0,
      createdAt: '',
      updatedAt: '',
      version: 1,
    };

    const subCost = calculateSubRecipeCost(subRecipe, ingredientsMap, new Map());
    const expectedSubCost = 0.072889;
    const pass = Math.abs(subCost - expectedSubCost) < 0.001;

    results.push({
      id: 'test_sub_recipe_cost',
      name: 'Sub-Recipe: Teriyaki Sauce Batch Evaporation',
      description: '500ml soy sauce (30 THB) + 100g sugar (2.8 THB) in 500ml batch with 90% yield (450ml output)',
      category: 'recipe',
      passed: pass,
      expected: { 'Cost per ml': '0.0729 THB/ml' },
      actual: { 'Cost per ml': `${subCost.toFixed(4)} THB/ml` },
      steps: [
        '1. Soy sauce cost: 500 ml * 0.06 THB/ml = 30.00 THB',
        '2. Sugar cost: 100 g * 0.028 THB/g = 2.80 THB',
        '3. Total batch ingredient cost: 32.80 THB',
        '4. Effective batch volume: 500 ml * 90% = 450 ml',
        '5. Cost per output ml: 32.80 / 450 = 0.0729 THB/ml',
      ],
    });
  }

  // ==========================================
  // TEST 3: Dish Variant with Packaging & Option Cost
  // Recipe + PackagingItem + Net Selling Price
  // ==========================================
  {
    const box: PackagingItem = {
      id: 'pkg_kraft_box',
      name: 'Kraft Box 800ml',
      unitCost: 3.50,
      createdAt: '',
      updatedAt: '',
      version: 1,
    };

    const porkIng: Ingredient = {
      id: 'ing_pork_2',
      nameTh: 'เนื้อหมู',
      nameEn: 'Pork',
      category: 'Meat',
      purchaseUnit: 'kg',
      purchaseQuantity: 1,
      purchasePrice: 180,
      yieldPercent: 90,
      baseUnit: 'g',
      costPerBaseUnit: 0.20,
      priceHistory: [],
      createdAt: '',
      updatedAt: '',
      version: 1,
    };

    const ingredientsMap = new Map([[porkIng.id, porkIng]]);
    const packagingMap = new Map([[box.id, box]]);

    const variant: DishVariant = {
      id: 'var_box_set',
      nameTh: 'ข้าวหมูปิ้งกล่อง',
      nameEn: 'Grilled Pork Bento',
      price: 120, // Net selling price
      recipeLines: [
        { type: 'ingredient', itemId: porkIng.id, quantity: 150, unit: 'g' }, // 150 * 0.20 = 30 THB
      ],
      packagingLines: [
        { packagingId: box.id, quantity: 1 }, // 3.50 THB
      ],
    };

    const costResult = calculateVariantCost(variant, ingredientsMap, new Map(), packagingMap);

    const expectedFoodCost = 33.50; // 30.00 + 3.50
    const expectedPercent = 27.92; // 33.50 / 120 * 100 = 27.9166% -> 27.92%
    const expectedProfit = 86.50; // 120 - 33.50

    const pass =
      Math.abs(costResult.foodCost - expectedFoodCost) < 0.01 &&
      Math.abs(costResult.foodCostPercent - expectedPercent) < 0.02 &&
      Math.abs(costResult.grossProfit - expectedProfit) < 0.01;

    results.push({
      id: 'test_variant_packaging',
      name: 'Dish Variant: Recipe Lines + Packaging Lines',
      description: '150g pork (30.00 THB) + Kraft Box (3.50 THB) = 33.50 THB. Selling price 120 THB.',
      category: 'recipe',
      passed: pass,
      expected: {
        'Total food cost': '33.50 THB',
        'Food cost %': '27.92%',
        'Gross profit': '86.50 THB',
      },
      actual: {
        'Total food cost': `${costResult.foodCost.toFixed(2)} THB`,
        'Food cost %': `${costResult.foodCostPercent.toFixed(2)}%`,
        'Gross profit': `${costResult.grossProfit.toFixed(2)} THB`,
      },
      steps: [
        '1. Recipe cost: 150 g * 0.20 THB/g = 30.00 THB',
        '2. Packaging cost: 1 box * 3.50 THB = 3.50 THB',
        '3. Dish variant food cost: 30.00 + 3.50 = 33.50 THB',
        '4. Food cost %: 33.50 / 120.00 * 100 = 27.92%',
        '5. Gross profit: 120.00 - 33.50 = 86.50 THB',
      ],
    });
  }

  // ==========================================
  // TEST 4: Platform Fee Calculation
  // Grab: 30% commission, 7% VAT on commission, 0% payment fee on 1,000 THB net sales
  // ==========================================
  {
    const grabChannel: SalesChannel = {
      id: 'ch_grab',
      type: 'grab',
      name: 'GrabFood',
      commissionPercent: 30,
      paymentFeePercent: 0,
      vatOnCommissionPercent: 7,
      packagingChargedToCustomer: false,
      active: true,
      createdAt: '',
      updatedAt: '',
      version: 1,
    };

    const netSales = 1000;
    const feeResult = calculatePlatformFee(netSales, grabChannel);

    // Commission = 300 THB
    // VAT on commission = 300 * 7% = 21 THB
    // Total platform fee = 321 THB
    const expectedFee = 321.00;
    const pass = Math.abs(feeResult.totalPlatformFee - expectedFee) < 0.01;

    results.push({
      id: 'test_platform_fee',
      name: 'Platform Fee: Delivery Commission + VAT on Commission',
      description: 'GrabFood 30% commission on 1,000 THB net sales + 7% VAT on commission (300 * 7% = 21 THB)',
      category: 'finance',
      passed: pass,
      expected: {
        'Commission (30%)': '300.00 THB',
        'VAT on Commission (7%)': '21.00 THB',
        'Total Platform Fee': '321.00 THB',
      },
      actual: {
        'Commission (30%)': `${feeResult.commissionAmount.toFixed(2)} THB`,
        'VAT on Commission (7%)': `${feeResult.vatOnCommission.toFixed(2)} THB`,
        'Total Platform Fee': `${feeResult.totalPlatformFee.toFixed(2)} THB`,
      },
      steps: [
        '1. Net sales: 1,000.00 THB',
        '2. Base commission (30%): 1,000 * 0.30 = 300.00 THB',
        '3. VAT on commission (7%): 300 * 0.07 = 21.00 THB',
        '4. Total platform fee: 300.00 + 21.00 = 321.00 THB',
      ],
    });
  }

  // ==========================================
  // TEST 5: Net Profit Formula
  // Net profit = gross profit - platform fees - packaging - expenses - labor
  // ==========================================
  {
    const grossProfit = 50000;
    const platformFees = 8000;
    const packagingExpenses = 2500;
    const operatingExpenses = 15000;
    const laborExpenses = 12000;

    const netProfit = calculateNetProfit(
      grossProfit,
      platformFees,
      packagingExpenses,
      operatingExpenses,
      laborExpenses
    );

    // 50,000 - 8,000 - 2,500 - 15,000 - 12,000 = 12,500 THB
    const expectedNetProfit = 12500;
    const pass = Math.abs(netProfit - expectedNetProfit) < 0.01;

    results.push({
      id: 'test_net_profit',
      name: 'Net Profit Engine: Gross Profit minus All Overhead Deductions',
      description: '50,000 Gross Profit - 8,000 Platform - 2,500 Packaging - 15,000 Expenses - 12,000 Labor = 12,500 THB',
      category: 'finance',
      passed: pass,
      expected: { 'Net Profit': '12,500.00 THB' },
      actual: { 'Net Profit': `${netProfit.toFixed(2)} THB` },
      steps: [
        '1. Gross profit: 50,000.00 THB',
        '2. Less platform fees: -8,000.00 THB',
        '3. Less packaging expenses: -2,500.00 THB',
        '4. Less operating expenses (rent, utilities): -15,000.00 THB',
        '5. Less labor wages: -12,000.00 THB',
        '6. Net profit: 12,500.00 THB',
      ],
    });
  }

  // ==========================================
  // TEST 6: Bill Item Snapshot Immutability
  // Cost is read from saved snapshot at point of sale, NEVER recomputed
  // ==========================================
  {
    const porkIng: Ingredient = {
      id: 'ing_pork_immut',
      nameTh: 'เนื้อหมู',
      nameEn: 'Pork',
      category: 'Meat',
      purchaseUnit: 'kg',
      purchaseQuantity: 1,
      purchasePrice: 180,
      yieldPercent: 90,
      baseUnit: 'g',
      costPerBaseUnit: 0.20,
      priceHistory: [],
      createdAt: '',
      updatedAt: '',
      version: 1,
    };

    const variant: DishVariant = {
      id: 'var_test_snapshot',
      nameTh: 'หมูย่าง',
      nameEn: 'Grilled Pork',
      price: 100,
      recipeLines: [{ type: 'ingredient', itemId: porkIng.id, quantity: 100, unit: 'g' }],
      packagingLines: [],
    };

    // 1. Create snapshot when pork cost is 0.20 THB/g -> unitFoodCost = 20.00 THB
    const billItem = createBillItemSnapshot(
      { id: 'dish_1', nameTh: 'หมูย่าง', nameEn: 'Grilled Pork' },
      variant,
      2,
      [],
      new Map([[porkIng.id, porkIng]]),
      new Map(),
      new Map()
    );

    // 2. Simulate ingredient price inflation later (pork doubles to 360 THB/kg -> 0.40 THB/g)
    porkIng.purchasePrice = 360;
    porkIng.costPerBaseUnit = 0.40;

    // 3. Verify bill item's unitFoodCost and totalFoodCost remain identical to the sale-time snapshot
    const pass =
      billItem.unitFoodCost === 20.00 &&
      billItem.totalFoodCost === 40.00 &&
      billItem.totalPrice === 200.00;

    results.push({
      id: 'test_snapshot_immutability',
      name: 'POS Snapshot Immutability: Historical Cost Isolation',
      description: 'Ingredient price doubles from 180 to 360 THB after sale; historical bill item food cost remains fixed at 20.00 THB/unit.',
      category: 'pos',
      passed: pass,
      expected: {
        'Historical item food cost': '20.00 THB',
        'Historical total food cost (qty 2)': '40.00 THB',
      },
      actual: {
        'Historical item food cost': `${billItem.unitFoodCost.toFixed(2)} THB`,
        'Historical total food cost (qty 2)': `${billItem.totalFoodCost.toFixed(2)} THB`,
      },
      steps: [
        '1. Bill item sold when pork cost was 0.20 THB/g (unit food cost = 20.00 THB)',
        '2. Ingredient purchase price subsequently inflated to 360 THB/kg (0.40 THB/g)',
        '3. Bill item preserves snapshot values without recomputing against current inventory price',
        '4. Verified: unitFoodCost = 20.00 THB, totalFoodCost = 40.00 THB',
      ],
    });
  }

  // ==========================================
  // TEST 7: Automatic Unit Conversion
  // kg -> g (1000x), l -> ml (1000x), cl -> ml (10x), piece (1x)
  // ==========================================
  {
    const kgToG = convertToBaseQuantity(2.5, 'kg', 'g'); // 2,500
    const lToMl = convertToBaseQuantity(1.75, 'l', 'ml'); // 1,750
    const clToMl = convertToBaseQuantity(25, 'cl', 'ml'); // 250
    const piece = convertToBaseQuantity(12, 'piece', 'piece'); // 12

    const pass = kgToG === 2500 && lToMl === 1750 && clToMl === 250 && piece === 12;

    results.push({
      id: 'test_unit_conversions',
      name: 'Unit Conversion Engine: Metric & Kitchen Standards',
      description: 'Validates 2.5 kg = 2,500 g, 1.75 L = 1,750 mL, 25 cL = 250 mL, and piece = piece',
      category: 'core',
      passed: pass,
      expected: {
        '2.5 kg': '2,500 g',
        '1.75 L': '1,750 ml',
        '25 cl': '250 ml',
      },
      actual: {
        '2.5 kg': `${kgToG} g`,
        '1.75 L': `${lToMl} ml`,
        '25 cl': `${clToMl} ml`,
      },
      steps: [
        '1. 2.5 kg * 1,000 = 2,500 g',
        '2. 1.75 L * 1,000 = 1,750 mL',
        '3. 25 cL * 10 = 250 mL',
        '4. Unit conversions match standard culinary formulas',
      ],
    });
  }

  // ==========================================
  // TEST 8: Step 2 Rule - Suggested Price & No Recipe Linked
  // Food cost 24.00 THB with 30% target food cost -> suggested price = 80.00 THB.
  // Dish with 0 recipe lines -> hasRecipe = false ("No recipe linked").
  // ==========================================
  {
    const foodCost = 24.00;
    const targetPercent = 30; // 30%
    const suggestedPrice = calculateSuggestedPrice(foodCost, targetPercent);
    // 24 / 0.30 = 80.00 THB

    const unlinkedVariant: DishVariant = {
      id: 'var_unlinked',
      nameTh: 'เมนูยังไม่ผูกสูตร',
      nameEn: 'Unlinked Menu',
      price: 100,
      recipeLines: [],
      packagingLines: [],
    };

    const costMetrics = calculateVariantCost(
      unlinkedVariant,
      new Map(),
      new Map(),
      new Map(),
      targetPercent
    );

    const pass =
      Math.abs(suggestedPrice - 80.00) < 0.01 &&
      costMetrics.hasRecipe === false &&
      costMetrics.foodCost === 0;

    results.push({
      id: 'test_suggested_price_unlinked',
      name: 'Step 2: Suggested Price & Unlinked Recipe Rule',
      description: '24 THB food cost at 30% target -> 80.00 THB suggested price. Empty recipe variant -> hasRecipe is false ("No recipe linked").',
      category: 'recipe',
      passed: pass,
      expected: {
        'Suggested Price (24 THB / 30%)': '80.00 THB',
        'Empty Recipe Status': 'No recipe linked',
      },
      actual: {
        'Suggested Price (24 THB / 30%)': `${suggestedPrice.toFixed(2)} THB`,
        'Empty Recipe Status': costMetrics.hasRecipe ? 'Has recipe' : 'No recipe linked',
      },
      steps: [
        '1. Suggested price formula: foodCost / (targetFoodCostPercent / 100)',
        '2. 24.00 THB / 0.30 = 80.00 THB suggested price',
        '3. Verified variant with empty recipeLines has hasRecipe = false, ensuring no made-up cost is ever displayed',
      ],
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  return {
    allPassed: passedCount === results.length,
    passedCount,
    totalCount: results.length,
    results,
  };
}
