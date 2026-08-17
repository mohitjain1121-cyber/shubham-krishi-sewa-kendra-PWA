import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ViewType } from '../context/AppContext';
import { LayoutDashboard, Database, ClipboardList, Users, Settings, LogOut, Menu, X, PackageOpen, Building2 } from 'lucide-react';
import { BUSINESS_CONFIG } from '../config/business';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, currentView, setView, logout } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { view: 'admin_dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
    { view: 'admin_products' as ViewType, label: 'Products', icon: Database },
    { view: 'admin_companies' as ViewType, label: 'Companies', icon: Building2 },
    { view: 'admin_orders' as ViewType, label: 'Orders', icon: ClipboardList },
    { view: 'admin_dealers' as ViewType, label: 'Dealers', icon: Users },
    { view: 'admin_settings' as ViewType, label: 'Settings', icon: Settings },
  ];

  // Helper to resolve the page title in header
  const getPageTitle = () => {
    switch (currentView) {
      case 'admin_dashboard': return 'Dashboard Overview';
      case 'admin_products': return 'Product Stock Manager';
      case 'admin_companies': return 'Company & Brand Directory';
      case 'admin_orders': return 'Dealer Order Requests';
      case 'admin_dealers': return 'Registered Dealer Directory';
      case 'admin_settings': return 'Wholesale Configurations';
      default: return 'Admin Console';
    }
  };

  const activeItem = menuItems.find(item => item.view === currentView);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Header Logo */}
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800 bg-slate-950/40">
        <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
          <PackageOpen className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[11px] sm:text-xs font-bold tracking-tight text-white leading-tight">
            {BUSINESS_CONFIG.name}
          </h1>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-full block mt-1 text-center uppercase tracking-wider">
            Wholesale Admin
          </span>
        </div>
      </div>

      {/* Nav Menu Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => {
                setView(item.view);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-green-700 text-white shadow-md'
                  : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20 space-y-3">
        {/* Admin Profile */}
        <div className="flex items-center space-x-3 p-3 bg-slate-850/50 rounded-xl border border-slate-800/80">
          <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center font-bold text-white shadow-inner text-sm uppercase">
            {user?.name ? user.name.slice(0, 2) : 'SK'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-100 truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@shubhamkrishisewa.com'}</p>
          </div>
        </div>

        {/* Logout Trigger */}
        <button
          onClick={logout}
          className="w-full bg-slate-800 hover:bg-rose-900/20 hover:text-rose-400 border border-slate-700/80 hover:border-rose-900/30 text-slate-400 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Panel</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex bg-slate-50 text-slate-800 font-sans">
      {/* Permanent Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-0 h-screen z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Slide-Over */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer Menu */}
          <div className="relative w-72 max-w-sm flex-1 flex flex-col bg-slate-900 animate-slide-right h-full">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-4">
            {/* Hamburger Trigger for Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-200 transition"
              aria-label="Toggle Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-black text-slate-800 text-base md:text-lg leading-tight">
                {getPageTitle()}
              </h2>
              {/* Breadcrumbs */}
              <div className="hidden sm:flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">
                <span>Console</span>
                <span>/</span>
                <span className="text-green-700">{activeItem?.label || 'View'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden md:flex flex-col text-right">
              <span className="font-bold text-slate-700">{user?.name || 'Administrator'}</span>
              <span className="text-[10px] text-slate-400 font-medium">B2B Wholesaler Manager</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-green-50 border border-green-200 text-green-700 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user?.name ? user.name.slice(0,2) : 'AD'}
            </div>
          </div>
        </header>

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};
