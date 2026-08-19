import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { dbService } from '../services/db';
import type { Product, ProductVariant } from '../services/db';
import { ChevronLeft, ShoppingCart, CheckCircle2, FileText, Ban } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';

export const ProductDetails: React.FC = () => {
  const { user, selectedProductId, addToCart, setView, selectCompany } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    if (selectedProductId) {
      const activeProducts = dbService.getProducts(true); // check all
      const p = activeProducts.find((prod: Product) => prod.id === selectedProductId);
      if (p) {
        setProduct(p);
        const activeVariants = p.variants?.filter((v: ProductVariant) => !v.archived) || [];
        const firstAvailable = activeVariants.find((v: ProductVariant) => v.available) || activeVariants[0] || null;
        setSelectedVariant(firstAvailable);
      }
    }
  }, [selectedProductId]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    if (!user) {
      setView('login');
      return;
    }
    addToCart(product, selectedVariant, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <Ban className="w-12 h-12 text-slate-300 mb-2" />
        <h3 className="font-bold text-slate-700 text-sm mb-1">Product Not Found</h3>
        <p className="text-slate-400 text-xs mb-4">The product may have been archived or is temporarily unavailable.</p>
        <button
          onClick={() => setView('catalog')}
          className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 px-4 rounded-lg"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-24">
      {/* Header bar */}
      <div className="sticky top-0 bg-white border-b border-slate-150 z-10 px-4 py-3 flex items-center shadow-xs">
        <button
          onClick={() => setView('catalog')}
          className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-bold text-sm text-slate-800 ml-2 truncate max-w-[280px]">
          {product.name}
        </span>
      </div>

      {/* Main product photo */}
      <div className="relative w-full aspect-video md:aspect-[2/1] bg-white overflow-hidden border-b border-slate-150">
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain p-4 bg-white"
          brand={product.brand}
        />
        <div 
          onClick={() => product.companyId && selectCompany(product.companyId)}
          className="absolute bottom-3 left-3 bg-black/60 hover:bg-[#12873A] text-white text-xs font-bold px-3.5 py-1.5 rounded-full cursor-pointer transition shadow"
        >
          {product.brand}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Core details block */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3.5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] bg-green-50 text-[#12873A] font-bold px-2.5 py-1 rounded-full border border-green-100">
                {product.category}
              </span>
              <h2 className="text-base xs:text-lg font-bold text-slate-800 mt-2.5 leading-tight">
                {product.name}
              </h2>
            </div>
            {/* Status */}
            <div className="text-right shrink-0">
              {selectedVariant?.available ? (
                <span className="text-[10px] xs:text-xs bg-emerald-50 text-emerald-600 font-bold px-2.5 py-1 rounded-full border border-emerald-100 shadow-xxs">
                  In Stock
                </span>
              ) : (
                <span className="text-[10px] xs:text-xs bg-rose-50 text-rose-600 font-bold px-2.5 py-1 rounded-full border border-rose-100 shadow-xxs">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3.5 border-t border-slate-100 text-xs">
            <div 
              onClick={() => product.companyId && selectCompany(product.companyId)}
              className="cursor-pointer group"
            >
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mb-0.5">Company / Brand</span>
              <span className="text-[#12873A] font-bold group-hover:underline">{product.brand}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mb-0.5">Category</span>
              <span className="text-slate-700 font-bold">{product.category}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mb-0.5">Pack Size</span>
              <span className="text-slate-700 font-bold">
                {selectedVariant ? `${selectedVariant.packSize} ${selectedVariant.unit}` : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mb-0.5">SKU / Product Code</span>
              <span className="text-slate-700 font-mono font-bold">
                {selectedVariant ? selectedVariant.sku : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Select Pack Size */}
        {product.variants && product.variants.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              PACK SIZE
            </span>
            <div className="flex flex-wrap gap-2">
              {product.variants.filter(v => !v.archived).map(v => {
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v);
                      setQuantity(1);
                    }}
                    className={`px-4 h-[38px] rounded-xl text-xs font-semibold transition border flex items-center justify-center space-x-1.5 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#12873A] bg-green-50 text-[#12873A] font-bold shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span>{v.packSize} {v.unit}</span>
                    {!v.available && (
                      <span className="text-[8px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                        OOS
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing area */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          {user ? (
            /* Logged-in dealer price */
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-450 font-bold uppercase tracking-wider block">Exclusive Dealer Price</span>
                <span className="text-[10px] text-green-600 font-semibold">*Prices are exclusive of GST</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#12873A]">
                  {selectedVariant ? `₹${dbService.getDealerPrice(user?.id, selectedVariant)}` : '—'}
                </span>
              </div>
            </div>
          ) : (
            /* Guest Price hiding */
            <div className="flex flex-col items-center py-2 text-center space-y-3">
              <p className="text-xs font-bold text-slate-500">
                🔒 Login to know price
              </p>
              <button
                onClick={() => setView('login')}
                className="bg-[#12873A] hover:bg-[#16A34A] text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow transition cursor-pointer"
              >
                Log In to View Price
              </button>
            </div>
          )}
        </div>

        {/* Description & Technical Specifications */}
        {(product.description || product.techSpecs) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4 text-xs">
            {product.description && (
              <div>
                <h3 className="text-slate-800 font-bold text-sm border-b border-slate-100 pb-2 mb-2 flex items-center">
                  <FileText className="w-4 h-4 text-[#12873A] mr-1.5" />
                  <span>Product Description</span>
                </h3>
                <p className="text-slate-650 leading-relaxed font-medium">{product.description}</p>
              </div>
            )}

            {product.techSpecs && (
              <div>
                <h3 className="text-slate-800 font-bold text-sm border-b border-slate-100 pb-2 mb-2">
                  Technical Specifications
                </h3>
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-150 font-mono text-[11px] text-slate-700 leading-normal">
                  {product.techSpecs}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Button for checkout */}
      {selectedVariant && (
        <div className="fixed bottom-14 left-0 right-0 z-20 bg-white border-t border-slate-200 shadow-xl px-4 py-3 max-w-[480px] mx-auto flex items-center justify-between space-x-3">
          {user ? (
            /* Logged in Dealer add to cart action */
            <>
              {selectedVariant.available ? (
                <>
                  <div className="flex items-center border border-slate-205 rounded-xl overflow-hidden shadow-inner bg-slate-50 h-[44px]">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-3.5 py-2 text-slate-500 font-bold hover:bg-slate-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-10 text-center border-none bg-transparent font-bold text-xs focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="px-3.5 py-2 text-slate-500 font-bold hover:bg-slate-200"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl text-xs font-bold text-white shadow transition cursor-pointer h-[44px] ${
                      isAdded ? 'bg-emerald-600' : 'bg-[#12873A] hover:bg-[#16A34A]'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 text-white" />
                        <span>Add to Order</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  disabled
                  className="w-full bg-slate-100 text-slate-400 font-bold py-3.5 px-4 rounded-xl text-xs cursor-not-allowed border border-slate-200 text-center flex items-center justify-center h-[44px]"
                >
                  Out of Stock
                </button>
              )}
            </>
          ) : (
            /* Guest action redirect */
            <button
              onClick={() => setView('login')}
              className="w-full bg-[#12873A] hover:bg-[#16A34A] text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow transition h-[44px] cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Login to Place Order</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
