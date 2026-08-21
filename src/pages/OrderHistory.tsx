import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { dbService } from '../services/db';
import type { Order } from '../services/db';
import { jsPDF } from 'jspdf';
import { ChevronRight, Calendar, CreditCard, RefreshCw, X, Download, Share2, ClipboardList, Printer, Eye, FileText, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import { DeliveryChallanComponent, downloadChallanPDF } from '../components/DeliveryChallan';
import { BUSINESS_CONFIG, BUSINESS_INFO } from '../config/business';

export const OrderHistory: React.FC = () => {
  const { user, repeatOrder, setView, syncVersion } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [repeatResult, setRepeatResult] = useState<{ added: number; unavailable: number } | null>(null);

  // Challan Preview State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewChallan, setPreviewChallan] = useState<any>(null);

  // Isolated printing state
  const [isPrinting, setIsPrinting] = useState(false);
  const [printChallanData, setPrintChallanData] = useState<any>(null);

  // Load orders
  useEffect(() => {
    if (user) {
      const list = dbService.getOrders(user.id, user.role);
      setOrders(list);
    }
  }, [user, syncVersion]);

  const handlePrintChallan = (challan: any) => {
    if (isPrinting) return;
    setIsPrinting(true);
    setPrintChallanData(challan);
  };

  // Printing engine trigger for main window print container
  useEffect(() => {
    if (!printChallanData || !isPrinting) return;
    
    let active = true;
    
    // Give React time to mount the portal element to document.body
    const timer = setTimeout(() => {
      if (!active) return;
      const printElement = document.getElementById('delivery-challan-print');
      
      if (!printElement) {
        console.error("Print element #delivery-challan-print not found in DOM.");
        alert("Unable to prepare Delivery Challan for printing. Please try again.");
        setIsPrinting(false);
        setPrintChallanData(null);
        return;
      }

      // Check all images inside the print container are loaded
      const images = Array.from(printElement.getElementsByTagName('img'));
      const imagePromises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // skip failed images
        });
      });

      Promise.all(imagePromises).then(() => {
        if (!active) return;
        const fontFaceSet = (document as any).fonts;
        const fontsPromise = fontFaceSet?.ready || Promise.resolve();
        
        fontsPromise.then(() => {
          if (!active) return;
          // Yield to browser layout engine for sizing/repaint
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (!active) return;
              
              // Run debugging checks before window.print()
              console.log('PRINT ELEMENT:', printElement);
              console.log('PRINT HTML:', printElement?.innerHTML);
              console.log('PRINT HEIGHT:', printElement?.getBoundingClientRect().height);
              console.log('PRINT DISPLAY:', getComputedStyle(printElement).display);
              console.log('PRINT VISIBILITY:', getComputedStyle(printElement).visibility);

              try {
                window.focus();
                window.print();
              } catch (err) {
                console.error("Printing failed:", err);
                alert("Unable to prepare Delivery Challan for printing. Please try again.");
              } finally {
                setIsPrinting(false);
                setPrintChallanData(null);
              }
            }, 300); // 300ms layout settle time
          });
        });
      });
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [printChallanData, isPrinting]);

  if (!user) {
    setView('login');
    return null;
  }

  const handleRepeatOrder = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = repeatOrder(order);
    if (res.success) {
      setRepeatResult({ added: res.addedCount, unavailable: res.unavailableCount });
      setTimeout(() => setRepeatResult(null), 3500);
    }
  };

  // --- WHATSAPP SHARE FOR HISTORICAL ORDER ---
  const handleWhatsAppShare = (order: Order) => {
    const methodStr = order.paymentMethod === 'pay_now' ? 'Pay Now (UPI)' : 'Pay Later';
    const statusStr = order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending';
    
    let itemsText = '';
    order.items?.forEach((item, idx) => {
      itemsText += `${idx + 1}. ${item.productName} (${item.packSize}) — Qty ${item.quantity} (₹${item.price * item.quantity})\n`;
    });

    const message = `*ORDER DETAILS SUMMARY* 🌾\n\n` +
      `*Order No:* ${order.orderNumber || order.id}\n` +
      `*Dealer:* ${order.dealerName}\n` +
      `*Shop:* ${order.shopName}\n` +
      `*Date:* ${order.date}\n\n` +
      `*Products:*\n${itemsText}\n` +
      `*Total Amount:* ₹${order.total}\n` +
      `*Payment Method:* ${methodStr}\n` +
      `*Payment Status:* ${statusStr}\n\n` +
      `Shared from ${BUSINESS_CONFIG.name} Partner App.`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // --- PDF GENERATOR FOR HISTORICAL ORDER ---
  const handleDownloadPDF = (order: Order) => {
    try {
      const doc = new jsPDF();
      
      doc.setFillColor(22, 163, 74);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      const settings = dbService.getSettings();
      doc.text(BUSINESS_INFO.name, 15, 18);
      
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text("AUTHORIZED DEALER ORDER SUMMARY PDF", 15, 25);
      
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.text(`${BUSINESS_INFO.name}, ${BUSINESS_INFO.address}`, 130, 15);
      doc.text(`Contact: ${BUSINESS_INFO.phone} | ${settings.companyEmail || 'orders@shubhamkrishisewa.com'}`, 130, 20);

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text("ORDER SUMMARY", 15, 45);
      
      doc.setDrawColor(220, 220, 220);
      doc.line(15, 48, 195, 48);

      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Order Number:`, 15, 56);
      doc.text(`Order Date:`, 15, 62);
      doc.text(`Payment Method:`, 15, 68);
      doc.text(`Payment Status:`, 15, 74);
      
      doc.setFont('Helvetica', 'normal');
      doc.text(order.orderNumber || order.id, 50, 56);
      doc.text(order.date, 50, 62);
      doc.text(order.paymentMethod === 'pay_now' ? 'Pay Now (UPI)' : 'Pay Later', 50, 68);
      doc.text(order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending', 50, 74);
      
      doc.setFont('Helvetica', 'bold');
      doc.text(`Dealer Shop:`, 110, 56);
      doc.text(`Dealer Name:`, 110, 62);
      
      doc.setFont('Helvetica', 'normal');
      doc.text(order.shopName, 140, 56);
      doc.text(order.dealerName, 140, 62);

      let startY = 88;
      doc.setFillColor(240, 240, 240);
      doc.rect(15, startY, 180, 8, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text("Sr.", 18, startY + 5);
      doc.text("Product Description", 30, startY + 5);
      doc.text("Brand & Pack", 95, startY + 5);
      doc.text("Rate", 145, startY + 5);
      doc.text("Qty", 165, startY + 5);
      doc.text("Amount", 178, startY + 5);
      
      doc.setFont('Helvetica', 'normal');
      let currentY = startY + 8;
      
      order.items?.forEach((item, idx) => {
        currentY += 8;
        if (idx % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, currentY - 5, 180, 8, 'F');
        }
        doc.text((idx + 1).toString(), 18, currentY);
        let shortName = item.productName;
        if (shortName.length > 32) shortName = shortName.substring(0, 29) + "...";
        doc.text(shortName, 30, currentY);
        doc.text(`${item.brand} (${item.packSize})`, 95, currentY);
        doc.text(`₹${item.price}`, 145, currentY);
        doc.text(item.quantity.toString(), 165, currentY);
        doc.text(`₹${item.price * item.quantity}`, 178, currentY);
      });
      
      currentY += 6;
      doc.line(15, currentY, 195, currentY);
      
      currentY += 10;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("Gross Subtotal:", 135, currentY);
      doc.setFont('Helvetica', 'normal');
      doc.text(`₹${order.subtotal}`, 175, currentY);
      
      currentY += 6;
      doc.setFont('Helvetica', 'bold');
      doc.text("Net Total Payable:", 135, currentY);
      doc.setTextColor(22, 163, 74);
      doc.text(`₹${order.total}`, 175, currentY);
      
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont('Helvetica', 'normal');
      doc.text("Note: This is an automatically generated electronic order receipt.", 15, 275);
      
      doc.save(`Shubham_Krishi_Sewa_Kendra_Order_Summary_${order.orderNumber || order.id}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error printing PDF");
    }
  };

  const getStatusText = (status: Order['orderStatus']): string => {
    switch (status) {
      case 'new': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'partially_confirmed': return 'Partially Confirmed';
      case 'processing': return 'Processing';
      case 'dispatched': return 'Dispatched';
      case 'completed': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return String(status);
    }
  };

  const getOrderStatusColor = (status: Order['orderStatus']) => {
    switch (status) {
      case 'new': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'confirmed': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'partially_confirmed': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'processing': return 'bg-sky-50 text-sky-750 border-sky-100';
      case 'dispatched': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-150 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-xs">
        <h2 className="font-bold text-base text-slate-800">My Orders</h2>
        <span className="text-xs bg-slate-100 text-slate-655 font-bold px-2.5 py-0.5 rounded-full">
          {orders.length} Total
        </span>
      </div>

      {/* Repeat Toast alert */}
      {repeatResult && (
        <div className="mx-4 mt-3 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-slide-in">
          <span>
            Added {repeatResult.added} item(s) to Cart. 
            {repeatResult.unavailable > 0 && ` (${repeatResult.unavailable} item(s) currently out of stock)`}
          </span>
          <button 
            onClick={() => setView('cart')}
            className="underline font-bold text-xxs uppercase tracking-wider pl-2"
          >
            Open Cart
          </button>
        </div>
      )}

      {/* Orders List */}
      <div className="p-4 space-y-3.5">
        {orders.length > 0 ? (
          orders.map(order => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white rounded-2xl p-4 shadow-xs border border-slate-150 hover:shadow-sm transition-all duration-150 cursor-pointer space-y-3.5"
            >
              {/* Header: ID & Status */}
              <div className="flex justify-between items-center">
                <span className="font-mono font-black text-sm text-[#12873A]">
                  {order.orderNumber || order.id}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getOrderStatusColor(order.orderStatus)}`}>
                  {getStatusText(order.orderStatus).toUpperCase()}
                </span>
              </div>

              {/* Order content brief */}
              <div className="text-xs text-slate-500 space-y-1.5 font-medium">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Date: {order.date}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>
                    Payment: {order.paymentMethod === 'pay_now' ? 'UPI' : 'Pay Later'} • 
                    <span className={`font-bold ml-1 ${order.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-600'}`}>
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Footer: Amount & Repeat order */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Total Amount</span>
                  <span className="text-sm font-black text-slate-800">₹{order.total}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleRepeatOrder(order, e)}
                    className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-[#12873A] border border-green-150 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xxs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Repeat</span>
                  </button>
                  <ChevronRight className="w-4.5 h-4.5 text-slate-350" />
                </div>
              </div>

            </div>
          ))
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-2xl border border-slate-100 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-700 text-sm mb-1">No Orders Yet</h4>
            <p className="text-slate-400 text-xs max-w-xs mx-auto mb-4 leading-relaxed">
              Your previous order transactions will be listed here.
            </p>
            <button
              onClick={() => setView('catalog')}
              className="bg-[#12873A] hover:bg-[#16A34A] text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow transition cursor-pointer"
            >
              Browse Catalogue
            </button>
          </div>
        )}
      </div>

      {/* ORDER DETAILS POPUP DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-end justify-center p-0 max-w-[480px] mx-auto animate-fade-in">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-slide-up">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center">
                  <span>Order Details</span>
                  <span className="font-mono text-[#12873A] ml-1.5 font-extrabold">{selectedOrder.orderNumber || selectedOrder.id}</span>
                </h3>
                <p className="text-[10px] text-slate-450 font-medium">Placed on {selectedOrder.date}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full hover:bg-slate-105 text-slate-500 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* Status block */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Order Status</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block mt-1 ${getOrderStatusColor(selectedOrder.orderStatus)}`}>
                    {getStatusText(selectedOrder.orderStatus).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Payment Status</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block mt-1 ${
                    selectedOrder.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {selectedOrder.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Delivery Challan Section for Dealer */}
              {(selectedOrder.orderStatus === 'dispatched' || selectedOrder.orderStatus === 'completed') && (
                (() => {
                  const challan = dbService.getDeliveryChallan(selectedOrder.id, user.id, user.role);
                  if (challan) {
                    return (
                      <div className="bg-green-50/50 border border-green-100 rounded-2xl p-3.5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Delivery Challan</span>
                          <span className="font-mono text-[#12873A] font-black text-xs">{challan.challanNumber}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2.5">
                          <button
                            onClick={() => {
                              setPreviewChallan(challan);
                              setIsPreviewModalOpen(true);
                            }}
                            className="py-2 bg-white hover:bg-slate-50 border border-slate-205 text-slate-700 rounded-xl font-bold flex flex-col items-center justify-center text-[9px] transition shadow-xs cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-[#12873A] mb-0.5" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => downloadChallanPDF(challan)}
                            className="py-2 bg-white hover:bg-slate-50 border border-slate-205 text-slate-700 rounded-xl font-bold flex flex-col items-center justify-center text-[9px] transition shadow-xs cursor-pointer"
                          >
                            <Download className="w-4 h-4 text-[#12873A] mb-0.5" />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => handlePrintChallan(challan)}
                            disabled={isPrinting}
                            className="py-2 bg-white hover:bg-slate-50 border border-slate-205 text-slate-700 rounded-xl font-bold flex flex-col items-center justify-center text-[9px] transition shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            <Printer className="w-4 h-4 text-[#12873A] mb-0.5" />
                            <span>{isPrinting ? 'Preparing...' : 'Print'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                  <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
                    Order Items Breakdown
                  </h4>
                  {selectedOrder.orderStatus !== 'new' && (
                    (() => {
                      let confirmedUnits = 0;
                      let cancelledUnits = 0;
                      selectedOrder.items?.forEach(item => {
                        confirmedUnits += (item.confirmed_quantity ?? item.quantity);
                        cancelledUnits += (item.cancelled_quantity ?? 0);
                      });
                      return (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-150 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          {confirmedUnits} Confirmed • {cancelledUnits} Cancelled
                        </span>
                      );
                    })()
                  )}
                </div>
                
                <div className="space-y-2.5">
                  {selectedOrder.items?.map(item => {
                    const ordered = item.quantity;
                    const confirmed = item.confirmed_quantity ?? ordered;
                    const cancelled = item.cancelled_quantity ?? 0;
                    const status = item.item_status || (selectedOrder.orderStatus === 'cancelled' ? 'cancelled' : (selectedOrder.orderStatus === 'new' ? 'pending' : 'confirmed'));
                    const reason = item.cancellation_reason || '';
                    
                    let statusElement = null;
                    let quantityText = "";
                    let subtotalText = "";
                    let isItemCancelled = status === 'cancelled';
                    
                    if (selectedOrder.orderStatus === 'new' || status === 'pending') {
                      statusElement = (
                        <span className="inline-flex items-center text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase space-x-1 animate-pulse">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>Pending</span>
                        </span>
                      );
                      quantityText = `${ordered} units requested`;
                      subtotalText = `₹${(ordered * item.price).toLocaleString('en-IN')}`;
                    } else if (status === 'confirmed') {
                      statusElement = (
                        <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase space-x-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>✓ Confirmed</span>
                        </span>
                      );
                      quantityText = `${confirmed} units confirmed`;
                      subtotalText = `₹${(confirmed * item.price).toLocaleString('en-IN')}`;
                    } else if (status === 'cancelled') {
                      statusElement = (
                        <span className="inline-flex items-center text-rose-700 bg-rose-50 border border-rose-100 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase space-x-1">
                          <X className="w-2.5 h-2.5" />
                          <span>✕ Cancelled</span>
                        </span>
                      );
                      quantityText = `${ordered} units cancelled`;
                      subtotalText = "Cancelled";
                    } else if (status === 'partially_confirmed') {
                      statusElement = (
                        <span className="inline-flex items-center text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase space-x-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Partially Fulfilled</span>
                        </span>
                      );
                      quantityText = `Partially fulfilled: ${confirmed} of ${ordered} confirmed`;
                      subtotalText = `₹${(confirmed * item.price).toLocaleString('en-IN')}`;
                    }

                    return (
                      <div key={item.id} className="p-3 border border-slate-150 rounded-xl space-y-2 bg-slate-50/50">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-slate-800 truncate">{item.productName}</p>
                            <p className="text-[10px] text-slate-450 font-bold">{item.brand} • {item.packSize}</p>
                          </div>
                          {statusElement}
                        </div>
                        
                        <div className="flex justify-between items-center text-[10.5px] text-slate-550 font-semibold pt-2 border-t border-slate-100">
                          <div>
                            <span className="block text-slate-700 font-bold">{quantityText}</span>
                            <span className="text-[10px] text-slate-400">Price: ₹{item.price} / unit</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-black text-xs block ${isItemCancelled ? 'text-rose-500' : 'text-slate-800'}`}>
                              {subtotalText}
                            </span>
                            {isItemCancelled && (
                              <span className="text-slate-350 line-through text-xxs">Original: ₹{ordered * item.price}</span>
                            )}
                          </div>
                        </div>
                        
                        {cancelled > 0 && reason && (
                          <div className="text-[9.5px] text-rose-600 bg-rose-50/60 p-2.5 rounded-xl border border-rose-100/40 italic flex items-start space-x-1.5">
                            <span className="font-bold text-rose-700 uppercase tracking-wide text-[8px] mt-0.5">Cancellation Reason:</span>
                            <span>{reason}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wholesaler Payment Coordinates */}
              <div className="bg-white border border-slate-150 rounded-xl p-3.5 space-y-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Dealer Business Address</span>
                <p className="font-bold text-slate-800">{selectedOrder.shopName}</p>
                <p className="text-slate-500 text-[11px] leading-tight font-medium">{user.address}</p>
              </div>

              {/* Financial summary */}
              <div className="border-t border-slate-150 pt-3.5 space-y-2.5 font-medium text-slate-500">
                <div className="flex justify-between">
                  <span>Gross Subtotal</span>
                  <span className="text-slate-850 font-bold">₹{selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Method</span>
                  <span className="text-slate-850 font-bold">{selectedOrder.paymentMethod === 'pay_now' ? 'Pay Now (UPI QR)' : 'Pay Later'}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-extrabold text-slate-850 pt-2 border-t border-slate-100">
                  <span>Gross Total</span>
                  <span className="text-[#12873A] text-base font-black">₹{selectedOrder.total}</span>
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="p-4 border-t border-slate-150 grid grid-cols-3 gap-2.5 bg-slate-50">
              <button
                onClick={() => handleDownloadPDF(selectedOrder)}
                className="flex flex-col items-center justify-center p-2 bg-white border border-slate-205 hover:bg-slate-100 rounded-xl text-slate-655 font-bold text-[10px] transition cursor-pointer shadow-xxs"
              >
                <Download className="w-4 h-4 text-[#12873A] mb-1" />
                <span>PDF</span>
              </button>

              <button
                onClick={() => handleWhatsAppShare(selectedOrder)}
                className="flex flex-col items-center justify-center p-2 bg-white border border-slate-205 hover:bg-slate-100 rounded-xl text-slate-655 font-bold text-[10px] transition cursor-pointer shadow-xxs"
              >
                <Share2 className="w-4 h-4 text-emerald-650 text-emerald-600 mb-1" />
                <span>Share</span>
              </button>

              <button
                onClick={(e) => {
                  handleRepeatOrder(selectedOrder, e);
                  setSelectedOrder(null);
                }}
                className="flex flex-col items-center justify-center p-2 bg-[#12873A] hover:bg-[#16A34A] text-white rounded-xl font-bold text-[10px] transition cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4 text-white mb-1" />
                <span>Repeat</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CHALLAN PREVIEW MODAL / DRAWER */}
      {isPreviewModalOpen && previewChallan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end lg:justify-center lg:items-center p-0 lg:p-4 z-50 animate-fade-in no-print text-xs text-slate-700">
          <div className="bg-white rounded-t-3xl lg:rounded-2xl w-full max-w-4xl h-[90vh] lg:h-[95vh] flex flex-col shadow-2xl overflow-hidden border border-slate-205 animate-slide-up">
            
            {/* Header Toolbar */}
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#12873A]" />
                <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                  Challan Preview: {previewChallan.challanNumber}
                </span>
              </div>
              
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => downloadChallanPDF(previewChallan)}
                  className="px-3.5 py-2 bg-[#12873A] hover:bg-[#16A34A] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => handlePrintChallan(previewChallan)}
                  disabled={isPrinting}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-205 text-slate-750 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xxs disabled:opacity-50 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#12873A]" />
                  <span>{isPrinting ? 'Preparing...' : 'Print Challan'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    setPreviewChallan(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Preview Area */}
            <div className="flex-1 overflow-auto bg-slate-100 p-4 flex justify-start md:justify-center">
              <div className="min-w-fit pr-4 pb-4">
                <DeliveryChallanComponent challan={previewChallan} />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Print container portal rendered directly under document.body to ensure zero relative parent offset during printing */}
      {printChallanData && createPortal(
        <div id="delivery-challan-print">
          <DeliveryChallanComponent challan={printChallanData} />
        </div>,
        document.body
      )}

    </div>
  );
};
