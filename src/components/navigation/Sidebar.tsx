/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Left Navigation Sidebar
 * Hidden behind a hamburger menu on the left side.
 */

import React from 'react';
import {
  LayoutGrid,
  Receipt,
  UtensilsCrossed,
  Wheat,
  CookingPot,
  BookOpen,
  Package,
  Layers,
  Store,
  DollarSign,
  Users,
  TrendingUp,
  Scale,
  BarChart3,
  FileSpreadsheet,
  Settings,
  CheckCircle2,
  Database,
  X,
  Sparkles,
} from 'lucide-react';

export type PageId =
  | 'tables'
  | 'bills'
  | 'menu'
  | 'option_groups'
  | 'ingredients'
  | 'subrecipes'
  | 'recipes'
  | 'packaging'
  | 'sales_channels'
  | 'expenses'
  | 'labor'
  | 'pnl'
  | 'breakeven'
  | 'dashboard'
  | 'reports'
  | 'settings'
  | 'tests'
  | 'backup';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
}

interface NavItem {
  id: PageId;
  label: string;
  labelTh: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'POS Operations',
    items: [
      { id: 'tables', label: 'Tables / POS', labelTh: 'จัดการโต๊ะ / หน้าร้าน', icon: LayoutGrid },
      { id: 'bills', label: 'Bills & History', labelTh: 'บิลและประวัติการขาย', icon: Receipt },
    ],
  },
  {
    title: 'Menu & Library',
    items: [
      { id: 'menu', label: 'Menu Dishes', labelTh: 'เมนูอาหาร', icon: UtensilsCrossed },
      { id: 'option_groups', label: 'Option Groups', labelTh: 'คลังท็อปปิ้ง & ตัวเลือก', icon: Layers },
    ],
  },
  {
    title: 'Food Cost System',
    items: [
      { id: 'ingredients', label: 'Ingredients', labelTh: 'วัตถุดิบ & Yield', icon: Wheat },
      { id: 'subrecipes', label: 'Sub-recipes', labelTh: 'ซอส & วัตถุดิบเตรียม', icon: CookingPot },
      { id: 'recipes', label: 'Recipes Costing', labelTh: 'คำนวณต้นทุนเมนู', icon: BookOpen },
      { id: 'packaging', label: 'Packaging', labelTh: 'บรรจุภัณฑ์', icon: Package },
    ],
  },
  {
    title: 'Finance & Performance',
    items: [
      { id: 'dashboard', label: 'Dashboard', labelTh: 'ภาพรวมยอดขาย & กำไร', icon: BarChart3 },
      { id: 'sales_channels', label: 'Sales Channels', labelTh: 'ช่องทางขาย & GP', icon: Store },
      { id: 'expenses', label: 'Expenses', labelTh: 'ค่าใช้จ่ายร้าน', icon: DollarSign },
      { id: 'labor', label: 'Labor & Shifts', labelTh: 'พนักงาน & กะทำงาน', icon: Users },
      { id: 'pnl', label: 'P&L Statement', labelTh: 'กำไร-ขาดทุน', icon: TrendingUp },
      { id: 'breakeven', label: 'Break-even', labelTh: 'จุดคุ้มทุน', icon: Scale },
    ],
  },
  {
    title: 'System & Tools',
    items: [
      { id: 'reports', label: 'Reports', labelTh: 'รายงานสรุปประจำวัน', icon: FileSpreadsheet },
      { id: 'tests', label: 'Calculation Tests', labelTh: 'ทดสอบสูตรคำนวณ', icon: CheckCircle2, badge: 'Verified' },
      { id: 'backup', label: 'Backup & Restore', labelTh: 'สำรองข้อมูล JSON', icon: Database },
      { id: 'settings', label: 'Settings', labelTh: 'ตั้งค่าร้าน & VAT', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPage,
  onSelectPage,
}) => {
  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-xs transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out drawer on left */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-76 flex-col bg-white border-r border-neutral-200 shadow-xl transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-lg shadow-xs">
              K
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-neutral-900 block leading-tight">
                KinD <span className="text-amber-600 font-semibold text-xs ml-1">POS &amp; Cost</span>
              </span>
              <span className="text-[11px] text-neutral-400 block leading-none">กินดี ฟู้ดคอสท์</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Close menu (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectPage(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-amber-50 text-amber-900 font-semibold'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-amber-600' : 'text-neutral-400'
                        }`}
                      />
                      <div className="truncate">
                        <span className="block truncate">{item.label}</span>
                        <span className="text-[10px] text-neutral-400 block leading-none truncate">
                          {item.labelTh}
                        </span>
                      </div>
                    </div>
                    {item.badge && (
                      <span className="ml-2 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 rounded">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>KinD POS &amp; Food Cost</span>
            <span className="text-amber-600 font-semibold">Step 3 POS Selling</span>
          </div>
        </div>
      </aside>
    </>
  );
};
