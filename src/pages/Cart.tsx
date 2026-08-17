import React from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, ArrowRight, ShoppingBag, Plus, Minus } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';

export const Cart: React.FC = () => {
  const { user, cart, updateCartQuantity, removeFromCart, setView } = useApp();

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (!user) {
      setView('login');
      return;
    }
    setView('checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center pb-24">
        <div className="bg-white p-4.5 rounded-full border border-slate-150 shadow-sm mb-4">
          <ShoppingBag className="w-12 h-12 text-slate-300" />
        </div>
        <h3 className="font-bold text-slate-700 text-sm mb-1.5">Your Cart is Empty</h3>
        <p className="text-slate-400 text-xs max-w-xs mx-auto mb-6 leading-relaxed">
          You haven't added any products to your order yet. Browse our catalogue to get started.
        </p>
        <button
          onClick={() => setView('catalog')}
          className="bg-[#12873A] hover:bg-[#16A34A] text-white font-bold text-xs py-3 px-6 rounded-xl shadow transition cursor-pointer"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-28">
      {/* Header bar */}
      <div className="bg-white border-b border-slate-150 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-xs">
        <h2 className="font-extrabold text-base text-slate-800">My Cart</h2>
        <span className="text-xs bg-green-50 text-[#12873A] font-bold px-3 py-0.5 rounded-full border border-green-100">
          {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
        </span>
      </div>

      {/* Cart Items List */}
      <div className="p-4 space-y-3.5">
        {cart.map(item => (
          <div
            key={item.variant.id}
            className="bg-white rounded-2xl p-3 shadow-xs border border-slate-150 flex space-x-3 items-center"
          >
            {/* Image */}
            <SafeImage
              src={item.product.imageUrl}
              alt={item.product.name}
              className="w-16 h-16 rounded-xl object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
              brand={item.product.brand}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">
                {item.product.brand} • {item.variant.packSize} {item.variant.unit}
              </span>
              <h3 className="font-bold text-slate-800 text-xs xs:text-sm truncate leading-tight mt-1 mb-2">
                {item.product.name}
              </h3>

              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-[#12873A]">
                  ₹{item.variant.price}
                </span>

                {/* Quantity adjustments */}
                <div className="flex items-center border border-slate-205 rounded-xl overflow-hidden bg-slate-50 h-[36px]">
                  <button
                    onClick={() => updateCartQuantity(item.variant.id, item.quantity - 1)}
                    className="px-2.5 py-1 text-slate-500 hover:bg-slate-200"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-700">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(item.variant.id, item.quantity + 1)}
                    className="px-2.5 py-1 text-slate-500 hover:bg-slate-200"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Remove */}
            <button
              onClick={() => removeFromCart(item.variant.id)}
              className="p-2.5 text-slate-350 hover:text-red-650 transition-colors cursor-pointer"
              aria-label="Remove item"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Bill Details */}
      <div className="px-4 mt-2">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-150 space-y-3.5 text-xs">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2.5 uppercase tracking-wider text-[10px]">
            Billing Summary
          </h3>
          <div className="flex justify-between text-slate-500 font-medium">
            <span>Subtotal</span>
            <span className="text-slate-800">₹{getSubtotal()}</span>
          </div>
          <div className="flex justify-between text-slate-500 font-medium">
            <span>Delivery / Handling</span>
            <span className="text-[#12873A] font-bold">FREE</span>
          </div>
          <div className="flex justify-between text-slate-500 font-medium">
            <span>Estimated Taxes (GST)</span>
            <span className="text-slate-400">Included in base price</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 font-extrabold text-sm text-slate-800">
            <span>Total Payable Amount</span>
            <span className="text-[#12873A] text-base">₹{getSubtotal()}</span>
          </div>
        </div>
      </div>

      {/* Checkout Bottom Action Bar */}
      <div className="fixed bottom-14 left-0 right-0 z-20 bg-white border-t border-slate-200 shadow-xl px-4 py-3.5 max-w-[480px] mx-auto flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Order</span>
          <span className="text-base font-extrabold text-[#12873A]">₹{getSubtotal()}</span>
        </div>
        <button
          onClick={handleCheckout}
          className="bg-[#12873A] hover:bg-[#16A34A] text-white font-bold py-3.5 px-6 rounded-xl text-xs flex items-center justify-center space-x-2 shadow transition cursor-pointer"
        >
          <span>Proceed to Checkout</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
      </div>

    </div>
  );
};
