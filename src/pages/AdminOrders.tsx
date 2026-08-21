import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { dbService } from '../services/db';
import type { Order } from '../services/db';
import { Search, X, User, MapPin, CreditCard, ChevronRight, Phone, Mail, FileText, CheckCircle2, ClipboardList, Printer, Download, Eye, Truck, AlertCircle, Check, Clock, AlertTriangle } from 'lucide-react';
import { DeliveryChallanComponent, downloadChallanPDF } from '../components/DeliveryChallan';

export const AdminOrders: React.FC = () => {
  const { selectedOrderId, selectOrder, syncVersion } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status updates state
  const [orderStatus, setOrderStatus] = useState<Order['orderStatus']>('new');
  const [paymentStatus, setPaymentStatus] = useState<Order['paymentStatus']>('pending');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Status filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [challanFilter, setChallanFilter] = useState<'all' | 'generated' | 'not_generated'>('all');

  // Date filter state
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [customFromDate, setCustomFromDate] = useState<string>('');
  const [customToDate, setCustomToDate] = useState<string>('');
  const [appliedCustomRange, setAppliedCustomRange] = useState<{ from: string; to: string } | null>(null);

  // Dispatch Dialog State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // Transport details inputs
  const [transportThrough, setTransportThrough] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [dispatchLocation, setDispatchLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');

  // Charges inputs
  const [hamali, setHamali] = useState<string>('');
  const [bhada, setBhada] = useState<string>('');
  const [otherCharges, setOtherCharges] = useState<string>('');

  // Challan Preview Drawer State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewChallan, setPreviewChallan] = useState<any>(null);

  // Isolated printing state
  const [isPrinting, setIsPrinting] = useState(false);
  const [printChallanData, setPrintChallanData] = useState<any>(null);

  // New Confirmation states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingItems, setEditingItems] = useState<{
    [itemId: string]: {
      confirmedQuantity: number;
      cancellationReason: string;
      otherReasonText?: string;
    }
  }>({});

  // Initialize and synchronize edit states on order selection
  useEffect(() => {
    if (selectedOrder && selectedOrder.items) {
      const initial: typeof editingItems = {};
      selectedOrder.items.forEach(item => {
        const confirmed = item.confirmed_quantity !== undefined ? item.confirmed_quantity : item.quantity;
        const reason = item.cancellation_reason || 'Out of stock';
        const standardReasons = ['Out of stock', 'Insufficient stock', 'Product unavailable', 'Dealer requested cancellation'];
        const isOther = reason && !standardReasons.includes(reason);
        
        initial[item.id] = {
          confirmedQuantity: confirmed,
          cancellationReason: isOther ? 'Other' : reason,
          otherReasonText: isOther ? reason : ''
        };
      });
      setEditingItems(initial);
    } else {
      setEditingItems({});
    }
  }, [selectedOrder]);

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

  const handleReviewOrder = () => {
    if (!selectedOrder || !selectedOrder.items) return;
    
    // Validate
    let hasValidationError = false;
    selectedOrder.items.forEach(item => {
      const edit = editingItems[item.id];
      if (edit) {
        const cancelled = item.quantity - edit.confirmedQuantity;
        if (cancelled > 0) {
          if (!edit.cancellationReason || edit.cancellationReason.trim() === '') {
            hasValidationError = true;
          } else if (edit.cancellationReason === 'Other' && (!edit.otherReasonText || edit.otherReasonText.trim() === '')) {
            hasValidationError = true;
          }
        }
      }
    });

    if (hasValidationError) {
      alert("A cancellation reason is mandatory for any cancelled or partially confirmed items.");
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleFinalConfirmOrder = async () => {
    if (!selectedOrder || !selectedOrder.items) return;
    
    const itemsPayload = selectedOrder.items.map(item => {
      const edit = editingItems[item.id];
      const confirmed = edit ? edit.confirmedQuantity : item.quantity;
      const reason = edit ? (edit.cancellationReason === 'Other' ? (edit.otherReasonText || 'Other') : edit.cancellationReason) : '';
      return {
        itemId: item.id,
        confirmedQuantity: confirmed,
        cancellationReason: reason
      };
    });

    const res = await dbService.confirmOrderItems(selectedOrder.id, itemsPayload);
    if (res.success) {
      setIsConfirmModalOpen(false);
      setSuccessMsg("Order items processed and status finalized successfully!");
      const loaded = loadOrders();
      const updatedMatch = loaded.find((o: any) => o.id === selectedOrder.id);
      if (updatedMatch) {
        setSelectedOrder(updatedMatch);
        setOrderStatus(updatedMatch.orderStatus);
        setPaymentStatus(updatedMatch.paymentStatus);
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      alert(res.error || "Failed to confirm order.");
    }
  };

  const loadOrders = () => {
    const session = dbService.getCurrentSession();
    if (session) {
      const allOrders = dbService.getOrders(session.id, session.role);
      setOrders(allOrders);
      return allOrders;
    }
    return [];
  };

  // Sync selectedOrder from AppContext selectedOrderId
  useEffect(() => {
    const loaded = loadOrders();
    if (selectedOrderId) {
      const match = loaded.find((o: any) => o.id === selectedOrderId);
      if (match) {
        setSelectedOrder(match);
        setOrderStatus(match.orderStatus);
        setPaymentStatus(match.paymentStatus);
      }
    }
  }, [selectedOrderId, syncVersion]);

  // Clean up print state after native print dialog finishes/closes
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

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setOrderStatus(order.orderStatus);
    setPaymentStatus(order.paymentStatus);
    selectOrder(order.id);
    setSuccessMsg(null);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    selectOrder(null);
    setSuccessMsg(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    if (orderStatus === 'dispatched') {
      const existing = dbService.getDeliveryChallanByOrderId(selectedOrder.id);
      if (!existing) {
        // Reset transport details form
        setTransportThrough('');
        setVehicleNumber('');
        setDriverName('');
        setDispatchLocation('');
        setDeliveryLocation('');
        setHamali('');
        setBhada('');
        setOtherCharges('');
        setIsDispatchModalOpen(true);
        return;
      }
    }
    const res = await dbService.updateOrderStatus(selectedOrder.id, orderStatus, paymentStatus);
    if (res.success) {
      setSuccessMsg("Order status updated successfully.");
      const loaded = loadOrders();
      // Keep details panel open but refresh the order contents
      const updatedMatch = loaded.find((o: any) => o.id === selectedOrder.id);
      if (updatedMatch) {
        setSelectedOrder(updatedMatch);
      }
      setTimeout(() => setSuccessMsg(null), 2500);
    }
  };

  const handleConfirmDispatch = async () => {
    if (!selectedOrder) return;
    const challan = await dbService.createDeliveryChallan(
      selectedOrder.id,
      {
        transportThrough,
        vehicleNumber,
        driverName,
        dispatchLocation,
        deliveryLocation
      },
      {
        hamali: Number(hamali) || 0,
        bhada: Number(bhada) || 0,
        otherCharges: Number(otherCharges) || 0
      }
    );

    if (challan) {
      setSuccessMsg("Order status updated to Dispatched & Delivery Challan generated!");
      setIsDispatchModalOpen(false);
      const loaded = loadOrders();
      const updatedMatch = loaded.find((o: any) => o.id === selectedOrder.id);
      if (updatedMatch) {
        setSelectedOrder(updatedMatch);
        setOrderStatus(updatedMatch.orderStatus);
        setPaymentStatus(updatedMatch.paymentStatus);
      }
      setPreviewChallan(challan);
      setIsPreviewModalOpen(true);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // Filter orders by ID, shop name, dealer name, status, or challan number
  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase();
    const challan = dbService.getDeliveryChallanByOrderId(order.id);
    const challanNum = challan ? challan.challanNumber.toLowerCase() : '';

    const matchesSearch = 
      order.id.toLowerCase().includes(query) ||
      order.shopName.toLowerCase().includes(query) ||
      order.dealerName.toLowerCase().includes(query) ||
      challanNum.includes(query);
      
    const matchesStatus = 
      statusFilter === 'all' || order.orderStatus === statusFilter;

    const matchesChallanFilter =
      challanFilter === 'all' ||
      (challanFilter === 'generated' && !!challan) ||
      (challanFilter === 'not_generated' && !challan);

    let matchesDateFilter = true;
    if (dateFilter === 'today') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const orderTime = new Date(order.createdAt || order.date).getTime();
      matchesDateFilter = orderTime >= startOfToday.getTime() && orderTime <= endOfToday.getTime();
    } else if (dateFilter === 'yesterday') {
      const now = new Date();
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      const orderTime = new Date(order.createdAt || order.date).getTime();
      matchesDateFilter = orderTime >= startOfYesterday.getTime() && orderTime <= endOfYesterday.getTime();
    } else if (dateFilter === 'custom') {
      if (appliedCustomRange) {
        const orderTime = new Date(order.createdAt || order.date).getTime();
        const [fromY, fromM, fromD] = appliedCustomRange.from.split('-').map(Number);
        const startOfFrom = new Date(fromY, fromM - 1, fromD);
        const [toY, toM, toD] = appliedCustomRange.to.split('-').map(Number);
        const endOfTo = new Date(toY, toM - 1, toD, 23, 59, 59, 999);
        matchesDateFilter = orderTime >= startOfFrom.getTime() && orderTime <= endOfTo.getTime();
      } else {
        matchesDateFilter = true;
      }
    }
      
    return matchesSearch && matchesStatus && matchesChallanFilter && matchesDateFilter;
  });

  const getOrderStatusColor = (status: Order['orderStatus']) => {
    switch (status) {
      case 'new': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'confirmed': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'partially_confirmed': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'processing': return 'bg-sky-50 text-sky-750 border-sky-100';
      case 'dispatched': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'completed': return 'bg-green-50 text-green-700 border-green-100';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    return status === 'paid'
      ? 'bg-green-50 text-green-700 border-green-100'
      : 'bg-amber-50 text-amber-700 border-amber-100';
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6">
      
      {/* Left Column: Master Orders List */}
      <div className={`flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${
        selectedOrder ? 'hidden lg:flex' : 'flex'
      }`}>
        
        {/* Header and Filter Controls */}
        <div className="p-5 border-b border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Dealer Orders ({filteredOrders.length})
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Live Database
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ORD-ID, shop, dealer..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-800 text-xs shadow-inner"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none text-xs"
            >
              <option value="all">All Order Statuses</option>
              <option value="new">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="partially_confirmed">Partially Confirmed</option>
              <option value="processing">Processing</option>
              <option value="dispatched">Dispatched</option>
              <option value="completed">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Challan Filter */}
            <select
              value={challanFilter}
              onChange={(e) => setChallanFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none text-xs"
            >
              <option value="all">All Challan Statuses</option>
              <option value="generated">Challan Generated</option>
              <option value="not_generated">Challan Not Generated</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => {
                const val = e.target.value as any;
                setDateFilter(val);
                if (val !== 'custom') {
                  setAppliedCustomRange(null);
                }
              }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none text-xs"
            >
              <option value="all">All Order Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Conditional Custom Date Inputs / Active Filter Indicator */}
          {dateFilter !== 'all' && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs animate-slide-down">
              {dateFilter === 'custom' && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-semibold">From:</span>
                    <input
                      type="date"
                      value={customFromDate}
                      onChange={(e) => setCustomFromDate(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-semibold">To:</span>
                    <input
                      type="date"
                      value={customToDate}
                      onChange={(e) => setCustomToDate(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!customFromDate || !customToDate) {
                        alert('Please select both From and To dates.');
                        return;
                      }
                      setAppliedCustomRange({ from: customFromDate, to: customToDate });
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-3.5 py-1.5 rounded-xl transition text-xs shadow-sm cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              )}

              {/* Status text or Applied Date range details */}
              <div className="text-slate-600 font-medium text-xs flex-1">
                {dateFilter === 'today' && <span>Showing orders placed today</span>}
                {dateFilter === 'yesterday' && <span>Showing orders placed yesterday</span>}
                {dateFilter === 'custom' && appliedCustomRange && (
                  <span>Showing orders from {new Date(appliedCustomRange.from).toLocaleDateString('en-IN')} to {new Date(appliedCustomRange.to).toLocaleDateString('en-IN')}</span>
                )}
                {dateFilter === 'custom' && !appliedCustomRange && (
                  <span className="text-slate-400 italic">Please select dates and click Apply</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setDateFilter('all');
                  setCustomFromDate('');
                  setCustomToDate('');
                  setAppliedCustomRange(null);
                }}
                className="bg-white hover:bg-slate-100 text-slate-600 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition text-xs cursor-pointer shadow-xxs"
              >
                Clear Date Filter
              </button>
            </div>
          )}
        </div>

        {/* Master List items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-[calc(100vh-270px)]">
          {filteredOrders.map(order => {
            const isChosen = selectedOrder?.id === order.id;
            return (
              <div
                key={order.id}
                onClick={() => handleOrderSelect(order)}
                className={`p-4 hover:bg-slate-50/50 transition cursor-pointer flex justify-between items-start text-xs ${
                  isChosen ? 'bg-green-50/40 border-l-4 border-green-600 pl-3' : ''
                }`}
              >
                <div className="space-y-1.5 min-w-0 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-extrabold text-green-700 text-[12px]">{order.orderNumber || order.id}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${getOrderStatusColor(order.orderStatus)}`}>
                      {getStatusText(order.orderStatus).toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 truncate">{order.shopName}</h4>
                  <p className="text-[10px] text-slate-400">Dealer: {order.dealerName} | Date: {order.date}</p>
                </div>
                <div className="text-right flex flex-col items-end space-y-1">
                  <span className="font-extrabold text-slate-800 text-sm">₹{order.total.toLocaleString('en-IN')}</span>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 lg:hidden" />
                </div>
              </div>
            );
          })}
          {filteredOrders.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No matching orders found.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Order Details Pane */}
      <div className={`flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${
        selectedOrder ? 'flex' : 'hidden lg:flex lg:opacity-50'
      }`}>
        {selectedOrder ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Details Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                  <span>Order Invoice Detail</span>
                  <span className="font-mono text-green-700 font-extrabold text-base">{selectedOrder.orderNumber || selectedOrder.id}</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ml-2 ${getOrderStatusColor(selectedOrder.orderStatus)}`}>
                    {getStatusText(selectedOrder.orderStatus).toUpperCase()}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Submitted date: {selectedOrder.date}</p>
              </div>
              <button
                onClick={handleCloseDetails}
                className="p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scrollable details view */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
              {successMsg && (
                <div className="bg-green-50 text-green-700 border border-green-100 rounded-xl p-3 flex items-center space-x-1.5 font-bold animate-slide-in">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Status Update Form Controls */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-4">
                <h4 className="font-extrabold text-slate-700 text-[10px] uppercase tracking-wider flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-green-600" />
                  <span>Fulfillment Operations</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Order Status Select */}
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">Fulfillment Status</label>
                    {selectedOrder.orderStatus === 'new' ? (
                      <div className="bg-amber-50 text-amber-700 border border-amber-100 rounded-xl p-3 flex flex-col space-y-1">
                        <span className="font-bold flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Pending Confirmation</span>
                        <span className="text-[10px] font-medium leading-tight">Specify the confirmed quantities for each product in the breakdown below and click "Review & Confirm Order" to finalize.</span>
                      </div>
                    ) : (
                      <select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value as Order['orderStatus'])}
                        disabled={selectedOrder.orderStatus === 'cancelled'}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {selectedOrder.orderStatus === 'confirmed' && <option value="confirmed">Confirmed</option>}
                        {selectedOrder.orderStatus === 'partially_confirmed' && <option value="partially_confirmed">Partially Confirmed</option>}
                        <option value="processing">Processing / Packing</option>
                        <option value="dispatched" disabled={selectedOrder.items?.reduce((sum, item) => sum + (item.confirmed_quantity ?? 0), 0) === 0}>
                          Dispatched (Challan Generated)
                        </option>
                        <option value="completed">Completed / Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </div>

                  {/* Payment Status Select */}
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">Payment Collection</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as Order['paymentStatus'])}
                      disabled={selectedOrder.orderStatus === 'cancelled'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="pending">Pending Payment</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100/50">
                  {/* Mark as Dispatched Shortcut button */}
                  {((selectedOrder.orderStatus === 'confirmed' || selectedOrder.orderStatus === 'partially_confirmed' || selectedOrder.orderStatus === 'processing') && 
                    selectedOrder.items && selectedOrder.items.reduce((sum, item) => sum + (item.confirmed_quantity ?? 0), 0) > 0) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOrderStatus('dispatched');
                        // Reset form
                        setTransportThrough('');
                        setVehicleNumber('');
                        setDriverName('');
                        setDispatchLocation('');
                        setDeliveryLocation('');
                        setHamali('');
                        setBhada('');
                        setOtherCharges('');
                        setIsDispatchModalOpen(true);
                      }}
                      className="bg-green-700 hover:bg-green-800 text-white font-extrabold px-3 py-2 rounded-lg flex items-center space-x-1 transition text-[10px] uppercase tracking-wider shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Mark as Dispatched</span>
                    </button>
                  ) : <div />}

                  {selectedOrder.orderStatus !== 'new' && (
                    <button
                      onClick={handleUpdateStatus}
                      disabled={selectedOrder.orderStatus === 'cancelled'}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg transition shadow-sm text-xs disabled:opacity-50"
                    >
                      Save Status Changes
                    </button>
                  )}
                </div>
              </div>

              {/* Delivery Challan Integration Card */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3.5">
                <h4 className="font-extrabold text-slate-750 text-[10px] uppercase tracking-wider flex items-center pb-2 border-b border-slate-150">
                  <FileText className="w-4 h-4 mr-1.5 text-green-700" />
                  <span>Delivery Challan</span>
                </h4>
                
                {selectedOrder.orderStatus === 'dispatched' || selectedOrder.orderStatus === 'completed' ? (
                  (() => {
                    const challan = dbService.getDeliveryChallanByOrderId(selectedOrder.id);
                    if (challan) {
                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10.5px]">
                            <span className="text-slate-500 font-bold">Challan Number:</span>
                            <span className="font-mono text-green-700 font-black text-xs">{challan.challanNumber}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10.5px]">
                            <span className="text-slate-500 font-bold">Dispatch Date:</span>
                            <span className="text-slate-700 font-semibold">{new Date(challan.dispatchDate).toLocaleString('en-IN')}</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 pt-1.5">
                            <button
                              onClick={() => {
                                setPreviewChallan(challan);
                                setIsPreviewModalOpen(true);
                              }}
                              className="px-2 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold flex flex-col items-center justify-center text-[9.5px] transition shadow-xs"
                            >
                              <Eye className="w-4 h-4 text-green-600 mb-1" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => downloadChallanPDF(challan)}
                              className="px-2 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold flex flex-col items-center justify-center text-[9.5px] transition shadow-xs"
                            >
                              <Download className="w-4 h-4 text-green-600 mb-1" />
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => handlePrintChallan(challan)}
                              disabled={isPrinting}
                              className="px-2 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold flex flex-col items-center justify-center text-[9.5px] transition shadow-xs disabled:opacity-50"
                            >
                              <Printer className="w-4 h-4 text-green-600 mb-1" />
                              <span>{isPrinting ? 'Preparing...' : 'Print'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-[10px] text-slate-500 italic py-1 flex items-center justify-between">
                          <span>Challan generation pending...</span>
                          <button
                            onClick={() => {
                              setOrderStatus('dispatched');
                              setTransportThrough('');
                              setVehicleNumber('');
                              setDriverName('');
                              setDispatchLocation('');
                              setDeliveryLocation('');
                              setHamali('');
                              setBhada('');
                              setOtherCharges('');
                              setIsDispatchModalOpen(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider transition"
                          >
                            Generate
                          </button>
                        </div>
                      );
                    }
                  })()
                ) : (
                  <div className="text-[10px] text-slate-400 italic py-2 flex items-center space-x-1.5">
                    <span>Delivery Challan</span>
                    <span className="font-bold text-slate-450">&bull; Available after dispatch</span>
                  </div>
                )}
              </div>

              {/* Dealer info card */}
              <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-extrabold text-slate-400 text-[9px] uppercase tracking-wider mb-2 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <span>Dealer Profile</span>
                  </h4>
                  <div className="space-y-1 text-slate-600 font-medium">
                    <p className="font-extrabold text-slate-800 text-xs">{selectedOrder.shopName}</p>
                    <p>Contact: {selectedOrder.dealerName}</p>
                    <p className="font-mono text-[10px]">Dealer ID: {selectedOrder.dealerId}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-400 text-[9px] uppercase tracking-wider mb-2 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <span>Contact & Location</span>
                  </h4>
                  <div className="space-y-1 text-slate-600 font-medium">
                    <p className="flex items-center"><Phone className="w-3 h-3 mr-1 text-slate-400" /> {selectedOrder.dealerId === 'dealer-1' ? '9876543211' : (selectedOrder.dealerId === 'dealer-2' ? '9876543212' : 'Partner Mobile')}</p>
                    <p className="flex items-center"><Mail className="w-3 h-3 mr-1 text-slate-400" /> {selectedOrder.dealerId === 'dealer-1' ? 'vijay@kisanagro.com' : (selectedOrder.dealerId === 'dealer-2' ? 'rajesh@patelstore.com' : 'Direct Email')}</p>
                    <p className="leading-tight text-[11px] mt-1">{selectedOrder.dealerId === 'dealer-1' ? 'Main Bazaar, Opp. Grain Market, Karnal, Haryana' : (selectedOrder.dealerId === 'dealer-2' ? 'Station Road, Anand, Gujarat' : 'Shop delivery address')}</p>
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800 text-[9px] uppercase tracking-wider border-b border-slate-100 pb-1">
                  Ordered Products Breakdown
                </h4>
                
                {selectedOrder.orderStatus === 'new' ? (
                  /* EDITABLE MODE: Processing and confirmations */
                  <div className="space-y-3.5">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map(item => {
                        const edit = editingItems[item.id];
                        const confirmed = edit ? edit.confirmedQuantity : item.quantity;
                        const cancelled = item.quantity - confirmed;
                        const reason = edit ? edit.cancellationReason : 'Out of stock';
                        const otherText = edit ? edit.otherReasonText : '';
                        
                        let itemStatusLabel = "Confirmed";
                        let itemStatusColor = "text-green-700 bg-green-50 border-green-100";
                        if (confirmed === 0) {
                          itemStatusLabel = "Cancelled";
                          itemStatusColor = "text-rose-700 bg-rose-50 border-rose-100";
                        } else if (confirmed < item.quantity) {
                          itemStatusLabel = "Partially Confirmed";
                          itemStatusColor = "text-amber-700 bg-amber-50 border-amber-100";
                        }
                        
                        return (
                          <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-xs">
                            <div className="flex justify-between items-start">
                              <div className="min-w-0 pr-2">
                                <h5 className="font-extrabold text-slate-800 text-xs truncate">{item.productName}</h5>
                                <span className="text-[9.5px] font-semibold text-slate-400">{item.brand} &bull; {item.packSize}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full border text-[8.5px] font-black uppercase ${itemStatusColor}`}>
                                {itemStatusLabel}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px]">
                              <div>
                                <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Ordered</span>
                                <span className="font-extrabold text-slate-800 text-xs">{item.quantity}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Confirmed</span>
                                <div className="flex items-center justify-center space-x-1 mt-0.5">
                                  <input
                                    type="number"
                                    min={0}
                                    max={item.quantity}
                                    value={confirmed}
                                    onChange={(e) => {
                                      const val = Math.max(0, Math.min(item.quantity, Number(e.target.value) || 0));
                                      setEditingItems(prev => ({
                                        ...prev,
                                        [item.id]: {
                                          ...prev[item.id],
                                          confirmedQuantity: val
                                        }
                                      }));
                                    }}
                                    className="w-14 px-1 py-0.5 text-center border border-slate-355 rounded font-black text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Cancelled</span>
                                <span className={`font-black text-xs ${cancelled > 0 ? 'text-rose-600' : 'text-slate-500'}`}>{cancelled}</span>
                              </div>
                            </div>
                            
                            {/* Cancellation Reason Dropdown */}
                            {cancelled > 0 && (
                              <div className="bg-rose-50/20 border border-rose-100/55 p-2.5 rounded-lg space-y-1.5 animate-slide-down">
                                <label className="block text-[8.5px] font-extrabold text-rose-700 uppercase tracking-wider">
                                  Cancellation Reason *
                                </label>
                                <select
                                  value={reason}
                                  onChange={(e) => {
                                    const r = e.target.value;
                                    setEditingItems(prev => ({
                                      ...prev,
                                      [item.id]: {
                                        ...prev[item.id],
                                        cancellationReason: r
                                      }
                                    }));
                                  }}
                                  className="w-full px-2 py-1 text-xxs border border-slate-200 rounded bg-white font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                                >
                                  <option value="Out of stock">Out of stock</option>
                                  <option value="Insufficient stock">Insufficient stock</option>
                                  <option value="Product unavailable">Product unavailable</option>
                                  <option value="Dealer requested cancellation">Dealer requested cancellation</option>
                                  <option value="Other">Other</option>
                                </select>
                                
                                {reason === 'Other' && (
                                  <input
                                    type="text"
                                    placeholder="Enter custom cancellation reason..."
                                    value={otherText}
                                    onChange={(e) => {
                                      const txt = e.target.value;
                                      setEditingItems(prev => ({
                                        ...prev,
                                        [item.id]: {
                                          ...prev[item.id],
                                          otherReasonText: txt
                                        }
                                      }));
                                    }}
                                    className="w-full px-2 py-1 text-xxs border border-slate-200 rounded mt-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                                  />
                                )}
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-100 text-slate-500 font-semibold">
                              <span>Price: ₹{item.price} / unit</span>
                              <span className="font-bold text-slate-800">
                                Line Total: ₹{(confirmed * item.price).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-6 text-center text-slate-400 italic">No items listed.</div>
                    )}
                    
                    {/* Live Totals & Action Button */}
                    {(() => {
                      const computedSubtotal = selectedOrder.items?.reduce((sum, item) => {
                        const edit = editingItems[item.id];
                        const confirmed = edit ? edit.confirmedQuantity : item.quantity;
                        return sum + (item.price * confirmed);
                      }, 0) ?? 0;
                      
                      return (
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex flex-col items-end space-y-1 pr-2 text-xs font-semibold">
                            <div className="flex justify-between w-48 text-slate-500">
                              <span>Live Subtotal:</span>
                              <span>₹{computedSubtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between w-48 border-t border-slate-100 pt-1.5 font-bold text-slate-800">
                              <span>Invoice Confirmed Total:</span>
                              <span className="text-green-700 text-sm">₹{computedSubtotal.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                          <div className="flex justify-end pr-2 pt-1">
                            <button
                              type="button"
                              onClick={handleReviewOrder}
                              className="bg-green-700 hover:bg-green-800 text-white font-extrabold px-4 py-2 rounded-xl text-xxs uppercase tracking-wider shadow transition flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Review & Confirm Order</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* READ-ONLY MODE: Already processed order details */
                  <div className="space-y-2">
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold text-[9px] uppercase border-b border-slate-100">
                            <th className="py-2.5 px-4">Product Name</th>
                            <th className="py-2.5 px-4 text-center">Pack Size</th>
                            <th className="py-2.5 px-4 text-center">Qty (Ord/Conf/Canc)</th>
                            <th className="py-2.5 px-4 text-right">Unit Price</th>
                            <th className="py-2.5 px-4 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {selectedOrder.items && selectedOrder.items.length > 0 ? (
                            selectedOrder.items.map(item => {
                              const ordered = item.quantity;
                              const confirmed = item.confirmed_quantity ?? ordered;
                              const cancelled = item.cancelled_quantity ?? 0;
                              const status = item.item_status || 'confirmed';
                              const reason = item.cancellation_reason || '';
                              
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/20">
                                  <td className="py-2.5 px-4 font-semibold text-slate-800">
                                    {item.productName}
                                    <span className="block text-[9.5px] font-normal text-slate-400">
                                      {item.brand}
                                      {cancelled > 0 && reason && (
                                        <span className="block text-[9px] text-rose-650 font-semibold mt-0.5 bg-rose-50/50 p-1 rounded border border-rose-100/50 italic inline-block">
                                          Reason: {reason}
                                        </span>
                                      )}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-center text-slate-600 font-medium">
                                    {item.packSize}
                                  </td>
                                  <td className="py-2.5 px-4 text-center font-bold text-slate-800">
                                    <span className="text-slate-400">{ordered}</span>
                                    <span className="mx-1 text-slate-350">/</span>
                                    <span className="text-emerald-700 font-black">{confirmed}</span>
                                    <span className="mx-1 text-slate-350">/</span>
                                    <span className={cancelled > 0 ? 'text-rose-650' : 'text-slate-400'}>{cancelled}</span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right text-slate-600 font-medium">
                                    ₹{item.price.toLocaleString('en-IN')}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                                    {status === 'cancelled' ? (
                                      <span className="text-slate-350 line-through">₹{(ordered * item.price).toLocaleString('en-IN')}</span>
                                    ) : (
                                      <span>₹{(confirmed * item.price).toLocaleString('en-IN')}</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-slate-400 italic">No item list details loaded.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals Summary */}
                    <div className="pt-3 flex flex-col items-end space-y-1.5 pr-4 text-xs font-semibold">
                      <div className="flex justify-between w-48 text-slate-500">
                        <span>Subtotal:</span>
                        <span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between w-48 border-t border-slate-100 pt-1.5 font-bold text-slate-800">
                        <span>Invoice Confirmed Total:</span>
                        <span className="text-green-700 text-sm">₹{selectedOrder.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment parameters panel */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center space-x-3.5">
                <CreditCard className="w-5 h-5 text-green-700" />
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Dealer Payment Method</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrder.paymentMethod === 'pay_now' ? 'UPI / Direct Scan payment' : 'Credit terms (Payment due on delivery)'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-400 p-8 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">No Order Selected</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mt-1.5 leading-relaxed">
              Select an order request from the list on the left to review details, update packing status, or update payment information.
            </p>
          </div>
        )}
      </div>

      {/* ITEM CONFIRMATION SUMMARY MODAL */}
      {isConfirmModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-slide-up text-xs text-slate-700">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center uppercase tracking-wider">
                <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                <span>Confirm Order Summary</span>
              </h3>
              <button 
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="font-semibold text-slate-650 leading-tight">Please review the processed quantities and statuses before final confirmation:</p>
              <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {selectedOrder.items?.map(item => {
                  const edit = editingItems[item.id];
                  const confirmed = edit ? edit.confirmedQuantity : item.quantity;
                  const cancelled = item.quantity - confirmed;
                  const reason = edit ? edit.cancellationReason : '';
                  const finalReason = edit?.cancellationReason === 'Other' ? (edit.otherReasonText || 'Other') : reason;
                  
                  return (
                    <div key={item.id} className="p-3 bg-slate-50/50 space-y-1">
                      <p className="font-bold text-slate-800">{item.productName}</p>
                      <div className="flex justify-between text-slate-500 text-[10.5px]">
                        <span>Ordered: {item.quantity} units</span>
                        {cancelled === 0 ? (
                          <span className="text-green-700 font-extrabold flex items-center"><Check className="w-3 h-3 mr-0.5" /> Fully Confirmed ({confirmed})</span>
                        ) : confirmed === 0 ? (
                          <span className="text-rose-600 font-extrabold flex items-center"><X className="w-3 h-3 mr-0.5" /> Cancelled ({cancelled})</span>
                        ) : (
                          <span className="text-amber-600 font-extrabold flex items-center"><AlertCircle className="w-3 h-3 mr-0.5" /> Partial ({confirmed} / {cancelled})</span>
                        )}
                      </div>
                      {cancelled > 0 && (
                        <p className="text-[9.5px] text-rose-600 bg-rose-50/55 p-1 rounded border border-rose-100/40 italic inline-block mt-0.5">Reason: {finalReason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Summary Stats */}
              {(() => {
                let totalConfirmedUnits = 0;
                let totalCancelledUnits = 0;
                selectedOrder.items?.forEach(item => {
                  const edit = editingItems[item.id];
                  const confirmed = edit ? edit.confirmedQuantity : item.quantity;
                  totalConfirmedUnits += confirmed;
                  totalCancelledUnits += (item.quantity - confirmed);
                });
                
                const allConfirmed = totalCancelledUnits === 0;
                const allCancelled = totalConfirmedUnits === 0;
                const finalStatusLabel = allConfirmed ? 'Confirmed' : (allCancelled ? 'Cancelled' : 'Partially Confirmed');
                const finalStatusColor = allConfirmed ? 'text-indigo-700' : (allCancelled ? 'text-rose-700' : 'text-amber-700');
                
                return (
                  <div className="bg-slate-100/60 p-3 rounded-xl border border-slate-150 space-y-1.5 font-semibold text-slate-650">
                    <div className="flex justify-between">
                      <span>Confirmed Units:</span>
                      <span className="text-slate-800">{totalConfirmedUnits} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cancelled Units:</span>
                      <span className="text-slate-800">{totalCancelledUnits} units</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/60 pt-1.5 font-bold">
                      <span>Overall Order Status:</span>
                      <span className={finalStatusColor}>{finalStatusLabel}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalConfirmOrder}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold shadow-sm transition"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH CONFIRMATION & TRANSPORT DETAILS MODAL */}
      {isDispatchModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-slide-up text-xs text-slate-700">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center uppercase tracking-wider">
                <Truck className="w-5 h-5 text-green-700 mr-2" />
                <span>Order Dispatch & Challan Setup</span>
              </h3>
              <button 
                onClick={() => {
                  setIsDispatchModalOpen(false);
                  setOrderStatus(selectedOrder.orderStatus); // revert
                }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
              Update the order status to "Dispatched" and automatically generate a sequential Delivery Challan document. Fill out any optional details below.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleConfirmDispatch(); }} className="space-y-4">
              
              {/* Transport Fields Section */}
              <div className="space-y-2.5">
                <h4 className="font-extrabold uppercase text-[9px] text-slate-450 tracking-wider">
                  Transport Information (Optional)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1 text-[8.5px] uppercase tracking-wider">Transport / Through</label>
                    <input 
                      type="text"
                      placeholder="e.g. VRL Logistics"
                      value={transportThrough}
                      onChange={(e) => setTransportThrough(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1 text-[8.5px] uppercase tracking-wider">Vehicle Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. HR-65-A-1234"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1 text-[8.5px] uppercase tracking-wider">Driver Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Ram Kumar"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-850 focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1 text-[8.5px] uppercase tracking-wider">From Location</label>
                      <input 
                        type="text"
                        placeholder="Karnal"
                        value={dispatchLocation}
                        onChange={(e) => setDispatchLocation(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1 text-[8.5px] uppercase tracking-wider">To Location</label>
                      <input 
                        type="text"
                        placeholder="Dealer Shop"
                        value={deliveryLocation}
                        onChange={(e) => setDeliveryLocation(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charges Section */}
              <div className="space-y-2.5 pt-2 border-t border-slate-50">
                <h4 className="font-extrabold uppercase text-[9px] text-slate-455 tracking-wider">
                  Additional Charges (Optional)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1 text-[8.5px] uppercase tracking-wider">Hamali (₹)</label>
                    <input 
                      type="number"
                      placeholder="0"
                      min="0"
                      value={hamali}
                      onChange={(e) => setHamali(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1 text-[8.5px] uppercase tracking-wider">Bhada / Freight (₹)</label>
                    <input 
                      type="number"
                      placeholder="0"
                      min="0"
                      value={bhada}
                      onChange={(e) => setBhada(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1 text-[8.5px] uppercase tracking-wider">Other (₹)</label>
                    <input 
                      type="number"
                      placeholder="0"
                      min="0"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsDispatchModalOpen(false);
                    setOrderStatus(selectedOrder.orderStatus); // Revert Status
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-bold transition shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-extrabold rounded-xl transition shadow-md uppercase tracking-wider"
                >
                  Mark Dispatched & Generate Challan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CHALLAN PREVIEW MODAL / DRAWER */}
      {isPreviewModalOpen && previewChallan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end lg:justify-center lg:items-center p-0 lg:p-4 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-t-3xl lg:rounded-2xl w-full max-w-4xl h-[90vh] lg:h-[95vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-slide-up">
            
            {/* Header Toolbar */}
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-700" />
                <span className="font-extrabold text-slate-855 text-xs uppercase tracking-wider">
                  Challan Preview: {previewChallan.challanNumber}
                </span>
              </div>
              
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => downloadChallanPDF(previewChallan)}
                  className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => handlePrintChallan(previewChallan)}
                  disabled={isPrinting}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                >
                  <Printer className="w-4 h-4 text-green-600" />
                  <span>{isPrinting ? 'Preparing...' : 'Print Challan'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    setPreviewChallan(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500"
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
