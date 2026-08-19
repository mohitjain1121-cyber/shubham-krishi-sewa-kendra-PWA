import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { Product, Company } from '../services/db';
import { Search, Plus, Archive, RefreshCcw, Edit2, FileUp, X, Download, CheckCircle2, ChevronRight, AlertTriangle, FileText, Database } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import JSZip from 'jszip';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form Inputs
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [category, setCategory] = useState('Insecticides');
  const [description, setDescription] = useState('');
  const [techSpecs, setTechSpecs] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formVariants, setFormVariants] = useState<{
    id?: string;
    packSize: string;
    unit: string;
    price: number;
    sku: string;
    available: boolean;
    archived: boolean;
    dealerPrices?: Record<string, number>;
  }[]>([]);
  const [editingDealerPricesIndex, setEditingDealerPricesIndex] = useState<number | null>(null);

  // Bulk Upload Wizard states
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState<1 | 2 | 3>(1); // 1: Select/Paste, 2: Preview & Validate, 3: Completed
  const [csvText, setCsvText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [uploadStats, setUploadStats] = useState<{
    rowsCount: number;
    parentProductsCount: number;
    newProductsCount: number;
    productsUpdated: number;
    newVariantsCount: number;
    updatedVariantsCount: number;
    imagesImported: number;
    productsSkipped: number;
    errorsCount: number;
    warningsCount: number;
  } | null>(null);
  const [zipFilesMap, setZipFilesMap] = useState<Record<string, Blob>>({});
  const [zipFileName, setZipFileName] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);

  // Load products list
  const loadProducts = () => {
    const list = dbService.getProducts(true); // get all, including archived
    setProducts(list);
  };

  useEffect(() => {
    loadProducts();
    setCompanies(dbService.getCompanies(true)); // load all companies
  }, []);

  const openAddForm = () => {
    setEditProduct(null);
    setName('');
    
    const activeComps = dbService.getCompanies(false);
    const defaultCompId = activeComps[0]?.id || '';
    const defaultBrand = activeComps[0]?.name || '';
    
    setCompanyId(defaultCompId);
    setBrand(defaultBrand);
    setCompanySearch(defaultBrand);
    
    setCategory('Insecticides');
    setDescription('');
    setTechSpecs('');
    setImageUrl('https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&auto=format&fit=crop&q=60');
    setFormVariants([
      { packSize: '250', unit: 'ml', price: 100, sku: `SKU-${Date.now().toString().slice(-4)}-1`, available: true, archived: false }
    ]);
    setSuccessBanner(null);
    setIsFormOpen(true);
  };

  const openEditForm = (prod: Product) => {
    setEditProduct(prod);
    setName(prod.name);
    setCompanyId(prod.companyId || '');
    setBrand(prod.brand);
    const matchedComp = companies.find(c => c.id === prod.companyId);
    setCompanySearch(matchedComp ? matchedComp.name : prod.brand);
    setCategory(prod.category);
    setDescription(prod.description);
    setTechSpecs(prod.techSpecs);
    setImageUrl(prod.imageUrl);
    const activeVariants = prod.variants || [];
    setFormVariants(activeVariants.map(v => ({
      id: v.id,
      packSize: v.packSize,
      unit: v.unit,
      price: v.price,
      sku: v.sku,
      available: v.available,
      archived: v.archived,
      dealerPrices: v.id ? dbService.getDealerPricesForVariant(v.id) : {}
    })));
    setSuccessBanner(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !companyId || !category) {
      alert("Please fill in all required fields marked with *");
      return;
    }

    const activeFormVariants = formVariants.filter(v => !v.archived);
    if (activeFormVariants.length === 0) {
      alert("At least one active variant/pack size is required.");
      return;
    }

    const invalidVar = formVariants.find(v => !v.archived && (!v.packSize || v.price <= 0 || !v.sku));
    if (invalidVar) {
      alert("Please fill in pack size, price, and SKU details for all active variants.");
      return;
    }

    const productData = {
      name,
      brand,
      companyId,
      category,
      description,
      techSpecs,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&auto=format&fit=crop&q=60',
      variants: formVariants
    };

    if (editProduct) {
      const res = await dbService.updateProduct({
        ...productData,
        id: editProduct.id,
        archived: editProduct.archived
      } as any);
      if (res.success) {
        setSuccessBanner("Product updated successfully.");
        loadProducts();
        setTimeout(() => {
          setSuccessBanner(null);
          setIsFormOpen(false);
        }, 1500);
      }
    } else {
      const res = await dbService.addProduct(productData as any);
      if (res.success) {
        setSuccessBanner("Product added successfully.");
        loadProducts();
        setTimeout(() => {
          setSuccessBanner(null);
          setIsFormOpen(false);
        }, 1500);
      }
    }
  };

  const handleToggleAvailable = async (prod: Product) => {
    if (!prod.variants || prod.variants.length === 0) return;
    const updatedVariants = prod.variants.map((v, idx) =>
      idx === 0 ? { ...v, available: !v.available } : v
    );
    const res = await dbService.updateProduct({
      ...prod,
      variants: updatedVariants
    } as any);
    if (res.success) loadProducts();
  };

  const handleArchive = async (prod: Product) => {
    const confirm = window.confirm(`Archive this product?\n\n"${prod.name}" will no longer appear in the active dealer catalog. Historical orders remain intact.`);
    if (confirm) {
      const res = await dbService.archiveProduct(prod.id);
      if (res.success) loadProducts();
    }
  };

  const handleRestore = async (id: string) => {
    const res = await dbService.restoreProduct(id);
    if (res.success) loadProducts();
  };

  // --- CSV BULK UPLOAD HANDLERS ---
  const downloadCSVTemplate = () => {
    const headers = "Product Name,Company,Category,Description,Technical Specifications,SKU,Variant Name,Pack Size,Unit,Image File,Status,Price\n";
    const sampleRow1 = "Coragen,FMC,Insecticides,Insecticide for crop protection,Chlorantraniliprole 18.5% SC,COR-250,250 ml,250,ml,coragen.jpg,Active,650\n";
    const sampleRow2 = "Roundup,Bayer,Herbicides,Broad-spectrum herbicide,Glyphosate 41% SL,GLY-1L,1 L,1,L,roundup.png,Active,450\n";
    const sampleRow3 = "Mancozeb 75% WP,Indofil Industries Limited,Fungicides,Contact broad-spectrum fungicide,Mancozeb 75% WP,MAN-500,500 gm,500,gm,mancozeb.jpg,Active,220\n";
    
    const blob = new Blob([headers + sampleRow1 + sampleRow2 + sampleRow3], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "shubham_krishi_sewa_kendra_products_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMigrateToSupabase = async () => {
    if (!window.confirm("Are you sure you want to migrate your local cache / defaults catalog to Supabase? This will upsert all products, variants, and base prices safely.")) {
      return;
    }
    setMigrating(true);
    try {
      const res = await dbService.migrateLocalCatalogueToSupabase();
      if (res.success) {
        alert(`Successfully migrated ${res.count} products and variants to Supabase central database!`);
        loadProducts();
      } else {
        alert("Migration failed: " + res.error);
      }
    } catch (err: any) {
      alert("Error during migration: " + err.message);
    } finally {
      setMigrating(false);
    }
  };

  const handleCsvFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleZipFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setZipFileName(file.name);
    setIsValidating(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const tempMap: Record<string, Blob> = {};
      for (const [filename, entry] of Object.entries(zip.files)) {
        if (!entry.dir) {
          const blob = await entry.async('blob');
          const parts = filename.split('/');
          const baseName = parts[parts.length - 1].trim().toLowerCase();
          if (baseName) {
            tempMap[baseName] = blob;
          }
        }
      }
      setZipFilesMap(tempMap);
    } catch (err) {
      alert("Failed to parse images ZIP file: " + err);
    } finally {
      setIsValidating(false);
    }
  };

  const triggerValidation = () => {
    processCsvPreview(csvText, zipFilesMap);
  };

  const processCsvPreview = (text: string, currentZipFiles: Record<string, Blob> = zipFilesMap) => {
    setIsValidating(true);
    try {
      const res = dbService.validateBulkUpload(text, currentZipFiles);
      if (res.rows.length === 0 && res.errorsList.length > 0) {
        alert("Validation layout error:\n\n" + res.errorsList.join("\n"));
        setIsValidating(false);
        return;
      }

      setBulkPreview(res.rows);
      
      setUploadStats({
        rowsCount: res.rows.length,
        parentProductsCount: res.summary.newProducts,
        newProductsCount: res.summary.newProducts,
        productsUpdated: res.summary.existingVariantsToUpdate,
        newVariantsCount: res.summary.newVariants,
        updatedVariantsCount: res.summary.existingVariantsToUpdate,
        imagesImported: res.summary.imagesMatched,
        productsSkipped: 0,
        errorsCount: res.summary.errors,
        warningsCount: res.summary.warnings
      });
      
      setBulkStep(2);
    } catch (err) {
      alert("Failed to parse CSV: " + err);
      setBulkPreview([]);
      setUploadStats(null);
    } finally {
      setIsValidating(false);
    }
  };

  const confirmBulkUpload = async () => {
    const hasErrors = bulkPreview.some(r => r.validationStatus === 'ERROR');
    if (bulkPreview.length === 0 || hasErrors) {
      alert("Cannot import. Please resolve all validation errors first.");
      return;
    }

    setIsValidating(true);
    try {
      const res = await dbService.bulkUploadProducts(csvText, zipFilesMap);
      if (res.success) {
        setUploadStats({
          rowsCount: bulkPreview.length,
          parentProductsCount: res.productsCreated,
          newProductsCount: res.productsCreated,
          productsUpdated: res.productsUpdated,
          newVariantsCount: res.variantsCreated,
          updatedVariantsCount: res.variantsUpdated,
          imagesImported: res.imagesImported,
          productsSkipped: 0,
          errorsCount: 0,
          warningsCount: 0
        });
        setBulkStep(3);
        loadProducts();
      } else {
        alert("Upload processing error: " + (res.errors.join('\n') || "Unknown error"));
      }
    } catch (err) {
      alert("Failed to confirm import: " + err);
    } finally {
      setIsValidating(false);
    }
  };

  const downloadErrorReport = () => {
    const headerRow = "Row Number,Action,Product,Company,Variant,SKU,Price,Error Details\n";
    const errorRows = bulkPreview
      .filter(row => row.validationStatus === 'ERROR' || row.validationStatus === 'WARNING')
      .map(row => `${row.rowNum},${row.validationStatus},"${row.productName}","${row.companyName}","${row.variantName}","${row.sku}","${row.price}","${row.details.replace(/"/g, '""')}"`)
      .join('\n');
    const text = headerRow + errorRows;
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "import_error_report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeBulkModal = () => {
    setIsBulkOpen(false);
    setBulkStep(1);
    setCsvText('');
    setZipFileName('');
    setZipFilesMap({});
    setBulkPreview([]);
    setUploadStats(null);
  };

  // Filter products list
  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase();
    const activeVariants = p.variants?.filter(v => !v.archived) || [];
    const matchesSearch = 
      p.name.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query) ||
      activeVariants.some(v => v.sku.toLowerCase().includes(query));

    const matchesCategory = 
      categoryFilter === 'All' || p.category === categoryFilter;

    const isAnyInStock = activeVariants.some(v => v.available);
    const matchesAvailability = 
      availabilityFilter === 'All' || 
      (availabilityFilter === 'In Stock' && isAnyInStock) || 
      (availabilityFilter === 'Out of Stock' && !isAnyInStock);

    const matchesStatus = 
      statusFilter === 'All' || 
      (statusFilter === 'Active' && !p.archived) || 
      (statusFilter === 'Archived' && p.archived);

    return matchesSearch && matchesCategory && matchesAvailability && matchesStatus;
  });

  const categoriesList = ['Insecticides', 'Herbicides', 'Fungicides', 'Fertilizers', 'Seeds', 'Others'];

  return (
    <div className="space-y-6">
      
      {/* Action Header Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
            Catalog Inventory
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Manage wholesale availability, descriptions, pricing, and bulk sheets</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Download Template button */}
          <button
            onClick={downloadCSVTemplate}
            className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-200 transition"
            title="Download CSV Layout Template"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">CSV Template</span>
          </button>
          {/* Migrate Cache to Supabase button */}
          <button
            onClick={handleMigrateToSupabase}
            disabled={migrating}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-200 transition disabled:opacity-50"
            title="Migrate local cache or defaults catalog to Supabase database"
          >
            <Database className="w-4 h-4 text-indigo-600" />
            <span>{migrating ? 'Migrating...' : 'Migrate to Supabase'}</span>
          </button>
          {/* Bulk Upload button */}
          <button
            onClick={() => setIsBulkOpen(true)}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-200 transition"
          >
            <FileUp className="w-4 h-4 text-green-700" />
            <span>Bulk Upload</span>
          </button>
          
          {/* Add Product button */}
          <button
            onClick={openAddForm}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Add Product</span>
          </button>
        </div>
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
              placeholder="Search by product name, chemical brand, SKU number..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-800 text-xs shadow-inner"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none text-xs"
          >
            <option value="All">All Categories</option>
            {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          {/* Availability Filter */}
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none text-xs"
          >
            <option value="All">All Stock Levels</option>
            <option value="In Stock">In Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none text-xs"
          >
            <option value="All">All Statuses (Active/Archived)</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived Only</option>
          </select>
        </div>
      </div>

      {/* Product List Desktop Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                <th className="py-3 px-5 w-16 text-center">Image</th>
                <th className="py-3 px-5">Product Name</th>
                <th className="py-3 px-5">Brand</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5 text-center">Pack Sizes & Rates</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(prod => {
                const activeVariants = prod.variants?.filter(v => !v.archived) || [];
                return (
                  <tr key={prod.id} className={`hover:bg-slate-50/40 transition ${prod.archived ? 'bg-slate-50/50 opacity-65' : ''}`}>
                    <td className="py-3 px-5 text-center">
                      <SafeImage
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 mx-auto"
                        brand={prod.brand}
                      />
                    </td>
                    <td className="py-3 px-5 font-bold text-slate-800">
                      {prod.name}
                      <span className="block font-mono text-[9px] font-bold text-slate-400 mt-0.5">{prod.id}</span>
                    </td>
                    <td className="py-3 px-5 text-slate-600 font-medium">{prod.brand}</td>
                    <td className="py-3 px-5 text-slate-500 font-semibold">{prod.category}</td>
                    
                    {/* Pack Sizes & Rates */}
                    <td className="py-3 px-5 text-center font-medium">
                      <div className="flex flex-col items-center space-y-1">
                        {activeVariants.map(v => (
                          <div key={v.id} className="text-[10px] whitespace-nowrap bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 flex items-center space-x-1.5 shadow-2xs">
                            <span className="font-bold text-slate-700">{v.packSize} {v.unit}</span>
                            <span className="text-green-700 font-extrabold">₹{v.price}</span>
                            <button
                              onClick={() => handleToggleAvailable(prod)}
                              disabled={prod.archived}
                              className={`text-[8px] font-bold px-1 rounded-full border ${
                                v.available ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                              }`}
                            >
                              {v.available ? 'In' : 'Out'}
                            </button>
                          </div>
                        ))}
                        {activeVariants.length === 0 && (
                          <span className="text-slate-400 italic text-[10px]">No variants</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        prod.archived
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : 'bg-green-50 text-green-700 border-green-150'
                      }`}>
                        {prod.archived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => openEditForm(prod)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-150 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {prod.archived ? (
                          <button
                            onClick={() => handleRestore(prod.id)}
                            className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 border border-transparent hover:border-purple-150 rounded-lg transition"
                            title="Restore Product"
                          >
                            <RefreshCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(prod)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-150 rounded-lg transition"
                            title="Archive Product"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">No products found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="lg:hidden p-4 space-y-3.5 max-h-[calc(100vh-320px)] overflow-y-auto">
          {filteredProducts.map(prod => {
            const activeVariants = prod.variants?.filter(v => !v.archived) || [];
            return (
              <div
                key={prod.id}
                className={`bg-white rounded-xl p-4 shadow-xs border flex space-x-4 items-center transition ${
                  prod.archived ? 'border-dashed border-slate-200 opacity-60 bg-slate-50' : 'border-slate-100'
                }`}
              >
                <SafeImage
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="w-14 h-14 rounded-xl object-cover bg-slate-50 border border-slate-200 flex-shrink-0"
                  brand={prod.brand}
                />
                <div className="flex-1 min-w-0 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] font-bold text-slate-400">{prod.id}</span>
                    <span className="font-black text-slate-400">
                      {activeVariants.length} Sizes
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 truncate leading-tight">{prod.name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{prod.brand} • {prod.category}</p>
                  
                  {/* Compact variants badge list */}
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {activeVariants.map(v => (
                      <span key={v.id} className="text-[9px] bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded font-medium text-slate-600">
                        {v.packSize}{v.unit} - <span className="font-bold text-green-700">₹{v.price}</span> {v.available ? '(In)' : '(Out)'}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-3 pt-2.5">
                    <button
                      onClick={() => openEditForm(prod)}
                      className="text-blue-600 hover:underline font-bold text-[10px]"
                    >
                      Edit
                    </button>
                    {prod.archived ? (
                      <button
                        onClick={() => handleRestore(prod.id)}
                        className="text-purple-650 hover:underline font-bold text-[10px]"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleArchive(prod)}
                        className="text-rose-600 hover:underline font-bold text-[10px]"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="py-12 text-center text-slate-400 italic">No products found matching filters.</div>
          )}
        </div>
      </div>

      {/* ADD/EDIT FORM DRAWER MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
          >
            {/* Form Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                {editProduct ? `Edit Product Details` : 'Add New Wholesaler Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-150 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Banner message */}
            {successBanner && (
              <div className="bg-green-50 text-green-700 px-5 py-3 border-b border-green-100 text-xs font-bold flex items-center space-x-1.5 animate-slide-in">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>{successBanner}</span>
              </div>
            )}

            {/* Scrollable Form Workspace */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              
              {/* Product Name */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[9px]">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Imidacloprid 17.8% SL (Confidor)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-850 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Brand manufacturer select dropdown */}
                <div className="relative">
                  <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[9px]">Company / Brand *</label>
                  <div className="flex">
                    <input
                      type="text"
                      required
                      placeholder="Search company..."
                      value={companySearch}
                      onChange={(e) => {
                        setCompanySearch(e.target.value);
                        setIsCompanyDropdownOpen(true);
                        const matched = companies.find(c => c.name.toLowerCase() === e.target.value.toLowerCase());
                        if (matched) {
                          setCompanyId(matched.id);
                          setBrand(matched.name);
                        } else {
                          setCompanyId('');
                          setBrand(e.target.value);
                        }
                      }}
                      onFocus={() => setIsCompanyDropdownOpen(true)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-l-lg text-slate-850 focus:outline-none focus:ring-1 focus:ring-green-500 text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                      className="px-3 border-y border-r border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-r-lg text-slate-500 transition text-[9px]"
                    >
                      ▼
                    </button>
                  </div>
                  {isCompanyDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsCompanyDropdownOpen(false)}></div>
                      <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-250 rounded-lg shadow-lg">
                        {companies
                          .filter(c => {
                            const isAllowed = !editProduct ? c.status === 'active' : (c.status === 'active' || c.id === editProduct.companyId);
                            const matchesSearch = c.name.toLowerCase().includes(companySearch.toLowerCase());
                            return isAllowed && matchesSearch;
                          })
                          .map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setCompanyId(c.id);
                                setBrand(c.name);
                                setCompanySearch(c.name);
                                setIsCompanyDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-green-50 hover:text-green-800 transition ${
                                companyId === c.id ? 'bg-green-50 text-green-700 font-bold' : 'text-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{c.name}</span>
                                {c.status === 'inactive' && (
                                  <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-bold">Inactive</span>
                                )}
                              </div>
                            </button>
                          ))}
                        {companies.filter(c => {
                          const isAllowed = !editProduct ? c.status === 'active' : (c.status === 'active' || c.id === editProduct.companyId);
                          const matchesSearch = c.name.toLowerCase().includes(companySearch.toLowerCase());
                          return isAllowed && matchesSearch;
                        }).length === 0 && (
                          <div className="p-3 text-center text-slate-400 italic">No active companies found</div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Category selector */}
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[9px]">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-850 bg-white focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                  >
                    {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {/* Photo link URL */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[9px]">Product Image Key / URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="e.g. products/coragen.jpg or https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-850 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[9px]">Product Description / Usage Guidelines</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe recommended agricultural crops, target weeds/insects, dosage instructions..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-850 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none font-sans"
                ></textarea>
              </div>

              {/* Technical formulation specs */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[9px]">Chemical Ingredients / Technical Specifications</label>
                <textarea
                  rows={2}
                  value={techSpecs}
                  onChange={(e) => setTechSpecs(e.target.value)}
                  placeholder="e.g. Imidacloprid 17.8% SL, aqueous solvent..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-850 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none font-mono"
                ></textarea>
              </div>

              {/* Dynamic Product Pack Variants Section */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Product Pack Variants</h4>
                  <button
                    type="button"
                    onClick={() => setFormVariants([
                      ...formVariants,
                      { packSize: '500', unit: 'ml', price: 100, sku: `SKU-${Date.now().toString().slice(-4)}-${formVariants.length + 1}`, available: true, archived: false }
                    ])}
                    className="text-xs text-green-700 hover:text-green-800 font-bold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {formVariants.map((v, index) => (
                    <div key={index} className={`p-3 rounded-xl border relative space-y-3 ${v.archived ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200'}`}>
                      {/* Remove/Restore variant button */}
                      {formVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (v.id) {
                              setFormVariants(formVariants.map((item, idx) => idx === index ? { ...item, archived: !item.archived } : item));
                            } else {
                              setFormVariants(formVariants.filter((_, idx) => idx !== index));
                            }
                          }}
                          className="absolute top-2.5 right-2.5 text-xs font-bold text-rose-600 hover:text-rose-750"
                        >
                          {v.archived ? 'Restore' : 'Remove'}
                        </button>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Pack size */}
                        <div>
                          <label className="block text-slate-400 font-semibold mb-0.5 text-[9px] uppercase">Pack Size *</label>
                          <input
                            type="text"
                            required
                            disabled={v.archived}
                            value={v.packSize}
                            onChange={(e) => setFormVariants(formVariants.map((item, idx) => idx === index ? { ...item, packSize: e.target.value } : item))}
                            placeholder="e.g. 500"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        {/* Unit */}
                        <div>
                          <label className="block text-slate-400 font-semibold mb-0.5 text-[9px] uppercase">Unit *</label>
                          <select
                            value={v.unit}
                            disabled={v.archived}
                            onChange={(e) => setFormVariants(formVariants.map((item, idx) => idx === index ? { ...item, unit: e.target.value } : item))}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                          >
                            <option value="ml">ml</option>
                            <option value="L">L</option>
                            <option value="gm">gm</option>
                            <option value="Kg">Kg</option>
                          </select>
                        </div>
                        {/* Price */}
                        <div>
                          <label className="block text-slate-400 font-semibold mb-0.5 text-[9px] uppercase">Price (₹) *</label>
                          <input
                            type="number"
                            required
                            disabled={v.archived}
                            value={v.price}
                            onChange={(e) => setFormVariants(formVariants.map((item, idx) => idx === index ? { ...item, price: Number(e.target.value) || 0 } : item))}
                            placeholder="Price"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                        {/* Stock */}
                        <div>
                          <label className="block text-slate-400 font-semibold mb-0.5 text-[9px] uppercase">Stock *</label>
                          <select
                            value={v.available ? 'in' : 'out'}
                            disabled={v.archived}
                            onChange={(e) => setFormVariants(formVariants.map((item, idx) => idx === index ? { ...item, available: e.target.value === 'in' } : item))}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-bold text-green-700"
                          >
                            <option value="in" className="text-green-600 font-bold">In Stock</option>
                            <option value="out" className="text-rose-600 font-bold">Out of Stock</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* SKU */}
                        <div>
                          <label className="block text-slate-400 font-semibold mb-0.5 text-[9px] uppercase font-mono">SKU *</label>
                          <input
                            type="text"
                            required
                            disabled={v.archived}
                            value={v.sku}
                            onChange={(e) => setFormVariants(formVariants.map((item, idx) => idx === index ? { ...item, sku: e.target.value } : item))}
                            placeholder="SKU"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                          />
                        </div>
                        {/* Dealer Price Configurator */}
                        <div className="flex flex-col justify-end">
                          <button
                            type="button"
                            disabled={v.archived}
                            onClick={() => setEditingDealerPricesIndex(index)}
                            className="w-full bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-bold py-1.5 px-3 rounded-lg border border-slate-200 hover:border-slate-350 text-xs transition flex items-center justify-center space-x-1.5 h-[34px] cursor-pointer"
                          >
                            <span>👥 Set Dealer Prices</span>
                            {Object.keys(v.dealerPrices || {}).filter(k => (v.dealerPrices || {})[k] > 0).length > 0 && (
                              <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ml-1">
                                {Object.keys(v.dealerPrices || {}).filter(k => (v.dealerPrices || {})[k] > 0).length}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Form Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-650 px-4.5 py-2.5 rounded-xl font-bold transition text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition shadow text-xs cursor-pointer"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CSV BULK UPLOAD WIZARD MODAL */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Bulk Product Upload Sheet</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Upload CSV and ZIP of images to bulk-add or edit catalogue items instantly</p>
              </div>
              <button
                onClick={closeBulkModal}
                className="p-1.5 rounded-full hover:bg-slate-150 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Wizard Tracker Indicator */}
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-150 flex items-center justify-around text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <div className={`flex items-center space-x-1.5 ${bulkStep >= 1 ? 'text-green-700' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] border ${bulkStep >= 1 ? 'bg-green-150 border-green-600' : 'bg-white border-slate-300'}`}>1</span>
                <span>Upload Assets</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <div className={`flex items-center space-x-1.5 ${bulkStep >= 2 ? 'text-green-700' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] border ${bulkStep >= 2 ? 'bg-green-150 border-green-600' : 'bg-white border-slate-300'}`}>2</span>
                <span>Validate & Preview</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <div className={`flex items-center space-x-1.5 ${bulkStep >= 3 ? 'text-green-700' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] border ${bulkStep >= 3 ? 'bg-green-150 border-green-600' : 'bg-white border-slate-300'}`}>3</span>
                <span>Import Complete</span>
              </div>
            </div>

            {/* Scrollable Wizard content panels */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {bulkStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Step Instructions */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <span className="font-extrabold text-slate-700 text-[10.5px] uppercase tracking-wider block">Admin Instructions</span>
                    <ol className="list-decimal pl-4 text-[11px] leading-relaxed text-slate-500 space-y-1">
                      <li>Download the CSV template using the button below.</li>
                      <li>Fill product and variant information (leave "Image File" empty if none, otherwise match filenames exactly).</li>
                      <li>Put all product images into one folder (e.g. coragen.jpg, roundup.png).</li>
                      <li>Compress the image folder into a ZIP file.</li>
                      <li>Upload the CSV and ZIP files below, select duplicate handling, and click "Validate & Preview".</li>
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CSV file upload */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Step 1: Select CSV File (.csv)</label>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileSelected}
                        className="w-full text-xs text-slate-500 border border-slate-200 rounded-xl p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition"
                      />
                      {csvText && <span className="text-[10px] text-green-700 font-bold block">✓ CSV Loaded ({csvText.split('\n').filter(Boolean).length - 1} rows)</span>}
                    </div>

                    {/* ZIP file upload */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Step 2: Select Images ZIP (.zip - Optional)</label>
                      <input
                        type="file"
                        accept=".zip"
                        onChange={handleZipFileSelected}
                        className="w-full text-xs text-slate-500 border border-slate-200 rounded-xl p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition"
                      />
                      {zipFileName && <span className="text-[10px] text-green-700 font-bold block">✓ {zipFileName} ({Object.keys(zipFilesMap).length} files parsed)</span>}
                    </div>
                  </div>

                  {/* Textarea Paste as alternative */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Or Paste CSV Content directly</label>
                    <textarea
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      rows={4}
                      placeholder="Product Name,Company,Category,Description,Technical Specifications,SKU,Variant Name,Pack Size,Unit,Image File,Status,Price&#10;Coragen,FMC,Insecticides,Insecticide,Chlorantraniliprole 18.5% SC,COR-250,250 ml,250,ml,coragen.jpg,Active,650"
                      className="w-full p-3 border border-slate-200 rounded-xl font-mono text-[10.5px] text-slate-700 resize-none focus:outline-none focus:ring-1 focus:ring-green-500"
                    ></textarea>
                  </div>

                  {/* Upsert Policy card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-2">
                    <span className="font-extrabold text-slate-700 text-[10.5px] uppercase tracking-wider block">Upsert Policy Active</span>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed">
                      The bulk importer works as a strict upsert system. If a product and variant does not exist, it will be <strong>created</strong>. If it already exists, it will be <strong>updated</strong>. SKUs are verified for uniqueness.
                    </p>
                  </div>

                  {isValidating && (
                    <div className="text-center text-xs font-semibold text-slate-550 flex items-center justify-center space-x-1.5 animate-pulse">
                      <RefreshCcw className="w-4 h-4 animate-spin text-green-600" />
                      <span>Unzipping and reading files, please wait...</span>
                    </div>
                  )}

                </div>
              )}

              {bulkStep === 2 && (
                <div className="space-y-4 animate-fade-in max-w-full">
                  
                  {/* Results Indicators */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-2xs">
                    <span className="font-extrabold text-slate-700 text-[10.5px] uppercase tracking-wider block">Import Summary</span>
                    {uploadStats && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-650 font-semibold">
                        <div className="bg-white border border-slate-100 rounded-lg p-2.5 shadow-3xs flex flex-col justify-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CSV Rows</span>
                          <span className="text-sm font-black text-slate-800 mt-0.5">{uploadStats.rowsCount} Found</span>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-lg p-2.5 shadow-3xs flex flex-col justify-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">New Products</span>
                          <span className="text-sm font-black text-green-700 mt-0.5">+{uploadStats.newProductsCount}</span>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-lg p-2.5 shadow-3xs flex flex-col justify-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">New Variants</span>
                          <span className="text-sm font-black text-green-700 mt-0.5">+{uploadStats.newVariantsCount}</span>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-lg p-2.5 shadow-3xs flex flex-col justify-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Variants to Update</span>
                          <span className="text-sm font-black text-blue-700 mt-0.5">+{uploadStats.updatedVariantsCount}</span>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-lg p-2.5 shadow-3xs flex flex-col justify-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Images Matched</span>
                          <span className="text-sm font-black text-emerald-700 mt-0.5">+{uploadStats.imagesImported} matched</span>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-lg p-2.5 shadow-3xs flex flex-col justify-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Warnings</span>
                          <span className={`text-sm font-black mt-0.5 ${uploadStats.warningsCount > 0 ? 'text-amber-600' : 'text-slate-855'}`}>{uploadStats.warningsCount}</span>
                        </div>
                        <div className={`col-span-2 sm:col-span-3 border rounded-lg p-2.5 shadow-3xs flex flex-col justify-center ${uploadStats.errorsCount > 0 ? 'bg-rose-50 border-rose-250 text-rose-700 animate-pulse' : 'bg-white border-slate-100'}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Validation Errors</span>
                          <span className="text-sm font-black mt-0.5">{uploadStats.errorsCount} row-level errors</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Validation detailed list */}
                  {bulkPreview.some(row => row.validationStatus === 'ERROR' || row.validationStatus === 'WARNING') && (
                    <div className="bg-rose-50/50 text-rose-800 border border-rose-200 rounded-xl p-4 space-y-3 shadow-sm">
                      <span className="font-extrabold flex items-center text-[10.5px] uppercase tracking-wider text-rose-900 space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Validation Issues Detected</span>
                      </span>
                      <p className="text-[10px] text-rose-700">Please review row details in the preview table below or download the report.</p>
                      <div className="flex justify-start">
                        <button
                          type="button"
                          onClick={downloadErrorReport}
                          className="bg-rose-600 hover:bg-rose-750 text-white font-bold px-4 py-2 rounded-xl text-xxs flex items-center space-x-1.5 transition shadow"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Download Error Report</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="space-y-2 max-w-full">
                    <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Dry-Run Preview Table</span>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[350px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-[11px] font-medium text-slate-650 min-w-[900px]">
                        <thead className="bg-slate-50 border-b border-slate-250 sticky top-0 font-bold text-slate-500 uppercase tracking-wider text-[9px] z-10">
                          <tr>
                            <th className="p-3">Row</th>
                            <th className="p-3">Action</th>
                            <th className="p-3">Product Name</th>
                            <th className="p-3">Company</th>
                            <th className="p-3">SKU</th>
                            <th className="p-3">Variant</th>
                            <th className="p-3">Pack Size</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Image File</th>
                            <th className="p-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bulkPreview.map((row, idx) => {
                            let badgeColor = "bg-blue-50 text-blue-700 border-blue-100";
                            if (row.action === 'CREATE') badgeColor = "bg-green-50 text-green-700 border-green-100";
                            else if (row.action === 'ERROR') badgeColor = "bg-rose-50 text-rose-700 border-rose-100";
                            else if (row.action === 'WARNING') badgeColor = "bg-amber-50 text-amber-700 border-amber-100";

                            const isErrorRow = row.validationStatus === 'ERROR';
                            const isWarningRow = row.validationStatus === 'WARNING';

                            return (
                              <tr key={idx} className={`${isErrorRow ? 'bg-rose-50/20' : isWarningRow ? 'bg-amber-50/10' : 'bg-white'} hover:bg-slate-50/50 transition`}>
                                <td className="p-3 font-bold text-slate-400">{row.rowNum}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${badgeColor}`}>
                                    {row.action}
                                  </span>
                                </td>
                                <td className={`p-3 font-bold ${isErrorRow ? 'text-rose-800' : 'text-slate-800'}`}>{row.productName}</td>
                                <td className="p-3 text-slate-550">{row.companyName}</td>
                                <td className="p-3 font-mono font-bold text-slate-400">{row.sku || '-'}</td>
                                <td className="p-3 font-bold text-slate-700">{row.variantName}</td>
                                <td className="p-3 text-slate-550">{row.packSize}</td>
                                <td className={`p-3 font-bold ${isErrorRow && row.details.includes('Price') ? 'text-rose-600' : 'text-slate-750'}`}>
                                  {row.price ? `₹${row.price}` : <span className="text-rose-500 italic">Missing</span>}
                                </td>
                                <td className="p-3">
                                  <span className={`font-bold ${row.status.toLowerCase() === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                                    {row.status}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {row.imageFile ? (
                                    <div className="flex flex-col space-y-0.5">
                                      <span className="text-slate-550 truncate max-w-[120px]">{row.imageFile}</span>
                                      {zipFilesMap[row.imageFile.trim().toLowerCase()] ? (
                                        <span className="text-[7.5px] font-extrabold text-emerald-600 uppercase">✓ Matched</span>
                                      ) : (
                                        <span className="text-[7.5px] font-extrabold text-amber-600 uppercase">✕ Missing</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-350 italic">None</span>
                                  )}
                                </td>
                                <td className={`p-3 max-w-[200px] truncate ${isErrorRow ? 'text-rose-600 font-bold' : 'text-amber-650 font-bold'}`}>
                                  {row.details || <span className="text-slate-300 italic">-</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {bulkStep === 3 && (
                <div className="py-8 flex flex-col justify-center items-center text-center space-y-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 text-green-700 flex items-center justify-center text-3xl font-extrabold shadow-sm animate-scale-up">
                    ✓
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">IMPORT COMPLETE ✓</h4>
                  
                   {uploadStats && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 w-full max-w-xs text-left space-y-2 text-[11px] font-semibold text-slate-650 shadow-2xs">
                      <div className="flex justify-between">
                        <span>New Products:</span>
                        <span className="font-bold text-slate-800">{uploadStats.newProductsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Variants:</span>
                        <span className="font-bold text-slate-800">{uploadStats.newVariantsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Updated Variants:</span>
                        <span className="font-bold text-slate-800">{uploadStats.updatedVariantsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Images Matched:</span>
                        <span className="font-bold text-green-700">{uploadStats.imagesImported}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Warnings:</span>
                        <span className="font-bold text-slate-550">{uploadStats.warningsCount || 0}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Errors:</span>
                        <span>0</span>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                    Catalogue successfully merged with wholesale inventory records. Images have been matched and imported into local client storage.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2.5">
              {bulkStep === 1 && (
                <>
                  <button
                    onClick={closeBulkModal}
                    className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 px-4.5 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={triggerValidation}
                    disabled={!csvText.trim() || isValidating}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-slate-350 text-white px-6 py-2.5 rounded-xl font-bold transition shadow text-xs cursor-pointer"
                  >
                    Validate & Preview
                  </button>
                </>
              )}

              {bulkStep === 2 && (
                <>
                  <button
                    onClick={closeBulkModal}
                    className="bg-white border border-slate-200 hover:bg-slate-100 text-rose-600 px-4.5 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel Import
                  </button>
                  <button
                    onClick={confirmBulkUpload}
                    disabled={isValidating || bulkPreview.some(r => r.validationStatus === 'ERROR')}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-slate-350 disabled:text-slate-450 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold transition shadow text-xs cursor-pointer"
                  >
                    {isValidating ? "Importing..." : "Confirm & Import"}
                  </button>
                </>
              )}

              {bulkStep === 3 && (
                <>
                  <button
                    onClick={closeBulkModal}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold shadow text-xs cursor-pointer"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      setBulkStep(1);
                      setCsvText('');
                      setZipFileName('');
                      setZipFilesMap({});
                      setBulkPreview([]);
                      setUploadStats(null);
                    }}
                    className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-bold transition text-xs cursor-pointer"
                  >
                    Import Another File
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Dealer specific prices editor modal */}
      {editingDealerPricesIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Dealer-Specific Pricing</h4>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                  Pack Size: {formVariants[editingDealerPricesIndex]?.packSize} {formVariants[editingDealerPricesIndex]?.unit}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingDealerPricesIndex(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-[11px] text-slate-450 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              Configure customized dealer price overrides for this variant. If left empty or set to 0, the base price (₹{formVariants[editingDealerPricesIndex]?.price}) will be used.
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {dbService.getDealers().map((dealer: any) => {
                const currentPrice = formVariants[editingDealerPricesIndex]?.dealerPrices?.[dealer.id] || '';
                return (
                  <div key={dealer.id} className="flex items-center justify-between space-x-3 text-xs border-b border-slate-50 pb-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-800 block truncate">{dealer.shopName}</span>
                      <span className="text-[10px] text-slate-450 block">{dealer.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-455 font-bold text-xxs pr-0.5">₹</span>
                      <input
                        type="number"
                        placeholder={String(formVariants[editingDealerPricesIndex]?.price || 0)}
                        value={currentPrice}
                        onChange={(e) => {
                          const priceVal = Number(e.target.value) || 0;
                          setFormVariants(formVariants.map((item, idx) => {
                            if (idx === editingDealerPricesIndex) {
                              return {
                                ...item,
                                dealerPrices: {
                                  ...(item.dealerPrices || {}),
                                  [dealer.id]: priceVal
                                }
                              };
                            }
                            return item;
                          }));
                        }}
                        className="w-24 px-2 py-1 border border-slate-205 focus:outline-none focus:ring-1 focus:ring-green-500 rounded-lg font-bold text-slate-700 text-right"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingDealerPricesIndex(null)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
