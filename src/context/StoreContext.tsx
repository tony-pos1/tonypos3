/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Shared Store Context
 * Single source of truth for the entire POS and Food Cost application.
 * Realtime table/open bill listeners, offline persistence, image document store, and POS cart session.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  RestaurantDatabaseStore,
  loadDatabase,
  saveDatabase,
  saveBillWithTableAndSummary,
  generateNextBillNumber,
  updateEntityWithVersionCheck,
  deleteEntity,
  exportAllDataToJson,
  importAllDataFromJson,
  createTinyInitialSeed,
  getDefaultSalesChannels,
  getDefaultShopSettings,
  saveImageDocument,
  loadImageDocument,
  subscribeToTablesAndOpenBills,
} from '../data/db';
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
  BillItem,
  BillPayment,
  Expense,
  Employee,
  Shift,
  Member,
  ShopSettings,
} from '../types/models';
import {
  signInWithGoogle as authSignInWithGoogle,
  signOutUser as authSignOutUser,
  subscribeToAuth,
} from '../data/firebase';
import {
  calculateIngredientCostPerBaseUnit,
  calculateSubRecipeCost,
  calculateBillTotals,
} from '../engine/calculations';
import {
  Language,
  TranslationKey,
  getLanguage,
  setLanguage as persistLanguage,
  t as translateHelper,
} from '../i18n/translations';

interface StoreContextType {
  user: User | null;
  authLoading: boolean;
  store: RestaurantDatabaseStore;
  loading: boolean;
  error: string | null;
  dismissError: () => void;

  // Bilingual i18n
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;

  // Sync / Online Status
  syncStatus: 'online' | 'offline' | 'syncing';

  // Lookup Maps
  ingredientsMap: Map<string, Ingredient>;
  subRecipesMap: Map<string, SubRecipe>;
  packagingMap: Map<string, PackagingItem>;
  optionGroupsMap: Map<string, OptionGroup>;
  categoriesMap: Map<string, Category>;
  channelsMap: Map<string, SalesChannel>;

  // Operations
  saveIngredient: (ingredient: Ingredient) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  saveSubRecipe: (subRecipe: SubRecipe) => Promise<void>;
  deleteSubRecipe: (id: string) => Promise<void>;
  savePackaging: (pkg: PackagingItem) => Promise<void>;
  deletePackaging: (id: string) => Promise<void>;
  saveDish: (dish: Dish) => Promise<void>;
  deleteDish: (id: string) => Promise<void>;
  saveOptionGroup: (group: OptionGroup) => Promise<void>;
  deleteOptionGroup: (id: string) => Promise<void>;
  reorderOptionGroups: (groups: OptionGroup[]) => Promise<void>;
  saveCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (categories: Category[]) => Promise<void>;
  saveSalesChannel: (channel: SalesChannel) => Promise<void>;
  saveTable: (table: Table) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  saveZone: (zone: Zone) => Promise<void>;
  deleteZone: (id: string) => Promise<void>;
  saveExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  saveEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  saveShift: (shift: Shift) => Promise<void>;
  saveMember: (member: Member) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  saveSettings: (settings: ShopSettings) => Promise<void>;
  commitBill: (bill: Bill, tableUpdate?: Partial<Table> & { id: string; version: number }) => Promise<void>;
  getNextBillNumber: () => Promise<string>;
  exportBackup: () => string;
  importBackup: (json: string) => Promise<void>;
  resetToEmptyStore: () => Promise<void>;
  seedTinyExample: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;

  // Image helpers
  saveImage: (dataUrl: string) => Promise<string>;
  loadImage: (imageId: string) => Promise<string | null>;

  // POS Selling Session & Cart State
  cartItems: BillItem[];
  activeChannelId: string;
  setActiveChannelId: (channelId: string) => void;
  activeTableId: string | null;
  setActiveTableId: (tableId: string | null) => void;
  activeBillId: string | null;
  activeBillNumber: string | null;
  guestCount: number;
  setGuestCount: (count: number) => void;
  cartDiscount: number;
  setCartDiscount: (discount: number) => void;
  addToCart: (item: BillItem) => void;
  updateCartItemQty: (itemId: string, delta: number) => void;
  removeCartItem: (itemId: string) => void;
  clearCart: () => void;
  loadTableOrder: (table: Table) => void;
  saveOrderToTable: (targetTableId: string, channelId?: string) => Promise<Bill>;
  saveTakeawayOrDeliveryOrder: (channelId: string) => Promise<Bill>;
  completePayment: (billId: string, payments: BillPayment[], discount?: number) => Promise<Bill>;
  voidBill: (billId: string, reason?: string) => Promise<void>;
}

const defaultEmptyStore: RestaurantDatabaseStore = {
  settings: getDefaultShopSettings(),
  ingredients: [],
  subRecipes: [],
  packaging: [],
  dishes: [],
  optionGroups: [],
  categories: [],
  channels: getDefaultSalesChannels(),
  tables: [],
  zones: [],
  bills: [],
  expenses: [],
  employees: [],
  shifts: [],
  members: [],
  dailySummaries: [],
  counters: [],
};

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [store, setStore] = useState<RestaurantDatabaseStore>(defaultEmptyStore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // i18n
  const [lang, setLangState] = useState<Language>(getLanguage());
  const setLang = useCallback((newLang: Language) => {
    persistLanguage(newLang);
    setLangState(newLang);
  }, []);
  const t = useCallback((key: TranslationKey) => translateHelper(key), []);

  // Online / Offline Status
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>(
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online'
  );

  useEffect(() => {
    const handleOnline = () => setSyncStatus('online');
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // POS Cart State
  const [cartItems, setCartItems] = useState<BillItem[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('ch_dine_in');
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [activeBillId, setActiveBillId] = useState<string | null>(null);
  const [activeBillNumber, setActiveBillNumber] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [cartDiscount, setCartDiscount] = useState<number>(0);

  const dismissError = useCallback(() => setError(null), []);
  const userId = user?.uid || 'guest_user';

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Reload initial data when user changes
  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;
    setLoading(true);

    loadDatabase(userId)
      .then((data) => {
        if (isMounted) {
          setStore(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load restaurant data.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId, authLoading]);

  // Real-time listener for tables and open bills
  useEffect(() => {
    if (authLoading) return;

    const unsubscribe = subscribeToTablesAndOpenBills(userId, (tables, openBills) => {
      setStore((prevStore) => {
        // Merge updated tables
        const updatedTables = tables.length > 0 ? tables : prevStore.tables;

        // Merge updated open bills into bills array
        const closedBills = prevStore.bills.filter((b) => b.status !== 'open');
        const updatedBills = [...openBills, ...closedBills];

        return {
          ...prevStore,
          tables: updatedTables,
          bills: updatedBills,
        };
      });
    });

    return () => unsubscribe();
  }, [userId, authLoading]);

  // Lookup Maps
  const ingredientsMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    store.ingredients.forEach((ing) => map.set(ing.id, ing));
    return map;
  }, [store.ingredients]);

  const subRecipesMap = useMemo(() => {
    const map = new Map<string, SubRecipe>();
    store.subRecipes.forEach((sub) => map.set(sub.id, sub));
    return map;
  }, [store.subRecipes]);

  const packagingMap = useMemo(() => {
    const map = new Map<string, PackagingItem>();
    store.packaging.forEach((pkg) => map.set(pkg.id, pkg));
    return map;
  }, [store.packaging]);

  const optionGroupsMap = useMemo(() => {
    const map = new Map<string, OptionGroup>();
    store.optionGroups.forEach((g) => map.set(g.id, g));
    return map;
  }, [store.optionGroups]);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, Category>();
    store.categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [store.categories]);

  const channelsMap = useMemo(() => {
    const map = new Map<string, SalesChannel>();
    store.channels.forEach((ch) => map.set(ch.id, ch));
    return map;
  }, [store.channels]);

  // Actions
  const saveIngredient = useCallback(
    async (item: Ingredient) => {
      try {
        const costPerBase = calculateIngredientCostPerBaseUnit(
          item.purchasePrice,
          item.purchaseQuantity,
          item.purchaseUnit,
          item.yieldPercent,
          item.baseUnit
        );
        const ingredientWithCost: Ingredient = {
          ...item,
          costPerBaseUnit: costPerBase,
        };

        const updated = await updateEntityWithVersionCheck(
          userId,
          'Ingredient',
          'ingredients',
          ingredientWithCost,
          store
        );
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating ingredient');
        throw e;
      }
    },
    [userId, store]
  );

  const deleteIngredient = useCallback(
    async (id: string) => {
      try {
        const updated = await deleteEntity(userId, 'ingredients', id, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting ingredient');
        throw e;
      }
    },
    [userId, store]
  );

  const saveSubRecipe = useCallback(
    async (item: SubRecipe) => {
      try {
        const costPerOutput = calculateSubRecipeCost(item, ingredientsMap, subRecipesMap);
        const subWithCost: SubRecipe = {
          ...item,
          costPerOutputUnit: costPerOutput,
        };
        const updated = await updateEntityWithVersionCheck(
          userId,
          'SubRecipe',
          'subRecipes',
          subWithCost,
          store
        );
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating sub-recipe');
        throw e;
      }
    },
    [userId, store, ingredientsMap, subRecipesMap]
  );

  const deleteSubRecipe = useCallback(
    async (id: string) => {
      try {
        const updated = await deleteEntity(userId, 'subRecipes', id, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting sub-recipe');
        throw e;
      }
    },
    [userId, store]
  );

  const savePackaging = useCallback(
    async (item: PackagingItem) => {
      try {
        const updated = await updateEntityWithVersionCheck(
          userId,
          'PackagingItem',
          'packaging',
          item,
          store
        );
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating packaging');
        throw e;
      }
    },
    [userId, store]
  );

  const deletePackaging = useCallback(
    async (id: string) => {
      try {
        const updated = await deleteEntity(userId, 'packaging', id, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting packaging');
        throw e;
      }
    },
    [userId, store]
  );

  const saveDish = useCallback(
    async (dish: Dish) => {
      try {
        const sanitizedVariants = dish.variants.map((v) => ({
          id: v.id,
          nameTh: v.nameTh,
          nameEn: v.nameEn,
          price: v.price,
          recipeLines: v.recipeLines,
          packagingLines: v.packagingLines,
        }));

        const cleanDish: Dish = {
          ...dish,
          variants: sanitizedVariants,
        };

        const updated = await updateEntityWithVersionCheck(userId, 'Dish', 'dishes', cleanDish, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating dish');
        throw e;
      }
    },
    [userId, store]
  );

  const deleteDish = useCallback(
    async (id: string) => {
      try {
        const updated = await deleteEntity(userId, 'dishes', id, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting dish');
        throw e;
      }
    },
    [userId, store]
  );

  const saveOptionGroup = useCallback(
    async (group: OptionGroup) => {
      try {
        const updated = await updateEntityWithVersionCheck(
          userId,
          'OptionGroup',
          'optionGroups',
          group,
          store
        );
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating option group');
        throw e;
      }
    },
    [userId, store]
  );

  const deleteOptionGroup = useCallback(
    async (id: string) => {
      try {
        const updated = await deleteEntity(userId, 'optionGroups', id, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting option group');
        throw e;
      }
    },
    [userId, store]
  );

  const reorderOptionGroups = useCallback(
    async (groups: OptionGroup[]) => {
      try {
        const reordered = groups.map((g, idx) => ({
          ...g,
          order: idx + 1,
          updatedAt: new Date().toISOString(),
          version: g.version + 1,
        }));
        const updatedStore = {
          ...store,
          optionGroups: reordered,
        };
        await saveDatabase(userId, updatedStore);
        setStore(updatedStore);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error reordering option groups');
        throw e;
      }
    },
    [userId, store]
  );

  const saveCategory = useCallback(
    async (category: Category) => {
      try {
        const updated = await updateEntityWithVersionCheck(
          userId,
          'Category',
          'categories',
          category,
          store
        );
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating category');
        throw e;
      }
    },
    [userId, store]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        const updated = await deleteEntity(userId, 'categories', id, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting category');
        throw e;
      }
    },
    [userId, store]
  );

  const reorderCategories = useCallback(
    async (categories: Category[]) => {
      try {
        const reordered = categories.map((c, idx) => ({
          ...c,
          order: idx + 1,
          updatedAt: new Date().toISOString(),
          version: c.version + 1,
        }));
        const updatedStore = {
          ...store,
          categories: reordered,
        };
        await saveDatabase(userId, updatedStore);
        setStore(updatedStore);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error reordering categories');
        throw e;
      }
    },
    [userId, store]
  );

  const saveSalesChannel = useCallback(
    async (channel: SalesChannel) => {
      try {
        const updated = await updateEntityWithVersionCheck(
          userId,
          'SalesChannel',
          'channels',
          channel,
          store
        );
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating sales channel');
        throw e;
      }
    },
    [userId, store]
  );

  const saveTable = useCallback(
    async (table: Table) => {
      try {
        const updated = await updateEntityWithVersionCheck(userId, 'Table', 'tables', table, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating table');
        throw e;
      }
    },
    [userId, store]
  );

  const deleteTable = useCallback(
    async (id: string) => {
      try {
        const updated = await deleteEntity(userId, 'tables', id, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting table');
        throw e;
      }
    },
    [userId, store]
  );

  const saveZone = useCallback(
    async (zone: Zone) => {
      try {
        const updated = await updateEntityWithVersionCheck(userId, 'Zone', 'zones', zone, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating zone');
        throw e;
      }
    },
    [userId, store]
  );

  const deleteZone = useCallback(
    async (id: string) => {
      try {
        const updated = await deleteEntity(userId, 'zones', id, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting zone');
        throw e;
      }
    },
    [userId, store]
  );

  const saveExpense = useCallback(
    async (expense: Expense) => {
      try {
        const updated = await updateEntityWithVersionCheck(userId, 'Expense', 'expenses', expense, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating expense');
        throw e;
      }
    },
    [userId, store]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      try {
        const updated = await deleteEntity(userId, 'expenses', id, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting expense');
        throw e;
      }
    },
    [userId, store]
  );

  const saveEmployee = useCallback(
    async (employee: Employee) => {
      try {
        const updated = await updateEntityWithVersionCheck(
          userId,
          'Employee',
          'employees',
          employee,
          store
        );
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating employee');
        throw e;
      }
    },
    [userId, store]
  );

  const deleteEmployee = useCallback(
    async (id: string) => {
      try {
        const updated = await deleteEntity(userId, 'employees', id, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting employee');
        throw e;
      }
    },
    [userId, store]
  );

  const saveShift = useCallback(
    async (shift: Shift) => {
      try {
        const updated = await updateEntityWithVersionCheck(userId, 'Shift', 'shifts', shift, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating shift');
        throw e;
      }
    },
    [userId, store]
  );

  const saveMember = useCallback(
    async (member: Member) => {
      try {
        const updated = await updateEntityWithVersionCheck(userId, 'Member', 'members', member, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating member');
        throw e;
      }
    },
    [userId, store]
  );

  const deleteMember = useCallback(
    async (id: string) => {
      try {
        const updated = await deleteEntity(userId, 'members', id, store);
        setStore(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting member');
        throw e;
      }
    },
    [userId, store]
  );

  const saveSettings = useCallback(
    async (settings: ShopSettings) => {
      try {
        const updatedStore = {
          ...store,
          settings: {
            ...settings,
            updatedAt: new Date().toISOString(),
            version: (settings.version || 1) + 1,
          },
        };
        await saveDatabase(userId, updatedStore);
        setStore(updatedStore);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating shop settings');
        throw e;
      }
    },
    [userId, store]
  );

  const commitBill = useCallback(
    async (bill: Bill, tableUpdate?: Partial<Table> & { id: string; version: number }) => {
      try {
        setSyncStatus('syncing');
        const updatedStore = await saveBillWithTableAndSummary(userId, store, bill, tableUpdate);
        setStore(updatedStore);
        setSyncStatus('online');
      } catch (e) {
        setSyncStatus('offline');
        setError(e instanceof Error ? e.message : 'Error saving bill');
        throw e;
      }
    },
    [userId, store]
  );

  const getNextBillNumber = useCallback(async () => {
    try {
      const result = await generateNextBillNumber(userId, store);
      setStore(result.updatedStore);
      return result.billNumber;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generating bill number');
      throw e;
    }
  }, [userId, store]);

  const exportBackup = useCallback(() => {
    return exportAllDataToJson(store);
  }, [store]);

  const importBackup = useCallback(
    async (json: string) => {
      try {
        const imported = await importAllDataFromJson(userId, json);
        setStore(imported);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error importing backup JSON');
        throw e;
      }
    },
    [userId]
  );

  const resetToEmptyStore = useCallback(async () => {
    const empty: RestaurantDatabaseStore = {
      ...defaultEmptyStore,
      settings: getDefaultShopSettings(),
      channels: getDefaultSalesChannels(),
    };
    await saveDatabase(userId, empty);
    setStore(empty);
  }, [userId]);

  const seedTinyExample = useCallback(async () => {
    const tiny = createTinyInitialSeed();
    await saveDatabase(userId, tiny);
    setStore(tiny);
  }, [userId]);

  const signIn = useCallback(async () => {
    try {
      const signedIn = await authSignInWithGoogle();
      setUser(signedIn);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authSignOutUser();
      setUser(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-out failed');
    }
  }, []);

  // Image helpers
  const saveImage = useCallback(
    async (dataUrl: string) => {
      return saveImageDocument(userId, dataUrl);
    },
    [userId]
  );

  const loadImage = useCallback(
    async (imageId: string) => {
      return loadImageDocument(userId, imageId);
    },
    [userId]
  );

  // POS Cart Management
  const addToCart = useCallback((item: BillItem) => {
    setCartItems((prev) => {
      // Check if identical item (same dishId, variantId, selected options and notes) already exists
      const existingIndex = prev.findIndex(
        (i) =>
          i.dishId === item.dishId &&
          i.variantId === item.variantId &&
          (i.notes || '') === (item.notes || '') &&
          JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions)
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + item.quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: Math.round(existing.unitPrice * newQty * 100) / 100,
          totalFoodCost: Math.round(existing.unitFoodCost * newQty * 100) / 100,
        };
        return updated;
      }

      return [...prev, item];
    });
  }, []);

  const updateCartItemQty = useCallback((itemId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: Math.round(item.unitPrice * newQty * 100) / 100,
              totalFoodCost: Math.round(item.unitFoodCost * newQty * 100) / 100,
            };
          }
          return item;
        })
        .filter(Boolean) as BillItem[];
    });
  }, []);

  const removeCartItem = useCallback((itemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setActiveBillId(null);
    setActiveBillNumber(null);
    setCartDiscount(0);
  }, []);

  const loadTableOrder = useCallback(
    (table: Table) => {
      setActiveTableId(table.id);
      setActiveChannelId('ch_dine_in');

      if (table.currentBillId) {
        const existingBill = store.bills.find((b) => b.id === table.currentBillId);
        if (existingBill) {
          setCartItems(existingBill.items);
          setActiveBillId(existingBill.id);
          setActiveBillNumber(existingBill.billNumber);
          setGuestCount(existingBill.guestCount || table.chairs || 2);
          setCartDiscount(existingBill.discount || 0);
          return;
        }
      }

      // If no bill linked, start fresh cart for this table
      setCartItems([]);
      setActiveBillId(null);
      setActiveBillNumber(null);
      setGuestCount(table.chairs || 2);
      setCartDiscount(0);
    },
    [store.bills]
  );

  const saveOrderToTable = useCallback(
    async (targetTableId: string, channelId = 'ch_dine_in'): Promise<Bill> => {
      if (cartItems.length === 0) {
        throw new Error('Cannot save empty order');
      }

      const table = store.tables.find((t) => t.id === targetTableId);
      if (!table) {
        throw new Error('Selected table does not exist');
      }

      const billTotals = calculateBillTotals(
        cartItems,
        cartDiscount,
        store.settings.serviceChargePercent,
        store.settings.vatPercent
      );

      const now = new Date().toISOString();
      let billNumber = activeBillNumber;
      let billId = activeBillId;
      let existingBill = activeBillId ? store.bills.find((b) => b.id === activeBillId) : null;

      if (!existingBill) {
        billNumber = await getNextBillNumber();
        billId = `bill_${Date.now()}`;
      }

      const billToSave: Bill = {
        id: billId!,
        billNumber: billNumber!,
        channelId,
        tableId: table.id,
        tableName: table.number,
        items: cartItems,
        subtotal: billTotals.subtotal,
        discount: cartDiscount,
        serviceChargePercent: store.settings.serviceChargePercent,
        serviceChargeAmount: billTotals.serviceChargeAmount,
        vatPercent: store.settings.vatPercent,
        vatAmount: billTotals.vatAmount,
        total: billTotals.total,
        totalFoodCost: billTotals.totalFoodCost,
        payments: existingBill ? existingBill.payments : [],
        status: 'open',
        guestCount,
        createdAt: existingBill ? existingBill.createdAt : now,
        updatedAt: now,
        version: existingBill ? existingBill.version : 1,
      };

      await commitBill(billToSave, {
        id: table.id,
        status: 'occupied',
        currentBillId: billToSave.id,
        currentBillNumber: billToSave.billNumber,
        occupiedAt: table.occupiedAt || now,
        version: table.version,
      });

      setActiveBillId(billToSave.id);
      setActiveBillNumber(billToSave.billNumber);
      setActiveTableId(table.id);

      return billToSave;
    },
    [
      cartItems,
      cartDiscount,
      activeBillId,
      activeBillNumber,
      guestCount,
      store.tables,
      store.bills,
      store.settings,
      getNextBillNumber,
      commitBill,
    ]
  );

  const saveTakeawayOrDeliveryOrder = useCallback(
    async (channelId: string): Promise<Bill> => {
      if (cartItems.length === 0) {
        throw new Error('Cannot save empty order');
      }

      const billTotals = calculateBillTotals(
        cartItems,
        cartDiscount,
        store.settings.serviceChargePercent,
        store.settings.vatPercent
      );

      const now = new Date().toISOString();
      const billNumber = await getNextBillNumber();
      const billId = `bill_${Date.now()}`;

      const billToSave: Bill = {
        id: billId,
        billNumber,
        channelId,
        items: cartItems,
        subtotal: billTotals.subtotal,
        discount: cartDiscount,
        serviceChargePercent: 0, // usually 0 for takeaway/delivery
        serviceChargeAmount: 0,
        vatPercent: store.settings.vatPercent,
        vatAmount: billTotals.vatAmount,
        total: billTotals.total,
        totalFoodCost: billTotals.totalFoodCost,
        payments: [],
        status: 'open',
        createdAt: now,
        updatedAt: now,
        version: 1,
      };

      await commitBill(billToSave);
      setActiveBillId(billToSave.id);
      setActiveBillNumber(billToSave.billNumber);
      return billToSave;
    },
    [cartItems, cartDiscount, store.settings, getNextBillNumber, commitBill]
  );

  const completePayment = useCallback(
    async (billId: string, payments: BillPayment[], discount = 0): Promise<Bill> => {
      const existingBill = store.bills.find((b) => b.id === billId);
      if (!existingBill) {
        throw new Error('Bill not found for payment');
      }

      const now = new Date().toISOString();

      const totals = calculateBillTotals(
        existingBill.items,
        discount,
        existingBill.serviceChargePercent,
        existingBill.vatPercent
      );

      const paidBill: Bill = {
        ...existingBill,
        discount,
        subtotal: totals.subtotal,
        serviceChargeAmount: totals.serviceChargeAmount,
        vatAmount: totals.vatAmount,
        total: totals.total,
        totalFoodCost: totals.totalFoodCost,
        payments,
        status: 'paid',
        paidAt: now,
        updatedAt: now,
      };

      // If linked to table, free the table
      const linkedTable = existingBill.tableId
        ? store.tables.find((t) => t.id === existingBill.tableId)
        : null;

      const tableUpdate = linkedTable
        ? {
            id: linkedTable.id,
            status: 'available' as const,
            currentBillId: undefined,
            currentBillNumber: undefined,
            occupiedAt: undefined,
            version: linkedTable.version,
          }
        : undefined;

      await commitBill(paidBill, tableUpdate);
      clearCart();
      return paidBill;
    },
    [store.bills, store.tables, commitBill, clearCart]
  );

  const voidBill = useCallback(
    async (billId: string, reason = 'Customer request / voided'): Promise<void> => {
      const existingBill = store.bills.find((b) => b.id === billId);
      if (!existingBill) return;

      const now = new Date().toISOString();
      const voidedBill: Bill = {
        ...existingBill,
        status: 'voided',
        voidedAt: now,
        voidReason: reason,
        updatedAt: now,
      };

      const linkedTable = existingBill.tableId
        ? store.tables.find((t) => t.id === existingBill.tableId)
        : null;

      const tableUpdate = linkedTable
        ? {
            id: linkedTable.id,
            status: 'available' as const,
            currentBillId: undefined,
            currentBillNumber: undefined,
            occupiedAt: undefined,
            version: linkedTable.version,
          }
        : undefined;

      await commitBill(voidedBill, tableUpdate);
      clearCart();
    },
    [store.bills, store.tables, commitBill, clearCart]
  );

  const value = useMemo(
    () => ({
      user,
      authLoading,
      store,
      loading,
      error,
      dismissError,
      lang,
      setLang,
      t,
      syncStatus,
      ingredientsMap,
      subRecipesMap,
      packagingMap,
      optionGroupsMap,
      categoriesMap,
      channelsMap,
      saveIngredient,
      deleteIngredient,
      saveSubRecipe,
      deleteSubRecipe,
      savePackaging,
      deletePackaging,
      saveDish,
      deleteDish,
      saveOptionGroup,
      deleteOptionGroup,
      reorderOptionGroups,
      saveCategory,
      deleteCategory,
      reorderCategories,
      saveSalesChannel,
      saveTable,
      deleteTable,
      saveZone,
      deleteZone,
      saveExpense,
      deleteExpense,
      saveEmployee,
      deleteEmployee,
      saveShift,
      saveMember,
      deleteMember,
      saveSettings,
      commitBill,
      getNextBillNumber,
      exportBackup,
      importBackup,
      resetToEmptyStore,
      seedTinyExample,
      signIn,
      signOut,
      saveImage,
      loadImage,
      cartItems,
      activeChannelId,
      setActiveChannelId,
      activeTableId,
      setActiveTableId,
      activeBillId,
      activeBillNumber,
      guestCount,
      setGuestCount,
      cartDiscount,
      setCartDiscount,
      addToCart,
      updateCartItemQty,
      removeCartItem,
      clearCart,
      loadTableOrder,
      saveOrderToTable,
      saveTakeawayOrDeliveryOrder,
      completePayment,
      voidBill,
    }),
    [
      user,
      authLoading,
      store,
      loading,
      error,
      dismissError,
      lang,
      setLang,
      t,
      syncStatus,
      ingredientsMap,
      subRecipesMap,
      packagingMap,
      optionGroupsMap,
      categoriesMap,
      channelsMap,
      saveIngredient,
      deleteIngredient,
      saveSubRecipe,
      deleteSubRecipe,
      savePackaging,
      deletePackaging,
      saveDish,
      deleteDish,
      saveOptionGroup,
      deleteOptionGroup,
      reorderOptionGroups,
      saveCategory,
      deleteCategory,
      reorderCategories,
      saveSalesChannel,
      saveTable,
      deleteTable,
      saveZone,
      deleteZone,
      saveExpense,
      deleteExpense,
      saveEmployee,
      deleteEmployee,
      saveShift,
      saveMember,
      deleteMember,
      saveSettings,
      commitBill,
      getNextBillNumber,
      exportBackup,
      importBackup,
      resetToEmptyStore,
      seedTinyExample,
      signIn,
      signOut,
      saveImage,
      loadImage,
      cartItems,
      activeChannelId,
      activeTableId,
      activeBillId,
      activeBillNumber,
      guestCount,
      cartDiscount,
      addToCart,
      updateCartItemQty,
      removeCartItem,
      clearCart,
      loadTableOrder,
      saveOrderToTable,
      saveTakeawayOrDeliveryOrder,
      completePayment,
      voidBill,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return ctx;
}
