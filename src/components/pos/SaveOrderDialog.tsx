/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Save Order Dialog
 * Reflects the Tables page layout (All zones = cards, a zone = floor plan)
 * so staff can pick the table before taking payment.
 * Payment is strictly blocked until the order is saved to a table (or takeaway/delivery channel).
 */

import React, { useState } from 'react';
import {
  X,
  Check,
  Users,
  Utensils,
  ShoppingBag,
  Car,
  Receipt,
  Store,
  Layers,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Table, SalesChannelType, Bill } from '../../types/models';
import { FloorPlanCanvas } from './FloorPlanCanvas';

interface SaveOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (bill: Bill) => void;
}

export const SaveOrderDialog: React.FC<SaveOrderDialogProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const {
    store,
    cartItems,
    activeTableId,
    saveOrderToTable,
    saveTakeawayOrDeliveryOrder,
    saveTable,
    lang,
    t,
  } = useStore();

  const [orderType, setOrderType] = useState<SalesChannelType>('dine_in');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('ch_dine_in');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [pickedTableId, setPickedTableId] = useState<string | null>(activeTableId);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter tables for the current zone
  const tablesForZone = store.tables.filter((t) => t.zoneId === selectedZoneId);

  // In "All zones", per requirement: show only tables that have a saved order (or selected)
  const allZonesTablesWithOrders = store.tables.filter(
    (t) => t.status === 'occupied' || Boolean(t.currentBillId) || t.id === pickedTableId
  );

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

  const handleConfirmSave = async () => {
    setErrorMessage(null);
    setSaving(true);

    try {
      if (orderType === 'dine_in') {
        if (!pickedTableId) {
          setErrorMessage(t('mustSelectTable'));
          setSaving(false);
          return;
        }

        const savedBill = await saveOrderToTable(pickedTableId, 'ch_dine_in');
        onSaved(savedBill);
        onClose();
      } else {
        // Takeaway or Delivery
        const savedBill = await saveTakeawayOrDeliveryOrder(selectedChannelId);
        onSaved(savedBill);
        onClose();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h3 className="text-base font-bold text-neutral-900">{t('saveOrderTitle')}</h3>
            <p className="text-xs text-neutral-400">{t('saveOrderSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Type Tabs */}
        <div className="p-4 border-b border-neutral-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setOrderType('dine_in');
                setSelectedChannelId('ch_dine_in');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all border ${
                orderType === 'dine_in'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>{t('dineIn')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOrderType('takeaway');
                setSelectedChannelId('ch_takeaway');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all border ${
                orderType === 'takeaway'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t('takeaway')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOrderType('grab');
                setSelectedChannelId('ch_grab');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all border ${
                orderType !== 'dine_in' && orderType !== 'takeaway'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>{t('delivery')}</span>
            </button>
          </div>

          {/* Delivery Platform picker if delivery selected */}
          {orderType !== 'dine_in' && orderType !== 'takeaway' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-600">{t('chooseChannel')}:</span>
              <select
                value={selectedChannelId}
                onChange={(e) => {
                  setSelectedChannelId(e.target.value);
                  setOrderType(
                    (store.channels.find((c) => c.id === e.target.value)?.type || 'grab') as SalesChannelType
                  );
                }}
                className="rounded-lg border border-neutral-300 px-3 py-1 font-semibold text-neutral-900 outline-hidden bg-white"
              >
                {store.channels
                  .filter((c) => c.type !== 'dine_in' && c.type !== 'takeaway')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.commissionPercent}% GP)
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Dine-In Floor Plan & Table Selection Section */}
        {orderType === 'dine_in' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Zone chip bar at top */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedZoneId('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                  selectedZoneId === 'all'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                {t('allZones')}
              </button>
              {store.zones.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                    selectedZoneId === zone.id
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {zone.name}
                </button>
              ))}
            </div>

            {/* If "All zones": show table cards ONLY for tables with a saved order */}
            {selectedZoneId === 'all' ? (
              <div className="space-y-3">
                <span className="text-[11px] text-neutral-400 block font-medium">
                  {t('allZonesSub')}
                </span>

                {allZonesTablesWithOrders.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-10 text-center">
                    <p className="text-sm font-semibold text-neutral-700">
                      {t('noSavedOrdersInAllZones')}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Select a specific zone above to pick an available table on the floor plan.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {allZonesTablesWithOrders.map((tbl) => {
                      const isPicked = pickedTableId === tbl.id;
                      return (
                        <button
                          key={tbl.id}
                          type="button"
                          onClick={() => setPickedTableId(tbl.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            isPicked
                              ? 'border-2 border-amber-500 bg-amber-50/70 shadow-md ring-2 ring-amber-400/20'
                              : 'border-2 border-rose-600 bg-rose-50/60 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-base font-bold text-neutral-900">{tbl.number}</span>
                            <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                              <Users className="w-3 h-3" />
                              <span>{tbl.chairs}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-rose-800 block truncate">
                            {tbl.currentBillNumber || 'Active Order'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Specific Zone: Interactive floor plan with dark green (free) and red (occupied) borders */
              <div className="space-y-2">
                <FloorPlanCanvas
                  tables={tablesForZone}
                  activeTableId={pickedTableId}
                  onSelectTable={(tbl) => setPickedTableId(tbl.id)}
                  onTableMoved={handleTableMove}
                />
              </div>
            )}
          </div>
        ) : (
          /* Takeaway / Delivery Details Preview */
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-4 rounded-2xl bg-neutral-100 text-neutral-800">
              {orderType === 'takeaway' ? (
                <ShoppingBag className="w-8 h-8" />
              ) : (
                <Car className="w-8 h-8" />
              )}
            </div>
            <h4 className="text-base font-bold text-neutral-900">
              {orderType === 'takeaway' ? t('takeaway') : t('delivery')}
            </h4>
            <p className="text-xs text-neutral-500 max-w-sm">
              This order will be registered as a direct {orderType} sale. Commission and packaging fees will be calculated from Sales Channel settings.
            </p>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="px-5 py-2 bg-rose-50 border-t border-rose-200 text-xs text-rose-700 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/80 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-neutral-400 block font-medium">{t('table')} / {t('orderType')}:</span>
            <span className="font-bold text-neutral-900">
              {orderType === 'dine_in'
                ? pickedTableId
                  ? store.tables.find((t) => t.id === pickedTableId)?.number
                  : 'Please pick a table'
                : store.channels.find((c) => c.id === selectedChannelId)?.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 font-semibold text-xs"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              disabled={saving || (orderType === 'dine_in' && !pickedTableId)}
              onClick={handleConfirmSave}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors ${
                orderType === 'dine_in' && !pickedTableId
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : t('confirmOrder')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
