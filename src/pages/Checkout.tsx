import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, Info, CreditCard, Clock, CheckSquare, QrCode } from 'lucide-react';

export const Checkout: React.FC = () => {
  const { user, cart, settings, placeOrder, setView } = useApp();
  
  const showPayLater = settings.allowPayLater !== false;
  const showPayNow = settings.allowPayNow !== false;
  const defaultMethod = showPayLater ? 'pay_later' : 'pay_now';

  const [paymentMethod, setPaymentMethod] = useState<'pay_now' | 'pay_later'>(defaultMethod);
  const [hasPaidConfirmation, setHasPaidConfirmation] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'pay_now' && !hasPaidConfirmation) {
      setError("Please confirm that you have scanned and paid the amount via UPI");
      return;
    }
    
    setError(null);
    setIsPlacingOrder(true);

    try {
      const res = await placeOrder(paymentMethod);
      setIsPlacingOrder(false);
      if (!res.success) {
        setError(res.error || "Failed to place order. Please try again.");
      }
    } catch (err: any) {
      setIsPlacingOrder(false);
      setError(err?.message || "Failed to place order. Please try again.");
    }
  };

  if (!user) {
    setView('login');
    return null;
  }

  const subtotal = getSubtotal();

  const upiString = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.upiName)}&am=${subtotal}&cu=INR`;
  const qrCodeUrl = settings.upiQrCode || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;

  const gridColsClass = showPayLater && showPayNow ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-20">
      
      {/* Header bar */}
      <div className="sticky top-0 bg-white border-b border-slate-150 z-10 px-4 py-3 flex items-center shadow-xs">
        <button
          onClick={() => setView('cart')}
          className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-bold text-sm text-slate-800 ml-2">Checkout Order</span>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-750 text-xs p-3.5 rounded-xl border border-red-100 animate-shake font-bold">
            {error}
          </div>
        )}

        {/* Dealer Business Profile Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
          <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-2.5 mb-2.5 flex items-center">
            <Info className="w-4 h-4 text-[#12873A] mr-1.5" />
            <span>Delivery & Dealer Information</span>
          </h3>
          <div className="text-xs space-y-1.5 font-medium text-slate-650">
            <p className="font-bold text-slate-800 text-sm">{user.shopName}</p>
            <p>Contact: <span className="text-slate-800 font-semibold">{user.name} ({user.mobile})</span></p>
            {user.email && <p>Email: {user.email}</p>}
            <p>Address: {user.address}</p>
            {user.gstNumber && <p className="text-slate-400 font-mono text-[10px]">GSTIN: {user.gstNumber}</p>}
          </div>
        </div>

        {/* Order Items summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
          <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-2.5">
            Order Items Summary
          </h3>
          <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto pr-1">
            {cart.map(item => (
              <div key={item.variant.id} className="py-2.5 flex justify-between items-center text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-slate-800 truncate">{item.product.name}</p>
                  <p className="text-[10px] text-slate-400">{item.variant.packSize} {item.variant.unit} • Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-slate-700 flex-shrink-0">
                  ₹{item.variant.price * item.quantity}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center font-bold text-xs text-slate-800">
            <span>Total Payable Amount</span>
            <span className="text-[#12873A] text-sm font-extrabold">₹{subtotal}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3.5">
          <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-2.5">
            Select Payment Method
          </h3>

          <div className={`grid ${gridColsClass} gap-3`}>
            {/* Pay Later Option */}
            {showPayLater && (
              <button
                onClick={() => {
                  setPaymentMethod('pay_later');
                  setError(null);
                }}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition cursor-pointer ${
                  paymentMethod === 'pay_later'
                    ? 'border-2 border-[#12873A] bg-green-50/50 text-[#12873A] font-bold shadow-xs'
                    : 'border-slate-205 text-slate-500 bg-white hover:bg-slate-50'
                }`}
              >
                <Clock className="w-5.5 h-5.5 mb-1.5" />
                <span className="text-xs">Pay Later</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-tight">Payment due on delivery</span>
              </button>
            )}

            {/* Pay Now Option */}
            {showPayNow && (
              <button
                onClick={() => {
                  setPaymentMethod('pay_now');
                  setError(null);
                }}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition cursor-pointer ${
                  paymentMethod === 'pay_now'
                    ? 'border-2 border-[#12873A] bg-green-50/50 text-[#12873A] font-bold shadow-xs'
                    : 'border-slate-205 text-slate-500 bg-white hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5.5 h-5.5 mb-1.5" />
                <span className="text-xs">Pay Now</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-tight">Scan instant UPI QR code</span>
              </button>
            )}
          </div>

          {/* Payment Method Details container */}
          {paymentMethod === 'pay_now' ? (
            /* UPI Scan flow */
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 flex flex-col items-center space-y-3.5 mt-2 animate-fade-in">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wholesaler UPI Details</span>
                <p className="text-xs font-bold text-slate-800">{settings.upiName}</p>
                <p className="text-[10px] font-mono text-slate-500 bg-white border border-slate-150 px-2 py-0.5 rounded inline-block">{settings.upiId}</p>
              </div>

              {/* UPI QR Code */}
              <div className="bg-white p-3.5 rounded-xl shadow-md border border-slate-100 flex flex-col items-center">
                <img
                  src={qrCodeUrl}
                  alt="UPI QR Code"
                  className="w-40 h-40 object-contain"
                  onError={(e) => {
                    // Fallback to custom SVG mockup if QR generator API fails offline
                    e.currentTarget.style.display = 'none';
                    const target = e.currentTarget.nextElementSibling as HTMLElement;
                    if (target) target.style.display = 'block';
                  }}
                />
                {/* SVG mock fallback QR */}
                <div style={{ display: 'none' }} className="w-40 h-40 bg-slate-105 flex items-center justify-center border border-slate-200 rounded">
                  <QrCode className="w-16 h-16 text-slate-400 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">UPI QR (Offline)</span>
                </div>
                <div className="text-center mt-2.5 border-t border-slate-100 pt-2 w-full">
                  <span className="text-[10px] text-slate-400">Amount to pay</span>
                  <p className="text-base font-black text-[#12873A]">₹{subtotal}</p>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 leading-relaxed text-center px-2">
                Scan the QR code with any UPI app (GPay, PhonePe, Paytm), complete the transfer, and check the confirmation box below.
              </div>

              {/* Confirmation checkbox */}
              <button
                type="button"
                onClick={() => setHasPaidConfirmation(!hasPaidConfirmation)}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 flex items-center space-x-2.5 justify-center shadow-xs text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                {hasPaidConfirmation ? (
                  <CheckSquare className="w-5 h-5 text-[#12873A] flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 border-2 border-slate-350 rounded-md flex-shrink-0 bg-white"></div>
                )}
                <span>I have completed the payment of ₹{subtotal}</span>
              </button>
            </div>
          ) : (
            /* Pay Later flow info */
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-150 text-xs text-slate-500 leading-relaxed space-y-1.5 mt-2">
              <p className="font-bold text-slate-700">📌 Pay Later Guidelines</p>
              <p>Your order will be processed with a credit status of <span className="font-bold text-amber-600">Payment Pending</span>.</p>
              <p>Billing terms are governed by your standard wholesale agreement. Payment must be cleared on delivery or as agreed in your payment schedule.</p>
            </div>
          )}
        </div>
      </div>

      {/* Place Order CTA Bottom Bar */}
      <div className="fixed bottom-14 left-0 right-0 z-20 bg-white border-t border-slate-200 shadow-xl px-4 py-3.5 max-w-[480px] mx-auto flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Net Total</span>
          <span className="text-base font-extrabold text-[#12873A]">₹{subtotal}</span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder}
          className="bg-[#12873A] hover:bg-[#16A34A] text-white font-bold py-3.5 px-6 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition cursor-pointer"
        >
          {isPlacingOrder ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span>Place Order</span>
          )}
        </button>
      </div>

    </div>
  );
};
