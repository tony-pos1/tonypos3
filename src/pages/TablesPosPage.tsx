/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD POS Selling Screens (Default Start Page)
 *
 * Requirements:
 * - Zone chip bar at the top (All zones + each zone).
 * - "All zones" shows table cards, ONLY tables that have a saved order.
 * - A specific zone shows the floor plan: free table = dark green border, table with customers = red border.
 * - NO status legend chips, NO view toggle.
 * - Table & zone management: pick table type, chairs, place tables and drag freely.
 * - Always-visible bottom bar: permanent "Bill" card first (linked to floor plan), then food category cards.
 * - Selecting a category hides the zone bar and shows category's menu full screen; tapping the Bill card brings the zone bar back.
 * - Choosing a dish opens options (variants, option groups), storing frozen price & cost snapshot.
 * - "Confirm order" opens Save Order dialog (All zones = cards, zone = floor plan). Payment is blocked until order is saved to a table.
 * - Saved unpaid bills have a "Print receipt" button for pre-check bill.
 * - Payment: discount, service charge, VAT from settings, split payment with Cash (change calculation), QR (shows uploaded QR), Card, Transfer.
 * - Thermal receipt printing for 80mm and 58mm paper.
 * - Order types: dine-in, takeaway, delivery.
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Clock,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
  Edit2,
  Printer,
  CreditCard,
  Banknote,
  Square,
  Circle,
  RectangleHorizontal,
  ChevronRight,
  Layers,
  ShoppingBag,
  Car,
  Utensils,
  X,
  Minus,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Table, TableType, Zone, Dish, Bill, BillItem } from '../types/models';
import { FloorPlanCanvas } from '../components/pos/FloorPlanCanvas';
import { PosBottomBar } from '../components/pos/PosBottomBar';
import { CategoryMenuGrid } from '../components/pos/CategoryMenuGrid';
import { DishOptionsModal } from '../components/pos/DishOptionsModal';
import { SaveOrderDialog } from '../components/pos/SaveOrderDialog';
import { PaymentModal } from '../components/pos/PaymentModal';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { calculateBillTotals } from '../engine/calculations';

export const TablesPosPage: React.FC = () => {
  const {
    store,
    saveTable,
    deleteTable,
    saveZone,
    deleteZone,
    cartItems,
    addToCart,
    updateCartItemQty,
    removeCartItem,
    clearCart,
    activeTableId,
    setActiveTableId,
    activeBillId,
    activeBillNumber,
    loadTableOrder,
    cartDiscount,
    setCartDiscount,
    lang,
    t,
  } = useStore();

  // Zone selection: 'all' or zoneId
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');

  // Bottom bar category selection: null = tables/floor plan view, string = categoryId
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Modals state
  const [selectedDishForOptions, setSelectedDishForOptions] = useState<Dish | null>(null);
  const [isSaveOrderOpen, setIsSaveOrderOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isPreCheckReceipt, setIsPreCheckReceipt] = useState(false);
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState<Bill | null>(null);

  // Table and Zone creation modals
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showManageZonesModal, setShowManageZonesModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableType, setNewTableType] = useState<TableType>('square');
  const [newTableChairs, setNewTableChairs] = useState(4);
  const [newTableZoneId, setNewTableZoneId] = useState(store.zones[0]?.id || '');
  const [newZoneName, setNewZoneName] = useState('');

  // Active Bill for currently selected table or active cart
  const currentSavedBill = useMemo(() => {
    if (activeBillId) {
      return store.bills.find((b) => b.id === activeBillId && b.status === 'open') || null;
    }
    if (activeTableId) {
      const tbl = store.tables.find((t) => t.id === activeTableId);
      if (tbl?.currentBillId) {
        return store.bills.find((b) => b.id === tbl.currentBillId && b.status === 'open') || null;
      }
    }
    return null;
  }, [activeBillId, activeTableId, store.bills, store.tables]);

  // Active table object
  const activeTable = useMemo(() => {
    if (!activeTableId) return null;
    return store.tables.find((t) => t.id === activeTableId) || null;
  }, [activeTableId, store.tables]);

  // Tables in the selected zone
  const tablesInSelectedZone = useMemo(() => {
    if (selectedZoneId === 'all') return store.tables;
    return store.tables.filter((t) => t.zoneId === selectedZoneId);
  }, [store.tables, selectedZoneId]);

  // "All zones" filter: ONLY tables that have a saved order!
  const tablesWithSavedOrders = useMemo(() => {
    return store.tables.filter((t) => t.status === 'occupied' || Boolean(t.currentBillId));
  }, [store.tables]);

  // Calculate live financial summary for active cart
  const cartTotals = useMemo(() => {
    return calculateBillTotals(
      cartItems,
      cartDiscount,
      store.settings.serviceChargePercent,
      store.settings.vatPercent
    );
  }, [cartItems, cartDiscount, store.settings]);

  // Drag-and-drop table repositioning
  const handleTableMove = async (tableId: string, posX: number, posY: number) => {
    const table = store.tables.find((t) => t.id === tableId);
    if (table) {
      await saveTable({
        ...table,
        positionX: posX,
        positionY: posY,
      });
    }
  };

  // Add Table Form Submit
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;

    const assignedZoneId =
      selectedZoneId !== 'all' ? selectedZoneId : newTableZoneId || store.zones[0]?.id || 'zone_main';

    const newTable: Table = {
      id: `tbl_${Date.now()}`,
      number: newTableNumber.trim(),
      zoneId: assignedZoneId,
      tableType: newTableType,
      chairs: Number(newTableChairs) || 4,
      positionX: 60,
      positionY: 60,
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    await saveTable(newTable);
    setNewTableNumber('');
    setShowAddTableModal(false);
  };

  // Add Zone Form Submit
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    const newZone: Zone = {
      id: `zone_${Date.now()}`,
      name: newZoneName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    await saveZone(newZone);
    setNewZoneName('');
  };

  // Pre-check Print handler
  const handleOpenPreCheckReceipt = () => {
    if (currentSavedBill) {
      setSelectedBillForReceipt(currentSavedBill);
      setIsPreCheckReceipt(true);
      setIsReceiptOpen(true);
    }
  };

  // Payment button clicked
  const handleOpenPayment = () => {
    if (!currentSavedBill) {
      // Payment strictly blocked until order is saved to a table
      setIsSaveOrderOpen(true);
      return;
    }
    setIsPaymentOpen(true);
  };

  return (
    <div className="space-y-4 pb-28 max-w-7xl mx-auto">
      {/* 1. TOP ZONE CHIP BAR (Visible when NOT in full-screen category menu) */}
      {activeCategoryId === null && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-xs">
          {/* Zone Chips: [All zones] + each zone */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedZoneId('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                selectedZoneId === 'all'
                  ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {t('allZones')} ({tablesWithSavedOrders.length})
            </button>

            {store.zones.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              const count = store.tables.filter((t) => t.zoneId === zone.id).length;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    isSelected
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {zone.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Table & Zone Management Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setShowManageZonesModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-neutral-500" />
              <span>{t('manageZones')}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddTableModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addTable')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN VIEW AREA: Floor Plan vs All Zones Cards vs Full-Screen Category Menu */}
      {activeCategoryId !== null ? (
        /* Full-Screen Category Dish Catalog (hides zone bar) */
        <CategoryMenuGrid
          categoryId={activeCategoryId}
          onSelectDish={(dish) => setSelectedDishForOptions(dish)}
          onBackToFloorPlan={() => setActiveCategoryId(null)}
        />
      ) : selectedZoneId === 'all' ? (
        /* "ALL ZONES" VIEW: Shows table cards, ONLY tables that have a saved order! */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              {t('allZonesSub')}
            </span>
          </div>

          {tablesWithSavedOrders.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-14 text-center">
              <Receipt className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-700">
                {t('noSavedOrdersInAllZones')}
              </p>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Select a specific zone chip above to view the interactive floor plan and seat guests.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tablesWithSavedOrders.map((table) => {
                const bill = store.bills.find((b) => b.id === table.currentBillId);
                const isSelected = activeTableId === table.id;

                return (
                  <div
                    key={table.id}
                    onClick={() => {
                      loadTableOrder(table);
                    }}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 shadow-md ring-2 ring-amber-400/20'
                        : 'border-rose-600 bg-rose-50/60 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-rose-200/80">
                        <span className="text-base font-extrabold text-neutral-900">
                          {table.number}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                          <Users className="w-3.5 h-3.5" />
                          <span className="font-semibold">{table.chairs}</span>
                        </div>
                      </div>

                      <div className="py-3 text-center">
                        <span className="text-xs font-mono font-bold text-rose-900 block truncate">
                          {table.currentBillNumber || 'Active Order'}
                        </span>
                        {bill && (
                          <div className="mt-1">
                            <span className="text-xs text-neutral-500 block">
                              {bill.items.length} {t('items')}
                            </span>
                            <span className="text-base font-extrabold text-neutral-900 tabular-nums">
                              {bill.total.toFixed(2)} ฿
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between text-[11px] text-rose-800 font-semibold">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Seated</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* SPECIFIC ZONE VIEW: Interactive 2D Floor Plan */
        /* Free table = dark green border, Table with customers = red border */
        /* NO status legend chips, NO view toggle */
        <FloorPlanCanvas
          tables={tablesInSelectedZone}
          activeTableId={activeTableId}
          onSelectTable={(table) => {
            loadTableOrder(table);
          }}
          onTableMoved={handleTableMove}
        />
      )}

      {/* 3. ACTIVE ORDER DRAWER / PANEL (When table or items are selected) */}
      {(cartItems.length > 0 || activeTableId) && (
        <div className="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-5 shadow-xs space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-neutral-900 text-white">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-neutral-900">
                    {t('billCard')}: {activeTable ? activeTable.number : 'Unsaved Order'}
                  </h3>
                  {activeBillNumber && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800">
                      {activeBillNumber}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400">
                  {currentSavedBill
                    ? 'Saved order linked to table'
                    : 'Unsaved order — assign to table before taking payment'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  {t('clearCart')}
                </button>
              )}
            </div>
          </div>

          {/* Order Items List */}
          {cartItems.length === 0 ? (
            <div className="py-6 text-center text-neutral-400 text-xs">
              <Utensils className="w-6 h-6 mx-auto mb-1 text-neutral-300" />
              <span>{t('noActiveItems')}. Tap a category below to pick dishes.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 truncate">
                        {lang === 'th' ? item.dishNameTh : item.dishNameEn || item.dishNameTh}
                      </span>
                      {item.variantNameTh && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-200 font-semibold text-neutral-700">
                          {lang === 'th' ? item.variantNameTh : item.variantNameEn || item.variantNameTh}
                        </span>
                      )}
                    </div>

                    {/* Modifiers Snapshot */}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {item.selectedOptions.map((opt, oIdx) => (
                          <span key={oIdx} className="mr-2">
                            +{opt.choiceName} {opt.priceDelta > 0 && `(+${opt.priceDelta}฿)`}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Cost snapshot info */}
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Price: {item.unitPrice.toFixed(2)} ฿ • Snapshot Cost: {item.unitFoodCost.toFixed(2)} ฿
                    </div>
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 border border-neutral-300 rounded-lg bg-white px-1.5 py-0.5">
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(item.id, -1)}
                        className="text-neutral-500 hover:text-neutral-900 p-0.5"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-xs tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(item.id, 1)}
                        className="text-neutral-500 hover:text-neutral-900 p-0.5"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-extrabold text-xs text-neutral-900 tabular-nums w-16 text-right">
                      {item.totalPrice.toFixed(2)} ฿
                    </span>

                    <button
                      type="button"
                      onClick={() => removeCartItem(item.id)}
                      className="text-neutral-300 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Financial Totals & Action Bar */}
          {cartItems.length > 0 && (
            <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">
                    {t('subtotal')}
                  </span>
                  <span className="font-bold text-neutral-700 tabular-nums">
                    {cartTotals.subtotal.toFixed(2)} ฿
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">
                    {t('total')}
                  </span>
                  <span className="font-extrabold text-base text-neutral-900 tabular-nums">
                    {cartTotals.total.toFixed(2)} ฿
                  </span>
                </div>
              </div>

              {/* Action Buttons: Confirm Order, Pre-check Print, Payment */}
              <div className="flex items-center gap-2">
                {/* Pre-Check Print Button for saved unpaid bills */}
                {currentSavedBill && (
                  <button
                    type="button"
                    onClick={handleOpenPreCheckReceipt}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 font-bold text-xs transition-colors"
                    title={t('printPreCheck')}
                  >
                    <Printer className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{t('printReceipt')}</span>
                  </button>
                )}

                {/* Confirm order / Save to Table */}
                <button
                  type="button"
                  onClick={() => setIsSaveOrderOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-900 text-neutral-900 hover:bg-neutral-100 font-bold text-xs transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{currentSavedBill ? 'Update Order' : t('confirmOrder')}</span>
                </button>

                {/* Pay Button: BLOCKED until order is saved to a table! */}
                <button
                  type="button"
                  onClick={handleOpenPayment}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors ${
                    currentSavedBill
                      ? 'bg-neutral-900 hover:bg-neutral-800 text-white'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                  title={
                    currentSavedBill
                      ? 'Proceed to payment checkout'
                      : 'Order must be saved to a table before taking payment'
                  }
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t('payButton')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. ALWAYS-VISIBLE BOTTOM BAR */}
      <PosBottomBar
        activeCategory={activeCategoryId}
        onSelectCategory={(catId) => setActiveCategoryId(catId)}
        onSelectBill={() => setActiveCategoryId(null)}
      />

      {/* MODAL 1: Dish Variant & Modifiers Options Modal */}
      {selectedDishForOptions && (
        <DishOptionsModal
          dish={selectedDishForOptions}
          isOpen={Boolean(selectedDishForOptions)}
          onClose={() => setSelectedDishForOptions(null)}
          onConfirm={(itemSnapshot) => {
            addToCart(itemSnapshot);
          }}
        />
      )}

      {/* MODAL 2: Save Order Dialog (Table Assignment) */}
      <SaveOrderDialog
        isOpen={isSaveOrderOpen}
        onClose={() => setIsSaveOrderOpen(false)}
        onSaved={(bill) => {
          setSelectedBillForReceipt(bill);
        }}
      />

      {/* MODAL 3: Payment Checkout Modal (Cash, QR, Card, Transfer) */}
      {currentSavedBill && (
        <PaymentModal
          bill={currentSavedBill}
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onPaymentSuccess={(paidBill) => {
            setSelectedBillForReceipt(paidBill);
            setIsPreCheckReceipt(false);
            setIsReceiptOpen(true);
          }}
        />
      )}

      {/* MODAL 4: Thermal Receipt Modal (80mm & 58mm) */}
      {selectedBillForReceipt && (
        <ReceiptModal
          bill={selectedBillForReceipt}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          isPreCheck={isPreCheckReceipt}
        />
      )}

      {/* MODAL 5: Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-neutral-200 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">{t('addTable')}</h3>
              <button
                type="button"
                onClick={() => setShowAddTableModal(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-3 pt-3">
              <div>
                <label className="block text-neutral-600 font-semibold mb-1">
                  {t('tableNumber')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-02, Bar-01, Outdoor-05"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 font-bold outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-semibold mb-1">
                  {t('tables')} / Zone
                </label>
                <select
                  value={newTableZoneId}
                  onChange={(e) => setNewTableZoneId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-medium outline-hidden"
                >
                  {store.zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-600 font-semibold mb-1">
                    {t('chairs')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newTableChairs}
                    onChange={(e) => setNewTableChairs(Number(e.target.value))}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 font-semibold outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 font-semibold mb-1">
                    {t('tableType')}
                  </label>
                  <select
                    value={newTableType}
                    onChange={(e) => setNewTableType(e.target.value as TableType)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-medium outline-hidden"
                  >
                    <option value="square">{t('square')}</option>
                    <option value="rect">{t('rect')}</option>
                    <option value="round">{t('round')}</option>
                    <option value="bar">{t('bar')}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white font-bold hover:bg-neutral-800"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Manage Zones Modal */}
      {showManageZonesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-neutral-200 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">{t('manageZones')}</h3>
              <button
                type="button"
                onClick={() => setShowManageZonesModal(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-3">
              {/* Existing Zones */}
              <div className="space-y-1.5">
                {store.zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-200"
                  >
                    <span className="font-bold text-neutral-900">{zone.name}</span>
                    <button
                      type="button"
                      disabled={store.zones.length <= 1}
                      onClick={() => deleteZone(zone.id)}
                      className={`p-1 rounded text-neutral-400 hover:text-rose-600 ${
                        store.zones.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Zone */}
              <form onSubmit={handleCreateZone} className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                <input
                  type="text"
                  required
                  placeholder={lang === 'th' ? 'ชื่อโซนใหม่ (เช่น ระเบียงนอก, บาร์)' : 'New zone name (e.g. Patio, Terrace)'}
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="flex-1 rounded-xl border border-neutral-300 px-3 py-1.5 font-medium outline-hidden focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white font-bold hover:bg-neutral-800"
                >
                  {t('addZone')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
