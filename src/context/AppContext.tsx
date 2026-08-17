import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { UserProfile, Product, Order, SystemSettings, ProductVariant } from '../services/db';

interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export type ViewType =
  | 'splash'
  | 'login'
  | 'register'
  | 'catalog'
  | 'product_details'
  | 'cart'
  | 'checkout'
  | 'order_confirmation'
  | 'orders'
  | 'profile'
  | 'admin_dashboard'
  | 'admin_products'
  | 'admin_companies'
  | 'admin_orders'
  | 'admin_dealers'
  | 'admin_settings'
  | 'all_companies'
  | 'company_details';

interface AppContextType {
  user: UserProfile | null;
  cart: CartItem[];
  currentView: ViewType;
  selectedProductId: string | null;
  selectedOrderId: string | null;
  selectedCompanyId: string | null;
  activeOrder: Order | null;
  searchQuery: string;
  selectedCategory: string;
  selectedCompanyFilter: string;
  settings: SystemSettings;
  
  // Auth actions
  login: (loginVal: string, passwordVal?: string) => { success: boolean; error?: string };
  register: (dealerData: Omit<UserProfile, 'id' | 'role' | 'createdAt'>) => { success: boolean; error?: string };
  logout: () => void;
  
  // Navigation actions
  setView: (view: ViewType) => void;
  selectProduct: (id: string | null) => void;
  selectOrder: (id: string | null) => void;
  selectCompany: (id: string | null) => void;
  
  // Cart actions
  addToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  updateCartQuantity: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  
  // Order actions
  placeOrder: (paymentMethod: 'pay_now' | 'pay_later') => { success: boolean; order?: Order; error?: string };
  repeatOrder: (order: Order) => { success: boolean; addedCount: number; unavailableCount: number };
  
  // State search queries
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;
  setSelectedCompanyFilter: (id: string) => void;
  
  // Settings
  reloadSettings: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentView, setViewInternal] = useState<ViewType>('splash');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('');
  const [settings, setSettings] = useState<SystemSettings>(dbService.getSettings());

  // Check active session on startup
  useEffect(() => {
    const session = dbService.getCurrentSession();
    if (session) {
      setUser(session);
      // Wait for splash before redirecting
      setTimeout(() => {
        if (session.role === 'admin') {
          setViewInternal('admin_dashboard');
        } else {
          setViewInternal('catalog');
        }
      }, 2000);
    } else {
      setTimeout(() => {
        setViewInternal('catalog');
      }, 2500);
    }
  }, []);

  const setView = (view: ViewType) => {
    // Reset view specific filters if changing tabs
    if (view === 'catalog') {
      setSelectedProductId(null);
      setSelectedCompanyId(null);
    }
    setViewInternal(view);
  };

  const selectProduct = (id: string | null) => {
    setSelectedProductId(id);
    if (id) setViewInternal('product_details');
  };

  const selectOrder = (id: string | null) => {
    setSelectedOrderId(id);
  };

  const selectCompany = (id: string | null) => {
    setSelectedCompanyId(id);
    if (id) setViewInternal('company_details');
  };

  const login = (loginVal: string, passwordVal?: string) => {
    const res = dbService.login(loginVal, passwordVal);
    if (res.success && res.user) {
      setUser(res.user);
      setCart([]); // Clear guest cart if logging in
      if (res.user.role === 'admin') {
        setViewInternal('admin_dashboard');
      } else {
        setViewInternal('catalog');
      }
    }
    return { success: res.success, error: res.error };
  };

  const register = (dealerData: Omit<UserProfile, 'id' | 'role' | 'createdAt'>) => {
    const res = dbService.register(dealerData);
    if (res.success && res.user) {
      setUser(res.user);
      setCart([]);
      setViewInternal('catalog');
    }
    return { success: res.success, error: res.error };
  };

  const logout = () => {
    dbService.logout();
    setUser(null);
    setCart([]);
    setViewInternal('catalog');
  };

  // Cart Management
  const addToCart = (product: Product, variant: ProductVariant, quantity: number) => {
    const dealerPrice = dbService.getDealerPrice(user?.id, variant);
    const variantWithDealerPrice = {
      ...variant,
      price: dealerPrice
    };

    setCart(prev => {
      const existing = prev.find(item => item.variant.id === variant.id);
      if (existing) {
        return prev.map(item =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + quantity, variant: variantWithDealerPrice }
            : item
        );
      }
      return [...prev, { product, variant: variantWithDealerPrice, quantity }];
    });
  };

  const updateCartQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.variant.id === variantId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart(prev => prev.filter(item => item.variant.id !== variantId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Order Placement
  const placeOrder = (paymentMethod: 'pay_now' | 'pay_later') => {
    if (!user) {
      return { success: false, error: "Please log in to place an order" };
    }
    
    if (cart.length === 0) {
      return { success: false, error: "Cart is empty" };
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0);
    const total = subtotal; // No taxes/shipping in Phase 1
    
    const res = dbService.createOrder({
      dealerId: user.id,
      dealerName: user.name,
      shopName: user.shopName,
      paymentMethod,
      subtotal,
      total
    }, cart);
    
    if (res.success && res.order) {
      setActiveOrder(res.order);
      setCart([]); // Clear cart
      setViewInternal('order_confirmation');
    }
    
    return { success: res.success, order: res.order, error: res.error };
  };

  // Repeat Order
  const repeatOrder = (order: Order) => {
    if (!order.items) return { success: false, addedCount: 0, unavailableCount: 0 };
    
    // Fetch fresh product availability from simulated DB
    const freshProducts = dbService.getProducts(false); // only non-archived
    const allVariants: ProductVariant[] = JSON.parse(localStorage.getItem('ad_product_variants') || '[]');
    let addedCount = 0;
    let unavailableCount = 0;
    
    order.items.forEach(item => {
      // Find matching active product
      const parentProduct = freshProducts.find((product: Product) => product.id === item.productId);
      // Find matching active & available variant
      const variant = allVariants.find(v => v.id === item.variantId && !v.archived && v.available);
      
      if (parentProduct && variant) {
        addToCart(parentProduct, variant, item.quantity);
        addedCount++;
      } else {
        unavailableCount++;
      }
    });
    
    if (addedCount > 0) {
      setViewInternal('cart');
    }
    
    return { success: true, addedCount, unavailableCount };
  };

  const reloadSettings = () => {
    setSettings(dbService.getSettings());
  };

  return (
    <AppContext.Provider
      value={{
        user,
        cart,
        currentView,
        selectedProductId,
        selectedOrderId,
        selectedCompanyId,
        activeOrder,
        searchQuery,
        selectedCategory,
        settings,
        login,
        register,
        logout,
        setView,
        selectProduct,
        selectOrder,
        selectCompany,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
        repeatOrder,
        setSearchQuery,
        setSelectedCategory,
        selectedCompanyFilter,
        setSelectedCompanyFilter,
        reloadSettings
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
