import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Splash } from './components/Splash';
import { Login } from './pages/Login';
import { Catalog } from './pages/Catalog';
import { ProductDetails } from './pages/ProductDetails';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { OrderHistory } from './pages/OrderHistory';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminProducts } from './pages/AdminProducts';
import { AdminOrders } from './pages/AdminOrders';
import { AdminDealers } from './pages/AdminDealers';
import { AdminSettings } from './pages/AdminSettings';
import { AdminCompanies } from './pages/AdminCompanies';
import { AdminLayout } from './components/AdminLayout';
import { AllCompanies } from './pages/AllCompanies';
import { CompanyDetails } from './pages/CompanyDetails';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';

const App: React.FC = () => {
  const { currentView, user, setView } = useApp();

  React.useEffect(() => {
    if (currentView.startsWith('admin_') && (!user || user.role !== 'admin')) {
      setView('login');
    }
  }, [currentView, user, setView]);

  if (currentView === 'splash') {
    return <Splash />;
  }

  const isAdmin = currentView.startsWith('admin_') && user?.role === 'admin';

  // Helper to render the active view page
  const renderActiveView = () => {
    switch (currentView) {
      case 'catalog':
        return <Catalog />;
      case 'all_companies':
        return <AllCompanies />;
      case 'company_details':
        return <CompanyDetails />;
      case 'product_details':
        return <ProductDetails />;
      case 'cart':
        return <Cart />;
      case 'checkout':
        return <Checkout />;
      case 'order_confirmation':
        return <OrderConfirmation />;
      case 'orders':
        return <OrderHistory />;
      case 'profile':
        return <Profile />;
      case 'login':
      case 'register':
        return <Login />;
      case 'admin_dashboard':
        return <AdminDashboard />;
      case 'admin_products':
        return <AdminProducts />;
      case 'admin_companies':
        return <AdminCompanies />;
      case 'admin_orders':
        return <AdminOrders />;
      case 'admin_dealers':
        return <AdminDealers />;
      case 'admin_settings':
        return <AdminSettings />;
      default:
        return <Catalog />;
    }
  };

  if (isAdmin) {
    return (
      <AdminLayout>
        {renderActiveView()}
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-start md:py-6">
      {/* 
        Responsive Mobile Shell Container:
        - Limits width to 480px (standard phone viewport) when viewed on tablets/desktops.
        - Provides a gorgeous phone frame feel on wide screens, and is 100% full-screen on mobile!
      */}
      <div className="w-full max-w-[480px] min-h-screen md:min-h-[840px] md:h-[840px] bg-[#F7F9F7] flex flex-col relative overflow-hidden shadow-2xl md:rounded-3xl md:border-[8px] md:border-slate-800">
        
        {/* Top Header & Navbar */}
        <Navbar />

        {/* Scrollable Main Content Frame */}
        <main className="flex-1 overflow-y-auto flex flex-col pb-[72px]">
          {renderActiveView()}
        </main>

        {/* PWA In-App Install Prompt Banner */}
        <PwaInstallPrompt />

      </div>
    </div>
  );
};

export default App;
