/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Backup & Restore Page
 * Export all restaurant data into a single JSON file and restore back with schema validation.
 */

import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const BackupPage: React.FC = () => {
  const { store, exportBackup, importBackup, resetToEmptyStore, seedTinyExample } = useStore();
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const handleExportDownload = () => {
    const jsonStr = exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `kind-restaurant-backup-${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        setImportJsonText(text);
        try {
          await importBackup(text);
          setImportStatus({ success: true, message: 'Backup restored successfully!' });
        } catch (err) {
          setImportStatus({
            success: false,
            message: err instanceof Error ? err.message : 'Invalid backup file',
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleManualImport = async () => {
    if (!importJsonText.trim()) return;
    try {
      await importBackup(importJsonText);
      setImportStatus({ success: true, message: 'Backup restored successfully!' });
    } catch (err) {
      setImportStatus({
        success: false,
        message: err instanceof Error ? err.message : 'Invalid backup JSON',
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <h2 className="text-sm font-bold text-neutral-900">Database Backup &amp; Disaster Recovery</h2>
        <p className="text-xs text-neutral-500">
          Export complete restaurant store into an audited JSON snapshot, or import back to restore all tables, dishes, ingredients, and bills.
        </p>
      </div>

      {/* Summary of current database contents */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
          Current Live Store Statistics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
            <span className="text-neutral-500 block text-[10px]">Ingredients</span>
            <span className="font-bold text-neutral-900 tabular-nums">
              {store.ingredients.length} items
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
            <span className="text-neutral-500 block text-[10px]">Menu Dishes</span>
            <span className="font-bold text-neutral-900 tabular-nums">{store.dishes.length} dishes</span>
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
            <span className="text-neutral-500 block text-[10px]">Dining Tables</span>
            <span className="font-bold text-neutral-900 tabular-nums">{store.tables.length} tables</span>
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
            <span className="text-neutral-500 block text-[10px]">Bills &amp; Orders</span>
            <span className="font-bold text-neutral-900 tabular-nums">{store.bills.length} bills</span>
          </div>
        </div>
      </div>

      {/* Export & Import actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm mb-1">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Database JSON</span>
            </div>
            <p className="text-xs text-neutral-500">
              Downloads a standalone JSON file containing your settings, ingredients, recipes, tables, option groups, and bills.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportDownload}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup (.json)</span>
          </button>
        </div>

        {/* Import File Card */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm mb-1">
              <Upload className="w-4 h-4 text-amber-600" />
              <span>Restore from Backup File</span>
            </div>
            <p className="text-xs text-neutral-500">
              Select a previously exported <code>.json</code> backup to restore all restaurant data.
            </p>
          </div>

          <label className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 cursor-pointer transition-colors">
            <FileJson className="w-4 h-4 text-neutral-500" />
            <span>Select JSON File</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Status banner */}
      {importStatus && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            importStatus.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {importStatus.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Manual JSON Editor & Reset Options */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider text-neutral-500">
          Direct JSON Import &amp; Reset Tools
        </h3>

        <div>
          <label className="block text-neutral-600 mb-1">Paste JSON Content</label>
          <textarea
            rows={5}
            placeholder="Paste raw exported backup JSON here..."
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            className="w-full font-mono text-[11px] rounded-lg border border-neutral-300 p-2.5 outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => seedTinyExample()}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 font-semibold hover:bg-amber-100 transition-colors"
            >
              Re-seed 1 Tiny Example
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to clear all data to completely blank?')) {
                  resetToEmptyStore();
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Clear to Empty Store
            </button>
          </div>

          <button
            type="button"
            onClick={handleManualImport}
            disabled={!importJsonText.trim()}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-30"
          >
            Import Pasted JSON
          </button>
        </div>
      </div>
    </div>
  );
};
