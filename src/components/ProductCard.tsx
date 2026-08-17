import React, { useState } from 'react';
import type { Product, ProductVariant } from '../services/db';
import { dbService } from '../services/db';
import { useApp } from '../context/AppContext';
import { Eye, ShoppingCart, Plus, Minus } from 'lucide-react';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user, selectProduct, addToCart, setView } = useApp();

  const activeVariants = product.variants?.filter(v => !v.archived) || [];
  
  // Default selection: first available variant, or first variant if none are available
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(() => {
    return activeVariants.find(v => v.available) || activeVariants[0] || null;
  });

  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  // Check stock status of currently selected variant
  const isSelectedVariantInStock = selectedVariant ? selectedVariant.available : false;

  // Retrieve dealer-specific price for selected variant
  const dealerPrice = selectedVariant ? dbService.getDealerPrice(user?.id, selectedVariant) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedVariant) return;
    if (!user) {
      setView('login');
      return;
    }
    
    addToCart(product, selectedVariant, quantity);
    
    // Trigger button micro-interaction
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
    
    // Trigger toast notification
    setToastMessage(`${product.name} (${selectedVariant.packSize} ${selectedVariant.unit}) added to cart`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCardClick = () => {
    selectProduct(product.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-xs border border-slate-150 overflow-hidden flex flex-col hover:shadow-md transition-all duration-200 cursor-pointer relative"
    >
      {/* Product Image */}
      <div className="relative aspect-[4/3] w-full bg-white overflow-hidden border-b border-slate-100">
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain p-1.5 bg-white"
          brand={product.brand}
        />
        
        {/* Availability Badge */}
        <div className="absolute top-2.5 right-2.5">
          {isSelectedVariantInStock ? (
            <span className="bg-[#12873A] text-white text-[9.5px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
              In Stock
            </span>
          ) : (
            <span className="bg-red-600 text-white text-[9.5px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Product Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Company Name */}
          <div className="text-[11px] text-[#12873A] font-bold uppercase tracking-wider mb-0.5">
            {product.brand}
          </div>
          {/* Category */}
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold mb-1.5">
            <span>{product.category}</span>
            <span>{activeVariants.length} Sizes</span>
          </div>
          {/* Product Name - 15-16px, semibold */}
          <h3 className="font-semibold text-slate-800 text-[15px] leading-snug line-clamp-2 min-h-[40px]">
            {product.name}
          </h3>
        </div>

        <div className="space-y-3 pt-2.5 border-t border-slate-100">
          {/* Select Variant / Pack Size - 32px height buttons */}
          {activeVariants.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
                PACK SIZE
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeVariants.map(v => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVariant(v);
                        setQuantity(1); // Reset quantity when variant changes
                      }}
                      className={`h-8 px-2.5 rounded-lg text-[12px] transition-all duration-150 border flex items-center justify-center space-x-1 font-semibold cursor-pointer ${
                        isSelected
                          ? 'border-2 border-[#12873A] bg-green-50 text-[#12873A] font-bold shadow-xs'
                          : 'bg-white text-slate-650 border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      <span>{v.packSize} {v.unit}</span>
                      {!v.available && (
                        <span className="text-[8px] bg-rose-100 text-rose-700 px-1 py-0.5 rounded font-bold">
                          OOS
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing & Add to Cart Area */}
          <div className="pt-0.5">
            {user ? (
              /* Logged in Dealer / Admin view */
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-450 font-medium uppercase tracking-wider">Dealer Price</span>
                  <span className="text-[18px] font-bold text-[#12873A] leading-tight">₹{dealerPrice}</span>
                </div>
                {/* Quantity and Add to Cart Section */}
                {isSelectedVariantInStock ? (
                  <div className="space-y-2">
                    {/* Quantity Selector - 42px height, full width */}
                    <div className="w-full flex items-center border border-slate-205 rounded-xl overflow-hidden bg-slate-50 h-[42px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuantity(q => Math.max(1, q - 1));
                        }}
                        className="w-11 h-full text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-base select-none"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="flex-1 text-center text-sm font-bold text-slate-700 select-none">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuantity(q => q + 1);
                        }}
                        className="w-11 h-full text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-base select-none"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Add to Cart button - 42px height, single line */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className={`w-full font-bold rounded-xl text-xs h-[42px] px-3 whitespace-nowrap flex items-center justify-center gap-1.5 transition-all duration-155 shadow-xs cursor-pointer ${
                        isAdded ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-[#12873A] hover:bg-[#16A34A] text-white'
                      }`}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {isAdded ? (
                        <>
                          <span className="text-white font-black text-xs mr-0.5">✓</span>
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 flex-shrink-0 text-white" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* Disabled Add to Cart if variant is Out of Stock */
                  <button
                    type="button"
                    disabled
                    className="w-full bg-slate-100 text-slate-450 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-slate-200 cursor-not-allowed h-[42px]"
                  >
                    <span className="whitespace-nowrap">🚫 Out of Stock</span>
                  </button>
                )}
              </div>
            ) : (
              /* Guest View - HIDE PRICE */
              <div className="space-y-2">
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-2 text-center h-[38px] flex items-center justify-center">
                  <span className="text-[11px] font-bold text-slate-500 block leading-tight">
                    🔒 Login to know price
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                  }}
                  className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all border border-slate-205 h-[42px] cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Details</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/90 text-white text-[11.5px] px-4 py-2.5 rounded-full shadow-lg flex items-center space-x-2 animate-fade-in backdrop-blur-xs font-semibold whitespace-nowrap"
        >
          <span className="text-emerald-400 font-extrabold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
