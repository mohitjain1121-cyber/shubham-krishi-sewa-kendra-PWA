import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { dbService } from '../services/db';
import type { Company, Product } from '../services/db';
import { ChevronLeft, Building2, Search } from 'lucide-react';

export const AllCompanies: React.FC = () => {
  const { setView, setSelectedCompanyFilter } = useApp();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Only active companies
    setCompanies(dbService.getCompanies(false));
    // Load products to compute count
    setProducts(dbService.getProducts(false));
  }, []);

  const getProductCount = (compId: string) => {
    return products.filter(p => p.companyId === compId).length;
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-20 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-150 z-10 px-4 py-3 flex items-center shadow-xs">
        <button
          onClick={() => setView('catalog')}
          className="p-1 rounded-full hover:bg-slate-105 text-slate-650 transition cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-extrabold text-sm text-slate-800 ml-2">
          All Agrochemical Brands
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Search - height 44px, rounded-xl */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search manufacturer..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-205 focus:outline-none focus:ring-2 focus:ring-[#12873A] text-slate-800 text-xs shadow-xs h-11"
          />
        </div>

        {/* Company Grid */}
        {filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5">
            {filteredCompanies.map(comp => {
              const count = getProductCount(comp.id);
              return (
                <button
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompanyFilter(comp.id);
                    setView('catalog');
                  }}
                  className="flex flex-col items-center justify-between rounded-2xl border border-slate-205 bg-white hover:border-slate-350 hover:shadow-md transition-all duration-150 text-center cursor-pointer min-h-[160px] overflow-hidden w-full"
                >
                  {comp.logo && !logoErrors[comp.id] ? (
                    <div className="w-full h-24 bg-slate-50/40 flex items-center justify-center p-3 border-b border-slate-100/80 animate-fade-in">
                      <img
                        src={comp.logo}
                        alt={comp.name}
                        className="max-h-full max-w-full object-contain"
                        onError={() => setLogoErrors(prev => ({ ...prev, [comp.id]: true }))}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-green-50/40 border-b border-green-100/50 text-[#12873A] flex items-center justify-center font-black text-2xl uppercase">
                      {comp.name.slice(0, 2)}
                    </div>
                  )}
                  
                  <div className="p-3 w-full flex flex-col items-center justify-center">
                    <h4 className="font-extrabold text-slate-800 text-xs truncate leading-tight tracking-wide w-full">
                      {comp.name}
                    </h4>
                    <span className="text-[10px] text-[#12873A] font-bold block mt-1">
                      {count} {count === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-2xl border border-slate-100 mt-4 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-700 text-sm mb-1">No companies found</h4>
            <p className="text-slate-400 text-xs max-w-[200px] mx-auto">
              No active companies matching your search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
