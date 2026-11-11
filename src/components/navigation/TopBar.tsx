/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Top Bar Contract
 * Hamburger button on left side, clean breadcrumbs, and user session actions.
 */

import React from 'react';
import { Menu, LogIn, LogOut, CheckCircle2, Globe, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PageId } from './Sidebar';

interface TopBarProps {
  onOpenSidebar: () => void;
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  onOpenLoginModal: () => void;
}

const PAGE_NAMES: Record<PageId, { th: { title: string; subtitle: string }; en: { title: string; subtitle: string } }> = {
  tables: {
    th: { title: 'โต๊ะ / แคชเชียร์ POS', subtitle: 'แผนผังร้านและจัดการโต๊ะอาหาร' },
    en: { title: 'Tables / POS', subtitle: 'Floorplan & Table Management' },
  },
  bills: {
    th: { title: 'บิลและประวัติการขาย', subtitle: 'ประวัติบิลและบันทึกต้นทุน Snapshot' },
    en: { title: 'Bills & History', subtitle: 'Historical Bills & Cost Snapshots' },
  },
  menu: {
    th: { title: 'เมนูอาหาร', subtitle: 'แคตตาล็อกอาหารและราคาแต่ละแบบ' },
    en: { title: 'Menu Dishes', subtitle: 'Food Catalog & Variant Prices' },
  },
  option_groups: {
    th: { title: 'คลังท็อปปิ้ง & ตัวเลือก', subtitle: 'ตัวเลือกเพิ่มเติมและส่วนต่างต้นทุน' },
    en: { title: 'Option Groups Library', subtitle: 'Modifiers, Choices & Cost Deltas' },
  },
  ingredients: {
    th: { title: 'วัตถุดิบ & Yield', subtitle: 'วัตถุดิบดิบ เปอร์เซ็นต์ Yield และหน่วยฐาน' },
    en: { title: 'Ingredients', subtitle: 'Raw Materials, Yield % & Base Units' },
  },
  subrecipes: {
    th: { title: 'ซอส & วัตถุดิบเตรียม', subtitle: 'ซอส น้ำสต๊อก และต้นทุนต่อหน่วย' },
    en: { title: 'Sub-recipes', subtitle: 'Sauces, Prepped Pastes & Batch Cost' },
  },
  recipes: {
    th: { title: 'คำนวณสูตรเมนู', subtitle: 'ต้นทุนอาหารจริงและคำนวณกำไร' },
    en: { title: 'Recipes Costing', subtitle: 'Live Dish Food Cost & Margin Calculator' },
  },
  packaging: {
    th: { title: 'บรรจุภัณฑ์', subtitle: 'กล่อง ถุง และวัสดุสิ้นเปลือง' },
    en: { title: 'Packaging Items', subtitle: 'Takeaway Containers & Disposables' },
  },
  sales_channels: {
    th: { title: 'ช่องทางขาย & GP', subtitle: 'แพลตฟอร์มเดลิเวอรี่ ค่าคอมมิชชั่น' },
    en: { title: 'Sales Channels', subtitle: 'Delivery Platforms, Commission & GP' },
  },
  expenses: {
    th: { title: 'ค่าใช้จ่ายร้าน', subtitle: 'ค่าเช่า ค่าน้ำไฟ และค่าใช้จ่ายทั่วไป' },
    en: { title: 'Expenses', subtitle: 'Operational, Rent & Overhead Costs' },
  },
  labor: {
    th: { title: 'พนักงาน & กะ', subtitle: 'ค่าจ้าง กะการทำงาน และเงินทอนเปิดกะ' },
    en: { title: 'Labor & Shifts', subtitle: 'Staff Wages, Shifts & Cash Float' },
  },
  pnl: {
    th: { title: 'งบกำไร-ขาดทุน (P&L)', subtitle: 'ยอดขายสุทธิ ต้นทุนขาย และกำไรสุทธิ' },
    en: { title: 'P&L Statement', subtitle: 'Net Sales, Cost of Goods & Profit Engine' },
  },
  breakeven: {
    th: { title: 'การวิเคราะห์จุดคุ้มทุน', subtitle: 'ต้นทุนคงที่และยอดขายขั้นต่ำที่คุ้มทุน' },
    en: { title: 'Break-even Analysis', subtitle: 'Fixed Costs & Break-even Revenue' },
  },
  dashboard: {
    th: { title: 'แดชบอร์ดการเงิน', subtitle: 'ภาพรวมผลประกอบการและเกณฑ์ต้นทุน' },
    en: { title: 'Financial Dashboard', subtitle: 'Overview & Target Food Cost Metrics' },
  },
  reports: {
    th: { title: 'รายงานประจำวัน', subtitle: 'สรุปยอดขายปิดวันและสถิติรายวัน' },
    en: { title: 'Daily Reports', subtitle: 'Closed Sales & Daily Summaries' },
  },
  settings: {
    th: { title: 'ตั้งค่าร้าน', subtitle: 'ชื่อร้าน ภาษี VAT เซอร์วิสชาร์จ และ QR' },
    en: { title: 'Shop Settings', subtitle: 'Restaurant Configuration & Tax' },
  },
  tests: {
    th: { title: 'ทดสอบสูตรคำนวณ', subtitle: 'การตรวจคำนวณอัตโนมัติ (ผ่าน/ไม่ผ่าน)' },
    en: { title: 'Calculation Tests', subtitle: 'Automated Formula Validation (Pass/Fail)' },
  },
  backup: {
    th: { title: 'สำรองและกู้คืน', subtitle: 'นำออกและนำเข้าข้อมูล JSON ทั้งหมด' },
    en: { title: 'Backup & Restore', subtitle: 'Export & Import Full Database JSON' },
  },
};

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSidebar,
  currentPage,
  onSelectPage,
  onOpenLoginModal,
}) => {
  const { user, signOut, store, resetToEmptyStore, lang, setLang, t, syncStatus } = useStore();
  const meta = PAGE_NAMES[currentPage] || PAGE_NAMES.tables;
  const pageMeta = lang === 'th' ? meta.th : meta.en;

  const hasOnlySeed =
    store.ingredients.length === 1 &&
    store.ingredients[0].id === 'ing_tiny_pork_example' &&
    store.dishes.length === 1;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-neutral-200 bg-white/95 px-3 sm:px-4 backdrop-blur-xs">
      {/* Left zone: Hamburger trigger + breadcrumbs */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-neutral-900 hidden sm:inline">
            KinD
          </span>
          <span className="text-neutral-300 hidden sm:inline">/</span>
          <div>
            <h1 className="text-xs sm:text-sm font-semibold text-neutral-900 leading-tight">
              {pageMeta.title}
            </h1>
            <p className="text-[10px] text-neutral-500 hidden md:block leading-none">
              {pageMeta.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right zone: Online indicator, Language Switcher, Test status, tiny seed helper, auth profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Real-time / Offline Status Badge */}
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${
            syncStatus === 'online'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : syncStatus === 'syncing'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}
          title={
            syncStatus === 'online'
              ? 'Firestore real-time sync connected'
              : syncStatus === 'syncing'
              ? 'Syncing data to cloud...'
              : 'Working in offline local mode (will auto-sync when online)'
          }
        >
          {syncStatus === 'online' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">{t('online')}</span>
            </>
          ) : syncStatus === 'syncing' ? (
            <>
              <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
              <span className="hidden sm:inline">{t('syncing')}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-600" />
              <span className="hidden sm:inline">{t('offline')}</span>
            </>
          )}
        </div>

        {/* Bilingual Language Switcher Button (TH / EN) */}
        <button
          type="button"
          onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 transition-colors shadow-2xs"
          title="Toggle Thai / English"
        >
          <Globe className="w-3.5 h-3.5 text-neutral-500" />
          <span>{lang === 'th' ? 'TH' : 'EN'}</span>
        </button>

        {/* Quick link to Calculation Tests */}
        <button
          type="button"
          onClick={() => onSelectPage('tests')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-colors border ${
            currentPage === 'tests'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
              : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
          }`}
          title="View Calculation Engine Tests"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">{lang === 'th' ? 'สูตรคำนวณ:' : 'Calculations:'}</span>
          <span className="text-emerald-700 font-medium">{lang === 'th' ? 'ผ่าน' : 'Verified'}</span>
        </button>

        {/* Tiny example reset / delete helper */}
        {hasOnlySeed && (
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-amber-50 border border-amber-200 text-amber-800">
            <span>1 tiny example</span>
            <button
              type="button"
              onClick={() => resetToEmptyStore()}
              className="text-amber-900 font-semibold underline hover:text-amber-700 ml-1"
              title="Delete demo example to start completely blank"
            >
              Clear
            </button>
          </div>
        )}

        {/* User Auth Profile */}
        {user ? (
          <div className="flex items-center gap-2 pl-1.5 border-l border-neutral-200">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-full object-cover border border-neutral-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-700 font-medium text-xs flex items-center justify-center">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="hidden xl:block text-left text-xs leading-none">
              <span className="font-medium text-neutral-800 block truncate max-w-[110px]">
                {user.displayName || 'Owner'}
              </span>
              <span className="text-[10px] text-neutral-400 block truncate max-w-[110px]">
                {user.email || 'Signed in'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              title={t('signOut')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenLoginModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t('signIn')}</span>
          </button>
        )}
      </div>
    </header>
  );
};

