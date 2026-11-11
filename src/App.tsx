/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Restaurant POS & Food Cost Application
 * Main Application Shell & Navigation Router
 */

import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Sidebar, PageId } from './components/navigation/Sidebar';
import { TopBar } from './components/navigation/TopBar';
import { LoginModal } from './components/auth/LoginModal';
import { TablesPosPage } from './pages/TablesPosPage';
import { BillsHistoryPage } from './pages/BillsHistoryPage';
import { MenuPage } from './pages/MenuPage';
import { OptionGroupsPage } from './pages/foodcost/OptionGroupsPage';
import { IngredientsPage } from './pages/foodcost/IngredientsPage';
import { SubRecipesPage } from './pages/foodcost/SubRecipesPage';
import { RecipesPage } from './pages/foodcost/RecipesPage';
import { PackagingPage } from './pages/foodcost/PackagingPage';
import { SalesChannelsPage } from './pages/finance/SalesChannelsPage';
import { ExpensesPage } from './pages/finance/ExpensesPage';
import { LaborPage } from './pages/finance/LaborPage';
import { PnlPage } from './pages/finance/PnlPage';
import { BreakEvenPage } from './pages/finance/BreakEvenPage';
import { DashboardPage } from './pages/finance/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CalculationTestsPage } from './pages/CalculationTestsPage';
import { BackupPage } from './pages/BackupPage';
import { AlertCircle, X, Sparkles } from 'lucide-react';

function MainAppShell() {
  // App opens on the Tables page by default as specified in requirements
  const [currentPage, setCurrentPage] = useState<PageId>('tables');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const { error, dismissError, loading } = useStore();

  const renderActivePage = () => {
    switch (currentPage) {
      case 'tables':
        return <TablesPosPage />;
      case 'bills':
        return <BillsHistoryPage />;
      case 'menu':
        return <MenuPage />;
      case 'option_groups':
        return <OptionGroupsPage />;
      case 'ingredients':
        return <IngredientsPage />;
      case 'subrecipes':
        return <SubRecipesPage />;
      case 'recipes':
        return <RecipesPage />;
      case 'packaging':
        return <PackagingPage />;
      case 'sales_channels':
        return <SalesChannelsPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'labor':
        return <LaborPage />;
      case 'pnl':
        return <PnlPage />;
      case 'breakeven':
        return <BreakEvenPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'tests':
        return <CalculationTestsPage />;
      case 'backup':
        return <BackupPage />;
      default:
        return <TablesPosPage />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans">
      {/* Slide-out Left Sidebar hidden behind hamburger */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
      />

      {/* Top Bar Contract */}
      <TopBar
        onOpenSidebar={() => setIsSidebarOpen(true)}
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Concurrency Conflict or Global Error Notification */}
      {error && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={dismissError}
            className="p-1 hover:bg-rose-100 rounded text-rose-600 transition-colors"
            title="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Viewport Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-neutral-400">Loading KinD Store...</p>
            </div>
          </div>
        ) : (
          renderActivePage()
        )}
      </main>

      {/* Google Sign-in Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainAppShell />
    </StoreProvider>
  );
}
