/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Restaurant POS & Food Cost Data Models
 */

export type BaseUnit = 'g' | 'ml' | 'piece';
export type PurchaseUnit = 'kg' | 'g' | 'l' | 'ml' | 'piece' | 'can' | 'bottle' | 'pack' | 'bag' | 'box';

export interface PriceHistoryEntry {
  date: string;
  price: number;
  quantity: number;
  unit: string;
  note?: string;
}

export interface Ingredient {
  id: string;
  nameTh: string;
  nameEn: string;
  category: string;
  purchaseUnit: PurchaseUnit | string;
  purchaseQuantity: number;
  purchasePrice: number; // in THB
  yieldPercent: number; // e.g. 90 for trimming loss, 240 for rice/noodle absorption
  baseUnit: BaseUnit;
  costPerBaseUnit: number; // calculated via calculations engine
  priceHistory: PriceHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface SubRecipeLine {
  type: 'ingredient' | 'subRecipe';
  itemId: string;
  quantity: number;
  unit: string;
}

export interface SubRecipe {
  id: string;
  nameTh: string;
  nameEn: string;
  recipeLines: SubRecipeLine[];
  batchQuantity: number;
  yieldPercent: number; // e.g. 85 for cooking evaporation
  outputUnit: string; // e.g. 'g', 'ml', 'portion'
  costPerOutputUnit: number; // calculated via calculations engine
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PackagingItem {
  id: string;
  name: string;
  unitCost: number; // THB per piece
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CostLine {
  type: 'ingredient' | 'packaging';
  itemId: string;
  quantity: number;
  unit: string;
}

export interface OptionChoice {
  id: string;
  nameTh: string;
  nameEn: string;
  priceDelta: number; // added to variant price
  costLines?: CostLine[]; // optional cost of ingredients or packaging
}

export interface OptionGroup {
  id: string;
  nameTh: string;
  nameEn: string;
  required: boolean;
  minChoices: number;
  maxChoices: number;
  choices: OptionChoice[];
  order: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface RecipeLine {
  type: 'ingredient' | 'subRecipe';
  itemId: string;
  quantity: number;
  unit: string;
}

export interface PackagingLine {
  packagingId: string;
  quantity: number;
}

export interface DishVariant {
  id: string;
  nameTh: string;
  nameEn: string;
  price: number; // selling price
  recipeLines: RecipeLine[];
  packagingLines: PackagingLine[];
  // Note: calculated fields are generated dynamically by the calculation engine
  calculatedFoodCost?: number;
  foodCostPercent?: number;
  grossProfit?: number;
}

export interface Dish {
  id: string;
  nameTh: string;
  nameEn: string;
  categoryId: string;
  photo?: string;
  active: boolean;
  variants: DishVariant[];
  optionGroupIds: string[]; // attached by reference
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Category {
  id: string;
  nameTh: string;
  nameEn: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export type SalesChannelType =
  | 'dine_in'
  | 'takeaway'
  | 'grab'
  | 'lineman'
  | 'shopeefood'
  | 'robinhood'
  | 'direct'
  | 'other';

export interface SalesChannel {
  id: string;
  type: SalesChannelType;
  name: string;
  commissionPercent: number; // e.g. 30% for Grab
  paymentFeePercent: number; // e.g. 3% for credit card
  vatOnCommissionPercent: number; // e.g. 7% VAT applied to commission
  packagingChargedToCustomer: boolean; // yes/no
  active: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface BillItemOptionSnapshot {
  groupId: string;
  choiceId: string;
  groupName: string;
  choiceName: string;
  priceDelta: number;
  costDelta: number;
}

export interface BillItem {
  id: string;
  dishId: string;
  variantId: string;
  dishNameTh: string;
  dishNameEn: string;
  variantNameTh: string;
  variantNameEn: string;
  unitPrice: number; // snapshot at sale time
  unitFoodCost: number; // snapshot at sale time
  selectedOptions: BillItemOptionSnapshot[];
  quantity: number;
  totalPrice: number; // (unitPrice + sum(options.priceDelta)) * quantity
  totalFoodCost: number; // (unitFoodCost + sum(options.costDelta)) * quantity
  notes?: string;
}

export interface BillPayment {
  id: string;
  method: 'cash' | 'qr' | 'card' | 'transfer';
  amount: number;
  timestamp: string;
  reference?: string;
}

export type BillStatus = 'open' | 'paid' | 'voided';

export interface Bill {
  id: string;
  billNumber: string; // e.g. BK-20261111-0001 generated sequentially inside transaction
  channelId: string;
  tableId?: string;
  tableName?: string;
  items: BillItem[];
  subtotal: number; // sum of item total prices
  discount: number; // in THB
  serviceChargePercent: number;
  serviceChargeAmount: number;
  vatPercent: number;
  vatAmount: number;
  total: number; // final amount to pay
  totalFoodCost: number; // sum of item total food costs (snapshots)
  payments: BillPayment[];
  status: BillStatus;
  guestCount?: number;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  voidedAt?: string;
  voidReason?: string;
  version: number;
}

export type TableType = 'square' | 'rect' | 'round' | 'bar';
export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface Table {
  id: string;
  number: string;
  zoneId: string;
  tableType: TableType;
  chairs: number;
  positionX: number;
  positionY: number;
  status: TableStatus;
  currentBillId?: string;
  currentBillNumber?: string;
  occupiedAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Zone {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export type ExpenseCategory =
  | 'food'
  | 'labor'
  | 'rent'
  | 'utilities'
  | 'marketing'
  | 'packaging'
  | 'maintenance'
  | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  wageType: 'hourly' | 'monthly';
  wageRate: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  startTime: string;
  endTime?: string;
  totalHours?: number;
  cashFloatStart: number;
  cashFloatEnd?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: string;
  totalSpent: number;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ShopSettings {
  id: string;
  restaurantName: string;
  vatPercent: number; // e.g. 7
  serviceChargePercent: number; // e.g. 10
  dailyClosingTime: string; // e.g. "02:00"
  targetFoodCostPercent: number; // e.g. 30
  uploadedQrImage?: string; // QR code image URL or base64
  currencySymbol: string; // e.g. "฿" or "THB"
  updatedAt: string;
  version: number;
}

export interface DailySummary {
  id: string; // YYYY-MM-DD
  date: string;
  totalSales: number;
  netSales: number; // excluding VAT & service charge
  totalBills: number;
  paidBills: number;
  voidedBills: number;
  totalFoodCost: number; // from snapshots
  grossProfit: number; // netSales - totalFoodCost
  totalDiscounts: number;
  totalVat: number;
  totalServiceCharge: number;
  channelBreakdown: Record<string, { billCount: number; sales: number }>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface BillCounter {
  id: string; // 'daily_YYYYMMDD'
  date: string;
  lastNumber: number;
  updatedAt: string;
  version: number;
}
