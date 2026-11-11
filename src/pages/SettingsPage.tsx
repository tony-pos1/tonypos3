/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Shop Settings Page
 * Manage VAT %, Service Charge %, Daily closing time, Target food cost %, and QR code.
 */

import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, QrCode, Store, Percent, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ShopSettings } from '../types/models';

export const SettingsPage: React.FC = () => {
  const { store, saveSettings } = useStore();

  const [restaurantName, setRestaurantName] = useState(store.settings.restaurantName);
  const [vatPercent, setVatPercent] = useState(store.settings.vatPercent);
  const [serviceChargePercent, setServiceChargePercent] = useState(
    store.settings.serviceChargePercent
  );
  const [dailyClosingTime, setDailyClosingTime] = useState(store.settings.dailyClosingTime);
  const [targetFoodCostPercent, setTargetFoodCostPercent] = useState(
    store.settings.targetFoodCostPercent
  );
  const [qrImage, setQrImage] = useState(store.settings.uploadedQrImage || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ShopSettings = {
      ...store.settings,
      restaurantName: restaurantName.trim(),
      vatPercent: Number(vatPercent) || 0,
      serviceChargePercent: Number(serviceChargePercent) || 0,
      dailyClosingTime,
      targetFoodCostPercent: Number(targetFoodCostPercent) || 30,
      uploadedQrImage: qrImage,
      version: store.settings.version + 1,
      updatedAt: new Date().toISOString(),
    };

    await saveSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setQrImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-5 pb-12 max-w-4xl mx-auto">
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <h2 className="text-sm font-bold text-neutral-900">Shop Settings &amp; Tax Engine</h2>
        <p className="text-xs text-neutral-500">
          Configure restaurant branding, default VAT %, service charge %, and target food cost threshold.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Restaurant Identity */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider text-neutral-500">
            Store Identity &amp; Schedule
          </h3>

          <div>
            <label className="block text-neutral-600 mb-1">Restaurant Name</label>
            <input
              type="text"
              required
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-medium text-xs outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-600 mb-1">Daily Closing Time</label>
              <div className="flex items-center rounded-lg border border-neutral-300 px-3 py-1.5 bg-white">
                <Clock className="w-4 h-4 text-neutral-400 mr-2" />
                <input
                  type="time"
                  value={dailyClosingTime}
                  onChange={(e) => setDailyClosingTime(e.target.value)}
                  className="w-full text-xs font-semibold outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-600 mb-1">Target Food Cost % Limit</label>
              <div className="flex items-center rounded-lg border border-neutral-300 px-3 py-1.5 bg-white">
                <input
                  type="number"
                  min="5"
                  max="80"
                  value={targetFoodCostPercent}
                  onChange={(e) => setTargetFoodCostPercent(Number(e.target.value))}
                  className="w-full text-xs font-semibold outline-hidden"
                />
                <span className="text-xs text-neutral-400 ml-1">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Taxes & Charges */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider text-neutral-500">
            Taxes &amp; Service Charge Engine
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-600 mb-1">VAT Percentage (%)</label>
              <div className="flex items-center rounded-lg border border-neutral-300 px-3 py-1.5 bg-white">
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={vatPercent}
                  onChange={(e) => setVatPercent(Number(e.target.value))}
                  className="w-full text-xs font-semibold outline-hidden"
                />
                <span className="text-xs text-neutral-400 ml-1">%</span>
              </div>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                Standard in Thailand: 7% (Net price excludes VAT)
              </span>
            </div>

            <div>
              <label className="block text-neutral-600 mb-1">Service Charge Percentage (%)</label>
              <div className="flex items-center rounded-lg border border-neutral-300 px-3 py-1.5 bg-white">
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={serviceChargePercent}
                  onChange={(e) => setServiceChargePercent(Number(e.target.value))}
                  className="w-full text-xs font-semibold outline-hidden"
                />
                <span className="text-xs text-neutral-400 ml-1">%</span>
              </div>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                Standard dining: 0% or 10%
              </span>
            </div>
          </div>
        </div>

        {/* Payment QR Image */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider text-neutral-500">
            PromptPay / Bank Transfer QR Image
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {qrImage ? (
              <img
                src={qrImage}
                alt="QR Code"
                className="w-28 h-28 object-contain rounded-lg border border-neutral-200 p-1 bg-white"
              />
            ) : (
              <div className="w-28 h-28 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400">
                <QrCode className="w-8 h-8 mb-1" />
                <span className="text-[10px]">No QR code</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="inline-block px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 font-semibold cursor-pointer">
                Upload QR Code Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="hidden"
                />
              </label>
              {qrImage && (
                <button
                  type="button"
                  onClick={() => setQrImage('')}
                  className="block text-[11px] text-rose-600 hover:underline"
                >
                  Remove QR image
                </button>
              )}
              <span className="text-[10px] text-neutral-400 block">
                Shown to customers during checkout on bill payments.
              </span>
            </div>
          </div>
        </div>

        {/* Save button ribbon */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>Shop settings saved successfully!</span>
            </span>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
