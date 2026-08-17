import React, { useState, useEffect } from 'react';
import { dbService, getCompanyPlaceholderLogo } from '../services/db';
import type { Company, Product } from '../services/db';
import { Search, Plus, Trash2, ShieldAlert, X, Building2, CheckCircle } from 'lucide-react';

export const AdminCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Unmapped brands migration state
  const [unmappedBrands, setUnmappedBrands] = useState<string[]>([]);
  const [mappingTargets, setMappingTargets] = useState<Record<string, string>>({});

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const loadData = () => {
    const companyList = dbService.getCompanies(true); // Include inactive
    setCompanies(companyList);
    setProducts(dbService.getProducts(true)); // Include archived
    
    // Check migration flags
    const flags = dbService.getMigrationFlags();
    if (flags && flags.unmappedBrands) {
      setUnmappedBrands(flags.unmappedBrands);
    } else {
      setUnmappedBrands([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getProductCount = (compId: string) => {
    return products.filter(p => p.companyId === compId).length;
  };

  const openAddForm = () => {
    setEditCompany(null);
    setName('');
    setLogo('');
    setDescription('');
    setStatus('active');
    setSuccessBanner(null);
    setIsFormOpen(true);
  };

  const openEditForm = (comp: Company) => {
    setEditCompany(comp);
    setName(comp.name);
    setLogo(comp.logo || '');
    setDescription(comp.description || '');
    setStatus(comp.status);
    setSuccessBanner(null);
    setIsFormOpen(true);
  };

  // Logo file upload handler (converts image to Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Invalid file format. Please select an image (PNG, JPG, WebP, SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogo(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogo('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Company Name is required.");
      return;
    }

    // Duplicate check case-insensitive
    const duplicateExists = companies.some(c => 
      (!editCompany || c.id !== editCompany.id) && 
      c.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (duplicateExists) {
      alert(`A company named "${name.trim()}" already exists in the database.`);
      return;
    }

    const companyData = {
      name: name.trim(),
      logo: logo.trim() || getCompanyPlaceholderLogo(name.trim()),
      description: description.trim() || undefined,
      status
    };

    if (editCompany) {
      const res = dbService.updateCompany({
        ...companyData,
        id: editCompany.id,
        createdAt: editCompany.createdAt,
        updatedAt: new Date().toISOString()
      });
      if (res.success) {
        setSuccessBanner("Company updated successfully.");
        loadData();
        setTimeout(() => {
          setSuccessBanner(null);
          setIsFormOpen(false);
        }, 1200);
      } else {
        alert(res.error || "Failed to update company.");
      }
    } else {
      const res = dbService.addCompany(companyData);
      if (res.success) {
        setSuccessBanner("Company created successfully.");
        loadData();
        setTimeout(() => {
          setSuccessBanner(null);
          setIsFormOpen(false);
        }, 1200);
      } else {
        alert(res.error || "Failed to create company.");
      }
    }
  };

  const toggleStatus = (comp: Company) => {
    const newStatus = comp.status === 'active' ? 'inactive' : 'active';
    const message = newStatus === 'inactive' 
      ? `Deactivate "${comp.name}"?\n\nThis company will disappear from the Dealer PWA, but associated products and historical orders will remain untouched.`
      : `Reactivate "${comp.name}"?`;
    
    if (window.confirm(message)) {
      const updated = {
        ...comp,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      const res = dbService.updateCompany(updated);
      if (res.success) {
        loadData();
      }
    }
  };

  const handleDelete = (comp: Company) => {
    const productCount = getProductCount(comp.id);
    if (productCount > 0) {
      alert(`This company has ${productCount} products associated with it. Please deactivate the company instead of deleting it to preserve system references.`);
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete the company "${comp.name}"? This action cannot be undone.`)) {
      const res = dbService.deleteCompany(comp.id);
      if (res.success) {
        loadData();
      } else {
        alert(res.error || "Failed to delete company.");
      }
    }
  };

  // Migration resolution handlers
  const handleCreateMigration = (brand: string) => {
    if (window.confirm(`Create "${brand}" as an active company in the database?`)) {
      const res = dbService.resolveMigration(brand, 'create');
      if (res.success) {
        loadData();
      } else {
        alert(res.error || "Failed to create company.");
      }
    }
  };

  const handleMapMigration = (brand: string) => {
    const targetId = mappingTargets[brand];
    if (!targetId) {
      alert("Please select a target company to map to.");
      return;
    }
    const targetComp = companies.find(c => c.id === targetId);
    if (!targetComp) return;

    if (window.confirm(`Merge all products of "${brand}" into "${targetComp.name}"? The temporary brand "${brand}" will be removed.`)) {
      const res = dbService.resolveMigration(brand, 'map', targetId);
      if (res.success) {
        loadData();
        // Clear selection target
        setMappingTargets(prev => {
          const next = { ...prev };
          delete next[brand];
          return next;
        });
      } else {
        alert(res.error || "Failed to merge brands.");
      }
    }
  };

  const filteredCompanies = companies.filter(c => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(query) || 
                          (c.description && c.description.toLowerCase().includes(query));
    
    const matchesStatus = 
      statusFilter === 'All' ||
      (statusFilter === 'Active' && c.status === 'active') ||
      (statusFilter === 'Inactive' && c.status === 'inactive');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Migration Alert Banner (Unmapped Brands Review) */}
      {unmappedBrands.length > 0 && (
        <div className="bg-amber-50 border border-amber-250 rounded-2xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center space-x-2 text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <h4 className="font-extrabold text-xs uppercase tracking-wide">Pending Brand Migration Review</h4>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
            The database scanned existing product listings and identified unmapped manufacturer brands. Please choose to either create them as official database-driven companies, or map them to an existing company.
          </p>
          <div className="divide-y divide-amber-200/60 max-h-56 overflow-y-auto pr-1">
            {unmappedBrands.map(brand => (
              <div key={brand} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="font-mono font-extrabold text-amber-905 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded">
                  {brand}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleCreateMigration(brand)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition"
                  >
                    Create Company
                  </button>
                  <span className="text-amber-400 font-bold text-[10px] px-1">OR</span>
                  <select
                    value={mappingTargets[brand] || ''}
                    onChange={(e) => setMappingTargets(prev => ({ ...prev, [brand]: e.target.value }))}
                    className="bg-white border border-amber-250 text-slate-700 text-[10.5px] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                  >
                    <option value="">Select Target Company...</option>
                    {companies
                      .filter(c => c.name !== brand && !c.id.startsWith('comp-auto-'))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    }
                  </select>
                  <button
                    onClick={() => handleMapMigration(brand)}
                    disabled={!mappingTargets[brand]}
                    className="bg-white border border-amber-300 text-amber-850 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold px-3 py-1.5 rounded-lg text-[10px] transition"
                  >
                    Map & Merge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Header Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
            Companies
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Manage product companies and their logos</p>
        </div>

        <button
          onClick={openAddForm}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto transition shadow"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-800 text-xs shadow-xs"
            />
          </div>

          {/* Status Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['All', 'Active', 'Inactive'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === tab
                    ? 'bg-white text-green-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Companies Listings Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Desktop View Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                <th className="py-3 px-5 w-24 text-center">Logo</th>
                <th className="py-3 px-5">Company Name</th>
                <th className="py-3 px-5 text-center">Products</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-center w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.map(comp => {
                const prodCount = getProductCount(comp.id);
                return (
                  <tr key={comp.id} className="hover:bg-slate-50/40 transition">
                    <td className="py-3.5 px-5">
                      {comp.logo ? (
                        <img
                          src={comp.logo}
                          alt={comp.name}
                          className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1 mx-auto"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 text-green-700 font-black text-sm uppercase flex items-center justify-center mx-auto">
                          {comp.name.slice(0, 2)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-extrabold text-slate-800 text-xs">{comp.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 max-w-sm">
                        {comp.description || <span className="italic opacity-60">No description provided</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center font-extrabold text-slate-700">
                      {prodCount} {prodCount === 1 ? 'Product' : 'Products'}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${
                        comp.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-150'
                          : 'bg-rose-50 text-rose-700 border-rose-150'
                      }`}>
                        {comp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditForm(comp)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-green-150 transition text-[10.5px] font-bold"
                        >
                          Edit
                        </button>
                        
                        <button
                          onClick={() => toggleStatus(comp)}
                          className={`px-2.5 py-1.5 rounded-lg border border-transparent transition text-[10.5px] font-bold ${
                            comp.status === 'active' 
                              ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-150'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-150'
                          }`}
                        >
                          {comp.status === 'active' ? 'Disable' : 'Enable'}
                        </button>

                        <button
                          onClick={() => handleDelete(comp)}
                          className="text-rose-600 hover:text-rose-750 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-150 transition"
                          title="Delete Company"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 italic">No companies found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="lg:hidden p-4 space-y-3.5 max-h-[calc(100vh-270px)] overflow-y-auto">
          {filteredCompanies.map(comp => {
            const prodCount = getProductCount(comp.id);
            return (
              <div key={comp.id} className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {comp.logo ? (
                      <img
                        src={comp.logo}
                        alt={comp.name}
                        className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 p-1 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 text-green-700 font-black text-xs uppercase flex items-center justify-center flex-shrink-0">
                        {comp.name.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs">{comp.name}</h4>
                      <span className="text-[10px] text-green-600 font-bold block mt-0.5">{prodCount} {prodCount === 1 ? 'Product' : 'Products'}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${
                    comp.status === 'active'
                      ? 'bg-green-50 text-green-700 border-green-150'
                      : 'bg-rose-50 text-rose-700 border-rose-150'
                  }`}>
                    {comp.status}
                  </span>
                </div>

                {comp.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">{comp.description}</p>
                )}

                <div className="flex justify-end space-x-2.5 pt-2.5 border-t border-slate-200/50">
                  <button
                    onClick={() => openEditForm(comp)}
                    className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[10px] transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(comp)}
                    className={`border font-bold px-3 py-1.5 rounded-xl text-[10px] transition ${
                      comp.status === 'active'
                        ? 'border-amber-200 bg-white text-amber-600 hover:bg-amber-50'
                        : 'border-green-200 bg-white text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {comp.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(comp)}
                    className="border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredCompanies.length === 0 && (
            <p className="text-center text-slate-400 italic py-8 text-xs">No companies found matching criteria.</p>
          )}
        </div>
      </div>

      {/* FORM DRAWER MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm">
                {editCompany ? `Edit Company details` : 'Add New Company'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Banner */}
            {successBanner && (
              <div className="bg-emerald-50 border-y border-emerald-100 px-5 py-3 flex items-center space-x-2 text-emerald-800 text-[11px] font-medium animate-slide-down">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successBanner}</span>
              </div>
            )}

            {/* Form body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Company Name */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[9px]">Company Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bayer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-850 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Logo asset upload with preview */}
              <div className="space-y-2">
                <label className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Company Logo *</label>
                
                <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-xl border border-slate-150">
                  {logo ? (
                    <div className="relative w-16 h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-1.5 flex-shrink-0">
                      <img
                        src={logo}
                        alt="Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-0.5 border border-white shadow-xs"
                        title="Remove logo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-slate-200 border border-slate-200 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 flex-shrink-0">
                      <Building2 className="w-6 h-6" />
                      <span className="text-[7.5px] uppercase font-bold mt-1 text-slate-400">No Logo</span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500 leading-tight">Upload transparent logo (PNG, SVG, WebP preferred).</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <label className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition select-none">
                        <span>{logo ? 'Replace Logo' : 'Upload Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      {logo && (
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="border border-slate-250 hover:bg-slate-100 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg text-[10px] transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[9px]">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the manufacturer, products specialized in, or location..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-850 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[9px]">Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-850 bg-white focus:outline-none focus:ring-1 focus:ring-green-500 font-semibold text-xs"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-650 px-4.5 py-2.5 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition shadow text-xs"
              >
                {editCompany ? 'Save Company' : 'Create Company'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
