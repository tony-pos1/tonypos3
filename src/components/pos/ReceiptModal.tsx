/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Thermal Receipt Printer Modal
 * Supports:
 * - 80mm standard and 58mm compact thermal paper width toggle
 * - Pre-check bill (for unpaid orders to verify before paying)
 * - Official sales receipt / tax invoice (ABB) for paid orders
 */

import React, { useState } from 'react';
import { X, Printer, Check, Receipt, Store, Clock } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Bill } from '../../types/models';

interface ReceiptModalProps {
  bill: Bill;
  isOpen: boolean;
  onClose: () => void;
  isPreCheck?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  bill,
  isOpen,
  onClose,
  isPreCheck = false,
}) => {
  const { store, user, lang, t } = useStore();
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = bill.status === 'paid' && !isPreCheck;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Controls Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50 print:hidden">
          {/* Paper Width Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-500 font-semibold mr-1">{t('paperWidth')}:</span>
            <button
              type="button"
              onClick={() => setPaperWidth('80mm')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                paperWidth === '80mm'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-700'
              }`}
            >
              80mm
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth('58mm')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                paperWidth === '58mm'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-700'
              }`}
            >
              58mm
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('printReceipt')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview (Thermal Paper Styled) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-100 flex justify-center">
          <div
            id="thermal-receipt"
            className={`bg-white p-5 shadow-sm border border-neutral-200 font-mono text-neutral-900 leading-tight transition-all text-left ${
              paperWidth === '80mm' ? 'w-[320px] text-xs' : 'w-[250px] text-[11px]'
            }`}
          >
            {/* Header info */}
            <div className="text-center pb-3 border-b border-dashed border-neutral-400 space-y-1">
              <h2 className="font-extrabold text-sm sm:text-base tracking-tight uppercase">
                {store.settings.restaurantName}
              </h2>
              <p className="text-[10px] text-neutral-600 font-sans">
                {isPaid ? t('taxInvoiceReceipt') : t('preCheckBill')}
              </p>
            </div>

            {/* Bill Meta */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>{t('billNo')}:</span>
                <span className="font-bold">{bill.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('date')}:</span>
                <span>{new Date(bill.createdAt).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('table')}:</span>
                <span className="font-bold">{bill.tableName || 'Takeaway / Delivery'}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('cashier')}:</span>
                <span>{user?.displayName || 'Cashier'}</span>
              </div>
            </div>

            {/* Itemized lines */}
            <div className="py-3 border-b border-dashed border-neutral-400 space-y-2">
              {bill.items.map((item, idx) => (
                <div key={item.id || idx} className="space-y-0.5">
                  <div className="flex justify-between items-start">
                    <span className="font-bold truncate max-w-[70%]">
                      {item.quantity}x {lang === 'th' ? item.dishNameTh : item.dishNameEn || item.dishNameTh}
                    </span>
                    <span className="font-bold tabular-nums">
                      {item.totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Variant & Modifiers */}
                  <div className="pl-3 text-[10px] text-neutral-500 space-y-0.5">
                    {item.variantNameTh && (
                      <div>• {lang === 'th' ? item.variantNameTh : item.variantNameEn || item.variantNameTh}</div>
                    )}
                    {item.selectedOptions?.map((opt, oIdx) => (
                      <div key={oIdx} className="flex justify-between">
                        <span>+ {opt.choiceName}</span>
                        {opt.priceDelta > 0 && <span>+{opt.priceDelta * item.quantity}</span>}
                      </div>
                    ))}
                    {item.notes && (
                      <div className="italic text-neutral-400">"{item.notes}"</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>{t('subtotal')}</span>
                <span className="tabular-nums">{bill.subtotal.toFixed(2)}</span>
              </div>

              {bill.discount > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>{t('discount')}</span>
                  <span className="tabular-nums">-{bill.discount.toFixed(2)}</span>
                </div>
              )}

              {bill.serviceChargeAmount > 0 && (
                <div className="flex justify-between">
                  <span>{t('serviceCharge')} ({bill.serviceChargePercent}%)</span>
                  <span className="tabular-nums">+{bill.serviceChargeAmount.toFixed(2)}</span>
                </div>
              )}

              {bill.vatAmount > 0 && (
                <div className="flex justify-between">
                  <span>{t('vat')} ({bill.vatPercent}%)</span>
                  <span className="tabular-nums">+{bill.vatAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-1.5 border-t border-neutral-300 flex justify-between font-extrabold text-xs sm:text-sm">
                <span>{t('total')}</span>
                <span className="tabular-nums">{bill.total.toFixed(2)} ฿</span>
              </div>
            </div>

            {/* Payments breakdown for paid bills */}
            {isPaid && bill.payments && bill.payments.length > 0 && (
              <div className="py-2.5 border-b border-dashed border-neutral-300 text-[10px] space-y-1">
                <span className="font-bold block uppercase">{t('paidAmount')}:</span>
                {bill.payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between capitalize text-neutral-600">
                    <span>{p.method} {p.reference ? `(${p.reference})` : ''}</span>
                    <span className="tabular-nums font-semibold">{p.amount.toFixed(2)} ฿</span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-neutral-500 font-sans space-y-1">
              <p className="font-semibold">{t('thankYou')}</p>
              <p className="text-[9px] text-neutral-400">Powered by KinD POS &amp; Food Cost</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
