import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { dbService } from '../services/db';
import type { Product, Company } from '../services/db';
import { ProductCard } from '../components/ProductCard';
import { Search, SlidersHorizontal, LogIn, Sparkles } from 'lucide-react';

export const Catalog: React.FC = () => {
  const {
    user,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    setView,
    selectedCompanyFilter,
    setSelectedCompanyFilter
  } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('All');
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

  // Fetch products & companies
  useEffect(() => {
    const list = dbService.getProducts(false); // only active, non-archived products
    setProducts(list);
    
    // Extract unique categories
    const cats = ['All', ...Array.from(new Set(list.map((p: Product) => p.category)))] as string[];
    setCategories(cats);

    // Fetch active companies
    const comps = dbService.getCompanies(false);
    setCompanies(comps);
  }, []);

  // Filtering products
  const filteredProducts = products.filter(product => {
    const activeVariants = product.variants?.filter(v => !v.archived) || [];
    const isAnyInStock = activeVariants.some(v => v.available);
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesCompany = !selectedCompanyFilter || product.companyId === selectedCompanyFilter;
    const matchesAvailability = availabilityFilter === 'All' || 
                                (availabilityFilter === 'in_stock' && isAnyInStock) ||
                                (availabilityFilter === 'out_of_stock' && !isAnyInStock);
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          activeVariants.some(v => v.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesCompany && matchesAvailability && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-20">
      
      {/* Dealer Greeting Banner */}
      <div className="bg-gradient-to-br from-[#12873A] to-[#16A34A] text-white px-4 pt-3.5 pb-4 shadow-sm rounded-b-[1.75rem]">
        {user ? (
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] text-green-100 font-bold tracking-wider uppercase opacity-90 leading-tight">Welcome back</p>
              <h2 className="font-extrabold text-sm xs:text-base leading-tight text-white truncate max-w-[220px]">
                {user.shopName}
              </h2>
            </div>
            <button 
              onClick={() => setView('profile')}
              className="bg-white/15 hover:bg-white/25 text-white text-xs px-3.5 py-2 rounded-full border border-white/15 transition-all font-bold shrink-0 cursor-pointer shadow-xs"
            >
              My Account
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] text-green-100 font-bold tracking-wider uppercase opacity-90 leading-tight">WELCOME GUEST PARTNER</p>
              <h2 className="font-extrabold text-sm xs:text-base leading-tight text-white flex items-center space-x-1.5 truncate max-w-[200px]">
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse shrink-0" />
                <span>Wholesale Catalog</span>
              </h2>
            </div>
            <button
              onClick={() => setView('login')}
              className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold px-4 py-2 rounded-full flex items-center space-x-1 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Register &rarr;</span>
            </button>
          </div>
        )}

        {/* Search Bar inside banner - height 44px */}
        <div className="relative mt-3">
          <Search className="absolute left-4 top-[13px] w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, brands, active ingredients..."
            className="w-full pl-11 pr-4 rounded-full border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#12873A] text-slate-800 text-xs xs:text-sm shadow-md bg-white h-[44px]"
          />
        </div>
      </div>

      {/* Product Content */}
      <div className="px-3.5 xs:px-4 mt-4">
        {/* Category Horizontal Selector - height 42px, brand colors, no shadow, clean spacing */}
        <div className="mb-5">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-[10px]">
            PRODUCT CATEGORIES
          </h3>
          <div className="flex space-x-[8px] overflow-x-auto pb-1.5 scrollbar-none -mx-4 px-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-[16px] h-[42px] inline-flex items-center justify-center rounded-[21px] text-[14px] whitespace-nowrap transition-all duration-150 border cursor-pointer leading-none ${
                  selectedCategory === cat
                    ? 'bg-[#12873A] text-white border-[#12873A] font-semibold shadow-none'
                    : 'bg-white text-[#172033] border-slate-200 font-medium hover:text-[#172033] hover:border-slate-350 shadow-none'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shop by Company Section - circular 44px logos */}
        {companies.length > 0 && (
          <div className="mb-4 bg-white rounded-2xl border border-slate-150 p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                SHOP BY COMPANY
              </h3>
              <button 
                onClick={() => setView('all_companies')}
                className="text-[11px] text-[#12873A] hover:text-[#16A34A] font-bold flex items-center transition"
              >
                View All &rarr;
              </button>
            </div>
            <div className="flex items-start space-x-4 overflow-x-auto pb-1.5 scrollbar-none -mx-2 px-2">
              {companies.slice(0, 8).map(comp => {
                const isSelected = selectedCompanyFilter === comp.id;
                return (
                  <button
                    key={comp.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCompanyFilter('');
                      } else {
                        setSelectedCompanyFilter(comp.id);
                      }
                    }}
                    className="flex flex-col items-center w-[60px] flex-shrink-0 cursor-pointer focus:outline-none"
                  >
                    <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center bg-white shadow-xs border transition-all duration-200 ${
                      isSelected ? 'border-2 border-[#12873A] ring-4 ring-green-50' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      {comp.logo && !logoErrors[comp.id] ? (
                        <div className="w-[42px] h-[42px] flex items-center justify-center overflow-hidden">
                          <img 
                            src={comp.logo} 
                            alt={comp.name} 
                            className="max-h-full max-w-full object-contain" 
                            onError={() => setLogoErrors(prev => ({ ...prev, [comp.id]: true }))}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-50 text-[#12873A] flex items-center justify-center font-bold text-xs uppercase">
                          {comp.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <span className={`text-[12px] font-semibold text-center truncate w-full mt-1.5 leading-tight ${
                      isSelected ? 'text-[#12873A] font-bold' : 'text-slate-500'
                    }`}>
                      {comp.name}
                    </span>
                  </button>
                );
              })}
              
              {companies.length > 8 && (
                <button
                  onClick={() => setView('all_companies')}
                  className="flex flex-col items-center w-[60px] flex-shrink-0 cursor-pointer focus:outline-none"
                >
                  <div className="w-[52px] h-[52px] rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 hover:border-[#12873A] hover:text-[#12873A] hover:bg-green-50 transition-all shadow-xs">
                    <span className="text-lg font-bold leading-none">+</span>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-500 text-center truncate w-full mt-1.5 leading-tight">
                    View All
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filtering Options Dropdowns - styled as clean compact selects */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="relative">
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
              className="w-full appearance-none text-xs bg-white border border-slate-200 rounded-xl pl-3.5 pr-8 py-2 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#12873A] shadow-xs cursor-pointer h-[44px] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[right_8px_center] bg-no-repeat bg-[length:18px_18px]"
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full appearance-none text-xs bg-white border border-slate-200 rounded-xl pl-3.5 pr-8 py-2 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#12873A] shadow-xs cursor-pointer h-[44px] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[right_8px_center] bg-no-repeat bg-[length:18px_18px]"
            >
              <option value="All">All Stock</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="flex justify-between items-center mb-3.5">
          <span className="text-xs xs:text-[13px] font-bold text-slate-400 uppercase tracking-wider">
            {filteredProducts.length === 1 ? '1 PRODUCT FOUND' : `${filteredProducts.length} PRODUCTS FOUND`}
          </span>
          {(searchQuery || selectedCategory !== 'All' || selectedCompanyFilter || availabilityFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedCompanyFilter('');
                setAvailabilityFilter('All');
              }}
              className="text-[11px] text-[#12873A] hover:text-[#16A34A] font-bold bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-150 transition cursor-pointer shadow-xs"
            >
              Clear Filters
            </button>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 xs:gap-2.5 sm:gap-3">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-2xl border border-slate-100 mt-4 text-center">
            <SlidersHorizontal className="w-12 h-12 text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-700 text-sm mb-1">No products found</h4>
            <p className="text-slate-400 text-xs max-w-[200px] mx-auto mb-4">
              Try changing or clearing your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedCompanyFilter('');
                setAvailabilityFilter('All');
              }}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 px-4 rounded-lg transition mt-2 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
