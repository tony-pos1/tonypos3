/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Payment & Checkout Modal
 * Supports:
 * - VAT %, service charge %, and discount
 * - Split payments across multiple payment methods:
 *   - Cash (with exact change calculation and quick tender presets)
 *   - QR (shows uploaded QR image from shop settings)
 *   - Card
 *   - Transfer
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Banknote,
  QrCode,
  CreditCard,
  Building2,
  Plus,
  Trash2,
  Receipt,
  Percent,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Bill, BillPayment } from '../../types/models';
import { calculateBillTotals } from '../../engine/calculations';

interface PaymentModalProps {
  bill: Bill;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paidBill: Bill) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  bill,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const { store, completePayment, lang, t } = useStore();

  const [discount, setDiscount] = useState<number>(bill.discount || 0);
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'qr' | 'card' | 'transfer'>('cash');
  const [paymentsList, setPaymentsList] = useState<BillPayment[]>(bill.payments || []);

  // Method specific state
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Live bill totals
  const totals = useMemo(() => {
    return calculateBillTotals(
      bill.items,
      discount,
      bill.serviceChargePercent || store.settings.serviceChargePercent || 0,
      bill.vatPercent || store.settings.vatPercent || 0
    );
  }, [bill, discount, store.settings]);

  // Sum of payments made so far
  const totalPaid = useMemo(() => {
    return paymentsList.reduce((sum, p) => sum + p.amount, 0);
  }, [paymentsList]);

  // Remaining balance
  const remainingDue = Math.max(0, Math.round((totals.total - totalPaid) * 100) / 100);

  // Initialize tender input when modal opens or remainingDue changes
  React.useEffect(() => {
    if (remainingDue > 0 && paymentAmountInput === 0) {
      setPaymentAmountInput(remainingDue);
      setCashTendered(remainingDue);
    }
  }, [remainingDue]);

  // Cash change calculation
  const cashChange = Math.max(0, Math.round((cashTendered - paymentAmountInput) * 100) / 100);

  // Add a payment method to split list
  const handleAddPaymentLine = () => {
    if (paymentAmountInput <= 0) return;

    const actualAmount = Math.min(paymentAmountInput, remainingDue);
    const newPayment: BillPayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      method: selectedMethod,
      amount: actualAmount,
      timestamp: new Date().toISOString(),
      reference: paymentReference.trim() || undefined,
    };

    setPaymentsList([...paymentsList, newPayment]);
    setPaymentReference('');

    const nextRemaining = Math.max(0, Math.round((remainingDue - actualAmount) * 100) / 100);
    setPaymentAmountInput(nextRemaining);
    setCashTendered(nextRemaining);
  };

  const handleRemovePaymentLine = (id: string) => {
    setPaymentsList(paymentsList.filter((p) => p.id !== id));
  };

  const handleFinalize = async () => {
    // If not split yet but cash tendered covers the full bill, auto-add
    let finalPayments = [...paymentsList];
    if (finalPayments.length === 0 && paymentAmountInput >= totals.total) {
      finalPayments = [
        {
          id: `pay_${Date.now()}`,
          method: selectedMethod,
          amount: totals.total,
          timestamp: new Date().toISOString(),
          reference: paymentReference.trim() || undefined,
        },
      ];
    }

    const currentTotalPaid = finalPayments.reduce((acc, p) => acc + p.amount, 0);
    if (currentTotalPaid < totals.total) {
      alert(`Remaining balance: ${(totals.total - currentTotalPaid).toFixed(2)} ฿`);
      return;
    }

    setIsSubmitting(true);
    try {
      const paidBill = await completePayment(bill.id, finalPayments, discount);
      onPaymentSuccess(paidBill);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Payment completion failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-neutral-900">
                {t('paymentTitle')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-neutral-200 text-neutral-800">
                {bill.billNumber}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {bill.tableName ? `${t('table')} ${bill.tableName}` : 'Direct Order'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* Bill Totals & Discount Ribbon */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 space-y-2">
            <div className="flex justify-between items-center text-neutral-600">
              <span>{t('subtotal')} ({bill.items.length} {t('items')})</span>
              <span className="font-bold tabular-nums text-neutral-900">
                {totals.subtotal.toFixed(2)} ฿
              </span>
            </div>

            {/* Discount Row */}
            <div className="flex justify-between items-center text-neutral-600">
              <div className="flex items-center gap-1.5">
                <span>{t('discount')}</span>
                <input
                  type="number"
                  min="0"
                  max={totals.subtotal}
                  value={discount || ''}
                  placeholder="0"
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="w-20 rounded border border-neutral-300 bg-white px-2 py-0.5 text-xs font-semibold tabular-nums outline-hidden"
                />
                <span>฿</span>
              </div>
              <span className="font-bold tabular-nums text-rose-600">
                -{discount.toFixed(2)} ฿
              </span>
            </div>

            {/* Service Charge */}
            {totals.serviceChargeAmount > 0 && (
              <div className="flex justify-between items-center text-neutral-600">
                <span>
                  {t('serviceCharge')} ({bill.serviceChargePercent || store.settings.serviceChargePercent}%)
                </span>
                <span className="font-bold tabular-nums text-neutral-900">
                  +{totals.serviceChargeAmount.toFixed(2)} ฿
                </span>
              </div>
            )}

            {/* VAT */}
            {totals.vatAmount > 0 && (
              <div className="flex justify-between items-center text-neutral-600">
                <span>
                  {t('vat')} ({bill.vatPercent || store.settings.vatPercent}%)
                </span>
                <span className="font-bold tabular-nums text-neutral-900">
                  +{totals.vatAmount.toFixed(2)} ฿
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-neutral-200 flex justify-between items-center">
              <span className="font-bold text-sm text-neutral-900">{t('amountDue')}</span>
              <span className="font-extrabold text-lg text-neutral-900 tabular-nums">
                {totals.total.toFixed(2)} ฿
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-neutral-700 font-bold mb-2">
              {t('paymentMethod')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('cash')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  selectedMethod === 'cash'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="font-bold text-xs">{t('cash')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('qr')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  selectedMethod === 'qr'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="font-bold text-xs">{t('promptPayQr')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  selectedMethod === 'card'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="font-bold text-xs">{t('creditCard')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('transfer')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  selectedMethod === 'transfer'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="font-bold text-xs">{t('bankTransfer')}</span>
              </button>
            </div>
          </div>

          {/* CASH SPECIFIC INPUT & CHANGE CALCULATOR */}
          {selectedMethod === 'cash' && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-semibold mb-1">
                    {t('cashTendered')} (฿)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cashTendered || ''}
                    placeholder="0.00"
                    onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base font-bold tabular-nums outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 font-semibold mb-1">
                    {t('changeDue')}
                  </label>
                  <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base font-bold tabular-nums text-emerald-700">
                    {cashChange.toFixed(2)} ฿
                  </div>
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-neutral-400 font-medium mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => setCashTendered(remainingDue)}
                  className="px-2.5 py-1 rounded-lg border border-neutral-300 bg-white text-xs font-bold hover:bg-neutral-100"
                >
                  {t('exactCash')} ({remainingDue.toFixed(2)} ฿)
                </button>
                {[100, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCashTendered(preset)}
                    className="px-2.5 py-1 rounded-lg border border-neutral-300 bg-white text-xs font-bold hover:bg-neutral-100"
                  >
                    {preset} ฿
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QR SPECIFIC VIEW (Uploaded in Shop Settings) */}
          {selectedMethod === 'qr' && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              {store.settings.uploadedQrImage ? (
                <img
                  src={store.settings.uploadedQrImage}
                  alt="PromptPay QR"
                  className="w-32 h-32 rounded-xl object-contain border border-neutral-300 p-1 bg-white shadow-xs"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-400 p-2 bg-white">
                  <QrCode className="w-10 h-10 mb-1" />
                  <span className="text-[10px]">No QR in settings</span>
                </div>
              )}

              <div className="space-y-1">
                <span className="font-bold text-sm text-neutral-900 block">
                  Scan to Pay (PromptPay QR)
                </span>
                <p className="text-xs text-neutral-500">
                  Amount: <strong className="text-neutral-900 tabular-nums">{remainingDue.toFixed(2)} ฿</strong>
                </p>
                <p className="text-[10px] text-neutral-400">
                  Customer can scan the shop's PromptPay QR code on mobile banking.
                </p>
              </div>
            </div>
          )}

          {/* CARD OR TRANSFER REFERENCE INPUT */}
          {(selectedMethod === 'card' || selectedMethod === 'transfer') && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-2">
              <label className="block text-neutral-600 font-semibold">
                Transaction / Slip Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Card Auth 012934, Transfer Slip ID"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-medium outline-hidden"
              />
            </div>
          )}

          {/* SPLIT PAYMENT SUPPORT: List of added payments */}
          <div className="space-y-2 pt-1 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-700">{t('splitPayment')}</span>
              {remainingDue > 0 && paymentsList.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddPaymentLine}
                  className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('addPayment')}</span>
                </button>
              )}
            </div>

            {paymentsList.length > 0 && (
              <div className="space-y-1.5">
                {paymentsList.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold capitalize">{p.method}</span>
                      {p.reference && (
                        <span className="text-[10px] text-neutral-400">({p.reference})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold tabular-nums">{p.amount.toFixed(2)} ฿</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePaymentLine(p.id)}
                        className="text-neutral-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 block font-medium uppercase tracking-wider">
              {t('remainingAmount')}
            </span>
            <span
              className={`text-base font-extrabold tabular-nums ${
                remainingDue > 0 ? 'text-amber-800' : 'text-emerald-700'
              }`}
            >
              {remainingDue.toFixed(2)} ฿
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
              disabled={isSubmitting}
              onClick={handleFinalize}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isSubmitting ? 'Processing...' : t('completePayment')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
