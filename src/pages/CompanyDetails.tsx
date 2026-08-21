import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { dbService } from '../services/db';
import type { Company, Product } from '../services/db';
import { ProductCard } from '../components/ProductCard';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react';

export const CompanyDetails: React.FC = () => {
  const { selectedCompanyId, setView, syncVersion } = useApp();
  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (selectedCompanyId) {
      // Find company
      const comps = dbService.getCompanies(true);
      const c = comps.find((item: Company) => item.id === selectedCompanyId);
      if (c) {
        setCompany(c);
      }

      // Find products for this company
      const activeProds = dbService.getProducts(false); // active products only
      const companyProds = activeProds.filter((p: Product) => p.companyId === selectedCompanyId);
      setProducts(companyProds);

      // Compute unique categories for this company's products
      const uniqueCats = ['All', ...Array.from(new Set(companyProds.map((p: Product) => p.category)))] as string[];
      setCategories(uniqueCats);
      setSelectedCategory('All');
      setLogoError(false);
    }
  }, [selectedCompanyId, syncVersion]);

  if (!company) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <h3 className="font-bold text-slate-700 text-sm mb-1">Company Not Found</h3>
        <button
          onClick={() => setView('catalog')}
          className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 px-4 rounded-lg mt-4"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  // Filter products by category
  const filteredProducts = products.filter(
    p => selectedCategory === 'All' || p.category === selectedCategory
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-20 animate-fade-in">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white border-b border-slate-150 z-10 px-4 py-3 flex items-center shadow-xs">
        <button
          onClick={() => setView('catalog')}
          className="p-1 rounded-full hover:bg-slate-105 text-slate-650 transition cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-extrabold text-sm text-slate-800 ml-2 truncate max-w-[280px]">
          {company.name} Products
        </span>
      </div>

      {/* Company Profile Header Block */}
      <div className="bg-white border-b border-slate-150 p-5 flex items-center space-x-4">
        {company.logo && !logoError ? (
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 flex-shrink-0">
            <img
              src={company.logo}
              alt={company.name}
              className="max-h-full max-w-full object-contain"
              onError={() => setLogoError(true)}
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 text-[#12873A] flex items-center justify-center font-black text-lg uppercase flex-shrink-0">
            {company.name.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-slate-850 leading-tight truncate">
            {company.name}
          </h2>
          <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed line-clamp-2 font-medium">
            {company.description || `${company.name} crop defense solutions directory.`}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Category Horizontal Selector */}
        {categories.length > 2 && (
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-[10px]">
              Filter by Category
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
        )}

        {/* Product Count Display */}
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {filteredProducts.length === 1 ? '1 Product Available' : `${filteredProducts.length} Products Available`}
          </span>
        </div>

        {/* Product Catalogue Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-2xl border border-slate-100 text-center">
            <SlidersHorizontal className="w-12 h-12 text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-700 text-sm mb-1">No products found</h4>
            <p className="text-slate-400 text-xs max-w-[220px] mx-auto">
              {products.length === 0
                ? "No products available from this company yet."
                : "No products match this category for this company."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
