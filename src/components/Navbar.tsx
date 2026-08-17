import React from 'react';
import { useApp } from '../context/AppContext';
import type { ViewType } from '../context/AppContext';
import { ShoppingCart, Home, ClipboardList, User, LayoutDashboard, Database, Settings, PackageOpen, Users } from 'lucide-react';
import { BUSINESS_CONFIG } from '../config/business';

export const Navbar: React.FC = () => {
  const { user, cart, currentView, setView } = useApp();

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const isAdmin = user && user.role === 'admin';

  interface TabItem {
    view: ViewType;
    label: string;
    icon: React.ComponentType<any>;
    requiresAuth?: boolean;
  }

  // Bottom Navigation configuration based on user type
  const dealerTabs: TabItem[] = [
    { view: 'catalog', label: 'Home', icon: Home },
    { view: 'orders', label: 'My Orders', icon: ClipboardList, requiresAuth: true },
    { view: 'profile', label: 'Account', icon: User, requiresAuth: true },
  ];

  const adminTabs: TabItem[] = [
    { view: 'admin_dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'admin_products', label: 'Products', icon: Database },
    { view: 'admin_orders', label: 'Orders', icon: ClipboardList },
    { view: 'admin_dealers', label: 'Dealers', icon: Users },
    { view: 'admin_settings', label: 'Settings', icon: Settings },
  ];

  const tabs = isAdmin ? adminTabs : dealerTabs;

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-150 shadow-xs px-3.5 h-[60px] flex items-center justify-between">
        <div 
          className="flex items-center space-x-2.5 cursor-pointer min-w-0 pr-2 h-full" 
          onClick={() => setView(isAdmin ? 'admin_dashboard' : 'catalog')}
        >
          {/* Logo container: 42px */}
          <div className="w-[42px] h-[42px] bg-green-50 text-[#12873A] flex items-center justify-center rounded-xl border border-green-100 shrink-0">
            <PackageOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold tracking-tight leading-none text-slate-800 truncate">
              {BUSINESS_CONFIG.name}
            </h1>
            {isAdmin && (
              <span className="text-[8px] bg-amber-500 text-neutral-950 font-black px-1 rounded block mt-0.5 text-center tracking-wider w-fit">
                ADMIN PANEL
              </span>
            )}
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-1.5 h-full">
          {!isAdmin && (
            <button
              onClick={() => setView('cart')}
              className="relative w-11 h-11 flex items-center justify-center text-slate-650 hover:text-[#12873A] hover:bg-slate-50 rounded-full transition-colors focus:outline-none shrink-0"
              aria-label="View Cart"
            >
              <ShoppingCart className="w-6 h-6 text-slate-600" />
              {getCartCount() > 0 && (
                <span className="absolute top-[6px] right-[6px] bg-[#12873A] text-white font-bold text-[11px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white px-1 shadow-sm leading-none z-10 pointer-events-none">
                  {getCartCount() > 99 ? '99+' : getCartCount()}
                </span>
              )}
            </button>
          )}

          {!user && currentView !== 'login' && currentView !== 'register' && (
            <button
              onClick={() => setView('login')}
              className="bg-[#12873A] hover:bg-[#16A34A] text-white px-4 h-10 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* Bottom Sticky Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-150 shadow-lg px-2 h-[58px] max-w-[480px] mx-auto flex justify-around items-center">
        {tabs.map(tab => {
          const Icon = tab.icon;
          // Hide tabs that require authentication for guest users
          if (!isAdmin && tab.requiresAuth && !user) {
            return null;
          }

          const isActive = currentView === tab.view || 
            (tab.view === 'catalog' && (
              currentView === 'product_details' || 
              currentView === 'cart' || 
              currentView === 'checkout' || 
              currentView === 'order_confirmation' ||
              currentView === 'all_companies' ||
              currentView === 'company_details'
            ));

          return (
            <button
              key={tab.view}
              onClick={() => setView(tab.view)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 focus:outline-none ${
                isActive ? 'text-[#12873A] font-bold' : 'text-slate-450 hover:text-slate-600 font-medium'
              }`}
            >
              <Icon className={`w-5.5 h-5.5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110 text-[#12873A]' : 'text-slate-400'}`} />
              <span className="text-[11px] tracking-wide leading-none">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
