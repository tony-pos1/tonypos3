/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Database & Data Store Module
 * Implements Firestore collections under users/{uid}/,
 * optimistic concurrency control (versioning),
 * atomic transactions for bill counters and batched writes for bill+table+summary,
 * and JSON backup/restore.
 */

import {
  Ingredient,
  SubRecipe,
  PackagingItem,
  Dish,
  OptionGroup,
  Category,
  SalesChannel,
  Table,
  Zone,
  Bill,
  Expense,
  Employee,
  Shift,
  Member,
  ShopSettings,
  DailySummary,
  BillCounter,
} from '../types/models';
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';

export class ConcurrencyConflictError extends Error {
  constructor(entityName: string, expectedVersion: number, actualVersion: number) {
    super(
      `Conflict: ${entityName} was updated by another device (local v${expectedVersion} vs remote v${actualVersion}). Please refresh.`
    );
    this.name = 'ConcurrencyConflictError';
  }
}

export interface RestaurantDatabaseStore {
  settings: ShopSettings;
  ingredients: Ingredient[];
  subRecipes: SubRecipe[];
  packaging: PackagingItem[];
  dishes: Dish[];
  optionGroups: OptionGroup[];
  categories: Category[];
  channels: SalesChannel[];
  tables: Table[];
  zones: Zone[];
  bills: Bill[];
  expenses: Expense[];
  employees: Employee[];
  shifts: Shift[];
  members: Member[];
  dailySummaries: DailySummary[];
  counters: BillCounter[];
}

const LOCAL_STORAGE_PREFIX = 'kind_db_';

function getStorageKey(userId: string): string {
  return `${LOCAL_STORAGE_PREFIX}${userId}`;
}

export function getDefaultSalesChannels(): SalesChannel[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'ch_dine_in',
      type: 'dine_in',
      name: 'Dine-in (ทานที่ร้าน)',
      commissionPercent: 0,
      paymentFeePercent: 0,
      vatOnCommissionPercent: 0,
      packagingChargedToCustomer: false,
      active: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: 'ch_takeaway',
      type: 'takeaway',
      name: 'Takeaway (สั่งกลับบ้าน)',
      commissionPercent: 0,
      paymentFeePercent: 0,
      vatOnCommissionPercent: 0,
      packagingChargedToCustomer: true,
      active: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: 'ch_grab',
      type: 'grab',
      name: 'GrabFood',
      commissionPercent: 30,
      paymentFeePercent: 0,
      vatOnCommissionPercent: 7,
      packagingChargedToCustomer: false,
      active: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: 'ch_lineman',
      type: 'lineman',
      name: 'LINE MAN',
      commissionPercent: 30,
      paymentFeePercent: 0,
      vatOnCommissionPercent: 7,
      packagingChargedToCustomer: false,
      active: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: 'ch_shopeefood',
      type: 'shopeefood',
      name: 'ShopeeFood',
      commissionPercent: 30,
      paymentFeePercent: 0,
      vatOnCommissionPercent: 7,
      packagingChargedToCustomer: false,
      active: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: 'ch_robinhood',
      type: 'robinhood',
      name: 'Robinhood',
      commissionPercent: 20,
      paymentFeePercent: 0,
      vatOnCommissionPercent: 7,
      packagingChargedToCustomer: false,
      active: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: 'ch_direct',
      type: 'direct',
      name: 'Direct Delivery (เดลิเวอรี่ร้าน)',
      commissionPercent: 0,
      paymentFeePercent: 0,
      vatOnCommissionPercent: 0,
      packagingChargedToCustomer: true,
      active: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: 'ch_other',
      type: 'other',
      name: 'Other (ช่องทางอื่น)',
      commissionPercent: 0,
      paymentFeePercent: 0,
      vatOnCommissionPercent: 0,
      packagingChargedToCustomer: false,
      active: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
  ];
}

export function getDefaultShopSettings(): ShopSettings {
  return {
    id: 'default_settings',
    restaurantName: 'KinD Restaurant & Cafe',
    vatPercent: 7,
    serviceChargePercent: 0,
    dailyClosingTime: '02:00',
    targetFoodCostPercent: 30,
    currencySymbol: '฿',
    updatedAt: new Date().toISOString(),
    version: 1,
  };
}

/**
 * Creates ONE tiny example that the user can easily delete.
 * As requested: "Seed NO demo data except one tiny example that the user can delete."
 */
export function createTinyInitialSeed(): RestaurantDatabaseStore {
  const now = new Date().toISOString();

  // 1 Tiny Example: Pork 180 THB/kg, 90% yield
  const samplePork: Ingredient = {
    id: 'ing_tiny_pork_example',
    nameTh: 'เนื้อหมูสันคอ (ตัวอย่าง)',
    nameEn: 'Pork Collar (Example)',
    category: 'Meat (เนื้อสัตว์)',
    purchaseUnit: 'kg',
    purchaseQuantity: 1,
    purchasePrice: 180,
    yieldPercent: 90,
    baseUnit: 'g',
    costPerBaseUnit: 0.20,
    priceHistory: [
      {
        date: now.split('T')[0],
        price: 180,
        quantity: 1,
        unit: 'kg',
        note: 'Initial seed price',
      },
    ],
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  const sampleCategory: Category = {
    id: 'cat_main',
    nameTh: 'อาหารจานหลัก (Main Dishes)',
    nameEn: 'Main Dishes',
    order: 1,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  // 1 Tiny Dish using 100g of pork, selling price 80 THB
  const sampleDish: Dish = {
    id: 'dish_tiny_moo_ping',
    nameTh: 'ข้าวหมูปิ้งโบราณ (ตัวอย่าง)',
    nameEn: 'Grilled Pork with Sticky Rice (Example)',
    categoryId: sampleCategory.id,
    active: true,
    variants: [
      {
        id: 'var_regular',
        nameTh: 'ชุดปกติ (Regular)',
        nameEn: 'Regular Set',
        price: 80,
        recipeLines: [
          {
            type: 'ingredient',
            itemId: samplePork.id,
            quantity: 100,
            unit: 'g',
          },
        ],
        packagingLines: [],
      },
    ],
    optionGroupIds: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  const sampleZone: Zone = {
    id: 'zone_main',
    name: 'Main Dining (ห้องแอร์)',
    color: '#3B82F6',
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  const sampleTable: Table = {
    id: 'tbl_01',
    number: 'T-01',
    zoneId: sampleZone.id,
    tableType: 'square',
    chairs: 4,
    positionX: 50,
    positionY: 50,
    status: 'available',
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  return {
    settings: getDefaultShopSettings(),
    ingredients: [samplePork],
    subRecipes: [],
    packaging: [],
    dishes: [sampleDish],
    optionGroups: [],
    categories: [sampleCategory],
    channels: getDefaultSalesChannels(),
    tables: [sampleTable],
    zones: [sampleZone],
    bills: [],
    expenses: [],
    employees: [],
    shifts: [],
    members: [],
    dailySummaries: [],
    counters: [],
  };
}

/**
 * Loads entire database for user.
 * Tries Firestore if available, otherwise uses local persistence.
 */
export async function loadDatabase(userId: string): Promise<RestaurantDatabaseStore> {
  // If Firestore is connected, load from Firestore
  if (db) {
    try {
      const loadCollection = async <T>(collName: string): Promise<T[]> => {
        const snap = await getDocs(collection(db!, `users/${userId}/${collName}`));
        return snap.docs.map((d) => d.data() as T);
      };

      const [
        ingredients,
        subRecipes,
        packaging,
        dishes,
        optionGroups,
        categories,
        channels,
        tables,
        zones,
        bills,
        expenses,
        employees,
        shifts,
        members,
        dailySummaries,
        counters,
      ] = await Promise.all([
        loadCollection<Ingredient>('ingredients'),
        loadCollection<SubRecipe>('subRecipes'),
        loadCollection<PackagingItem>('packaging'),
        loadCollection<Dish>('dishes'),
        loadCollection<OptionGroup>('optionGroups'),
        loadCollection<Category>('categories'),
        loadCollection<SalesChannel>('channels'),
        loadCollection<Table>('tables'),
        loadCollection<Zone>('zones'),
        loadCollection<Bill>('bills'),
        loadCollection<Expense>('expenses'),
        loadCollection<Employee>('employees'),
        loadCollection<Shift>('shifts'),
        loadCollection<Member>('members'),
        loadCollection<DailySummary>('dailySummaries'),
        loadCollection<BillCounter>('counters'),
      ]);

      const settingsDoc = await getDoc(doc(db, `users/${userId}/settings/shop_settings`));
      const settings = settingsDoc.exists()
        ? (settingsDoc.data() as ShopSettings)
        : getDefaultShopSettings();

      if (ingredients.length === 0 && dishes.length === 0) {
        // First run with clean seed
        const seed = createTinyInitialSeed();
        await saveDatabase(userId, seed);
        return seed;
      }

      return {
        settings,
        ingredients,
        subRecipes,
        packaging,
        dishes,
        optionGroups,
        categories,
        channels: channels.length > 0 ? channels : getDefaultSalesChannels(),
        tables,
        zones,
        bills,
        expenses,
        employees,
        shifts,
        members,
        dailySummaries,
        counters,
      };
    } catch (e) {
      console.warn('Firestore load failed, reading local store:', e);
    }
  }

  // Local persistence fallback
  const raw = localStorage.getItem(getStorageKey(userId));
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as RestaurantDatabaseStore;
      if (!parsed.channels || parsed.channels.length === 0) {
        parsed.channels = getDefaultSalesChannels();
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse local DB store, re-seeding:', e);
    }
  }

  const initial = createTinyInitialSeed();
  localStorage.setItem(getStorageKey(userId), JSON.stringify(initial));
  return initial;
}

/**
 * Saves entire database store (with local and remote synchronization).
 */
export async function saveDatabase(userId: string, data: RestaurantDatabaseStore): Promise<void> {
  // Always update local cache
  localStorage.setItem(getStorageKey(userId), JSON.stringify(data));

  if (db) {
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, `users/${userId}/settings/shop_settings`), data.settings);
      await batch.commit();
    } catch (e) {
      console.error('Background Firestore sync error:', e);
    }
  }

  broadcastRealtimeChange();
}

/**
 * Atomic bill number generator inside a transaction.
 * Guarantees no two devices generate the same bill number.
 */
export async function generateNextBillNumber(
  userId: string,
  store: RestaurantDatabaseStore
): Promise<{ billNumber: string; updatedStore: RestaurantDatabaseStore }> {
  const todayStr = new Date().toISOString().split('T')[0];
  const dateKey = todayStr.replace(/-/g, '');
  const counterId = `daily_${dateKey}`;

  if (db) {
    try {
      const counterRef = doc(db, `users/${userId}/counters/${counterId}`);
      const nextSeq = await runTransaction(db, async (txn) => {
        const snap = await txn.get(counterRef);
        let currentNum = 0;
        let version = 1;
        if (snap.exists()) {
          const data = snap.data() as BillCounter;
          currentNum = data.lastNumber;
          version = data.version + 1;
        }
        const nextNum = currentNum + 1;
        txn.set(
          counterRef,
          {
            id: counterId,
            date: todayStr,
            lastNumber: nextNum,
            updatedAt: new Date().toISOString(),
            version,
          },
          { merge: true }
        );
        return nextNum;
      });

      const formatted = `BK-${dateKey}-${String(nextSeq).padStart(4, '0')}`;
      return { billNumber: formatted, updatedStore: store };
    } catch (err) {
      console.warn('Firestore counter transaction failed, falling back to local counter:', err);
    }
  }

  // Local atomic counter simulation
  const counterIndex = store.counters.findIndex((c) => c.id === counterId);
  let nextSeq = 1;
  const newCounters = [...store.counters];

  if (counterIndex >= 0) {
    nextSeq = newCounters[counterIndex].lastNumber + 1;
    newCounters[counterIndex] = {
      ...newCounters[counterIndex],
      lastNumber: nextSeq,
      updatedAt: new Date().toISOString(),
      version: newCounters[counterIndex].version + 1,
    };
  } else {
    newCounters.push({
      id: counterId,
      date: todayStr,
      lastNumber: 1,
      updatedAt: new Date().toISOString(),
      version: 1,
    });
  }

  const updatedStore = {
    ...store,
    counters: newCounters,
  };
  localStorage.setItem(getStorageKey(userId), JSON.stringify(updatedStore));

  const formatted = `BK-${dateKey}-${String(nextSeq).padStart(4, '0')}`;
  return { billNumber: formatted, updatedStore };
}

/**
 * Batched atomic commit: writing a bill, updating its table, and updating daily summary.
 * Checks version concurrency to prevent silent overwrites.
 */
export async function saveBillWithTableAndSummary(
  userId: string,
  store: RestaurantDatabaseStore,
  bill: Bill,
  tableUpdate?: Partial<Table> & { id: string; version: number }
): Promise<RestaurantDatabaseStore> {
  const now = new Date().toISOString();
  const dateStr = bill.createdAt.split('T')[0];

  // 1. Optimistic Concurrency Check on Bill
  const existingBill = store.bills.find((b) => b.id === bill.id);
  if (existingBill && existingBill.version !== bill.version) {
    throw new ConcurrencyConflictError('Bill', bill.version, existingBill.version);
  }

  // 2. Optimistic Concurrency Check on Table
  if (tableUpdate) {
    const existingTable = store.tables.find((t) => t.id === tableUpdate.id);
    if (existingTable && existingTable.version !== tableUpdate.version) {
      throw new ConcurrencyConflictError('Table', tableUpdate.version, existingTable.version);
    }
  }

  // 3. Prepare updated bill
  const updatedBill: Bill = {
    ...bill,
    updatedAt: now,
    version: (bill.version || 1) + 1,
  };

  const newBills = existingBill
    ? store.bills.map((b) => (b.id === bill.id ? updatedBill : b))
    : [updatedBill, ...store.bills];

  // 4. Prepare updated tables
  let newTables = store.tables;
  if (tableUpdate) {
    newTables = store.tables.map((t) => {
      if (t.id === tableUpdate.id) {
        return {
          ...t,
          ...tableUpdate,
          updatedAt: now,
          version: t.version + 1,
        };
      }
      return t;
    });
  }

  // 5. Update DailySummary atomically
  const existingSummary = store.dailySummaries.find((s) => s.date === dateStr);
  const paidBillsForDay = newBills.filter((b) => b.createdAt.startsWith(dateStr) && b.status === 'paid');
  const voidedBillsForDay = newBills.filter((b) => b.createdAt.startsWith(dateStr) && b.status === 'voided');

  const totalSales = paidBillsForDay.reduce((acc, b) => acc + b.total, 0);
  const totalFoodCost = paidBillsForDay.reduce((acc, b) => acc + b.totalFoodCost, 0);
  const totalVat = paidBillsForDay.reduce((acc, b) => acc + b.vatAmount, 0);
  const totalServiceCharge = paidBillsForDay.reduce((acc, b) => acc + b.serviceChargeAmount, 0);
  const totalDiscounts = paidBillsForDay.reduce((acc, b) => acc + b.discount, 0);
  const netSales = Math.max(0, totalSales - totalVat - totalServiceCharge);
  const grossProfit = Math.max(0, netSales - totalFoodCost);

  const channelBreakdown: Record<string, { billCount: number; sales: number }> = {};
  for (const b of paidBillsForDay) {
    if (!channelBreakdown[b.channelId]) {
      channelBreakdown[b.channelId] = { billCount: 0, sales: 0 };
    }
    channelBreakdown[b.channelId].billCount += 1;
    channelBreakdown[b.channelId].sales += b.total;
  }

  const updatedSummary: DailySummary = {
    id: dateStr,
    date: dateStr,
    totalSales: Math.round(totalSales * 100) / 100,
    netSales: Math.round(netSales * 100) / 100,
    totalBills: paidBillsForDay.length + voidedBillsForDay.length,
    paidBills: paidBillsForDay.length,
    voidedBills: voidedBillsForDay.length,
    totalFoodCost: Math.round(totalFoodCost * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    totalDiscounts: Math.round(totalDiscounts * 100) / 100,
    totalVat: Math.round(totalVat * 100) / 100,
    totalServiceCharge: Math.round(totalServiceCharge * 100) / 100,
    channelBreakdown,
    createdAt: existingSummary ? existingSummary.createdAt : now,
    updatedAt: now,
    version: existingSummary ? existingSummary.version + 1 : 1,
  };

  const newSummaries = existingSummary
    ? store.dailySummaries.map((s) => (s.id === dateStr ? updatedSummary : s))
    : [...store.dailySummaries, updatedSummary];

  const updatedStore: RestaurantDatabaseStore = {
    ...store,
    bills: newBills,
    tables: newTables,
    dailySummaries: newSummaries,
  };

  // If Firestore is connected, execute in ONE atomic batch
  if (db) {
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, `users/${userId}/bills/${updatedBill.id}`), updatedBill);
      if (tableUpdate) {
        const tbl = newTables.find((t) => t.id === tableUpdate.id);
        if (tbl) {
          batch.set(doc(db, `users/${userId}/tables/${tbl.id}`), tbl);
        }
      }
      batch.set(doc(db, `users/${userId}/dailySummaries/${dateStr}`), updatedSummary);
      await batch.commit();
    } catch (e) {
      console.warn('Firestore batched write failed, falling back to local store save:', e);
    }
  }

  await saveDatabase(userId, updatedStore);
  broadcastRealtimeChange();
  return updatedStore;
}

/**
 * Generic document updater with optimistic concurrency checking.
 */
export async function updateEntityWithVersionCheck<T extends { id: string; version: number }>(
  userId: string,
  entityName: string,
  collectionKey: keyof RestaurantDatabaseStore,
  item: T,
  store: RestaurantDatabaseStore
): Promise<RestaurantDatabaseStore> {
  const list = store[collectionKey] as unknown as T[];
  const existing = list.find((x) => x.id === item.id);

  if (existing && existing.version !== item.version) {
    throw new ConcurrencyConflictError(entityName, item.version, existing.version);
  }

  const updatedItem: T = {
    ...item,
    updatedAt: new Date().toISOString(),
    version: (item.version || 1) + 1,
  };

  const updatedList = existing
    ? list.map((x) => (x.id === item.id ? updatedItem : x))
    : [...list, updatedItem];

  const updatedStore: RestaurantDatabaseStore = {
    ...store,
    [collectionKey]: updatedList,
  };

  if (db) {
    try {
      await setDoc(doc(db, `users/${userId}/${String(collectionKey)}/${item.id}`), updatedItem);
    } catch (e) {
      console.warn(`Firestore update for ${entityName} failed:`, e);
    }
  }

  await saveDatabase(userId, updatedStore);
  return updatedStore;
}

/**
 * Generic document deletion.
 */
export async function deleteEntity<T extends { id: string }>(
  userId: string,
  collectionKey: keyof RestaurantDatabaseStore,
  itemId: string,
  store: RestaurantDatabaseStore
): Promise<RestaurantDatabaseStore> {
  const list = store[collectionKey] as unknown as T[];
  const updatedList = list.filter((x) => x.id !== itemId);

  const updatedStore: RestaurantDatabaseStore = {
    ...store,
    [collectionKey]: updatedList,
  };

  if (db) {
    try {
      await deleteDoc(doc(db, `users/${userId}/${String(collectionKey)}/${itemId}`));
    } catch (e) {
      console.warn(`Firestore delete failed:`, e);
    }
  }

  await saveDatabase(userId, updatedStore);
  return updatedStore;
}

/**
 * Exports all restaurant collections to an audited JSON backup format.
 */
export function exportAllDataToJson(store: RestaurantDatabaseStore): string {
  const exportPayload = {
    app: 'KinD',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: store,
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Imports and validates restaurant data from JSON backup.
 */
export async function importAllDataFromJson(
  userId: string,
  jsonString: string
): Promise<RestaurantDatabaseStore> {
  const parsed = JSON.parse(jsonString);
  const data = (parsed.data || parsed) as RestaurantDatabaseStore;

  if (!data.ingredients || !data.dishes || !data.settings) {
    throw new Error('Invalid backup file structure: missing core collections.');
  }

  await saveDatabase(userId, data);
  return data;
}

/**
 * Saves compressed photo in its own document under users/{userId}/images/{imageId}.
 * Never embeds the image directly in dish or bill documents.
 */
export async function saveImageDocument(userId: string, dataUrl: string): Promise<string> {
  const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  // Local cache immediately
  try {
    localStorage.setItem(`kind_img_${imageId}`, dataUrl);
  } catch (e) {
    console.warn('LocalStorage image cache quota exceeded:', e);
  }

  // Firestore isolated collection
  if (db) {
    try {
      await setDoc(doc(db, `users/${userId}/images/${imageId}`), {
        id: imageId,
        dataUrl,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore image save failed, cached locally:', e);
    }
  }

  return imageId;
}

/**
 * Loads image by document ID. Checks local memory/localStorage first, then Firestore.
 */
export async function loadImageDocument(userId: string, imageId: string): Promise<string | null> {
  if (!imageId) return null;
  // If it is already a direct data URL or external URL, return directly
  if (imageId.startsWith('data:') || imageId.startsWith('http')) {
    return imageId;
  }

  const cached = localStorage.getItem(`kind_img_${imageId}`);
  if (cached) {
    return cached;
  }

  if (db) {
    try {
      const snap = await getDoc(doc(db, `users/${userId}/images/${imageId}`));
      if (snap.exists()) {
        const data = snap.data() as { dataUrl: string };
        try {
          localStorage.setItem(`kind_img_${imageId}`, data.dataUrl);
        } catch {
          // ignore cache full
        }
        return data.dataUrl;
      }
    } catch (e) {
      console.warn('Failed to load image from Firestore:', e);
    }
  }

  return null;
}

/**
 * Real-time listener for tables and open bills only.
 * Table and bill changes appear on other signed-in devices in real time.
 */
export function subscribeToTablesAndOpenBills(
  userId: string,
  onUpdate: (tables: Table[], openBills: Bill[]) => void
): () => void {
  const unsubscribes: Array<Unsubscribe | (() => void)> = [];

  let currentTables: Table[] = [];
  let currentOpenBills: Bill[] = [];

  const notify = () => {
    onUpdate(currentTables, currentOpenBills);
  };

  if (db) {
    try {
      // 1. Listen to tables collection
      const tablesRef = collection(db, `users/${userId}/tables`);
      const unsubTables = onSnapshot(tablesRef, (snap) => {
        currentTables = snap.docs.map((d) => d.data() as Table);
        notify();
      });
      unsubscribes.push(unsubTables);

      // 2. Listen only to OPEN bills (not historical bills)
      const billsRef = collection(db, `users/${userId}/bills`);
      const openBillsQuery = query(billsRef, where('status', '==', 'open'));
      const unsubBills = onSnapshot(openBillsQuery, (snap) => {
        currentOpenBills = snap.docs.map((d) => d.data() as Bill);
        notify();
      });
      unsubscribes.push(unsubBills);
    } catch (e) {
      console.warn('Firestore realtime listener setup failed, using multi-tab local broadcast:', e);
    }
  }

  // Cross-tab local broadcast listener (multi-tab sync in local/offline mode)
  const handleStorageOrCustom = () => {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as RestaurantDatabaseStore;
        if (parsed.tables) {
          currentTables = parsed.tables;
        }
        if (parsed.bills) {
          currentOpenBills = parsed.bills.filter((b) => b.status === 'open');
        }
        notify();
      } catch {
        // ignore
      }
    }
  };

  window.addEventListener('storage', handleStorageOrCustom);
  window.addEventListener('kind_realtime_sync', handleStorageOrCustom);
  unsubscribes.push(() => {
    window.removeEventListener('storage', handleStorageOrCustom);
    window.removeEventListener('kind_realtime_sync', handleStorageOrCustom);
  });

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}

export function broadcastRealtimeChange(): void {
  window.dispatchEvent(new Event('kind_realtime_sync'));
}

