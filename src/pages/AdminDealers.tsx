import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { UserProfile, Order } from '../services/db';
import { Search, X, User, Store, Smartphone, Mail, MapPin, Percent, Calendar, ClipboardList, Eye, ChevronRight } from 'lucide-react';

export const AdminDealers: React.FC = () => {
  const [dealers, setDealers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected dealer modal state
  const [selectedDealer, setSelectedDealer] = useState<UserProfile | null>(null);
  const [dealerOrders, setDealerOrders] = useState<Order[]>([]);

  const loadData = () => {
    const dList = dbService.getDealers();
    setDealers(dList);

    const session = dbService.getCurrentSession();
    if (session) {
      const oList = dbService.getOrders(session.id, session.role);
      setOrders(oList);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDealerDetails = (dealer: UserProfile) => {
    setSelectedDealer(dealer);
    // Filter orders specifically for this dealer
    const dOrders = orders.filter(o => o.dealerId === dealer.id);
    setDealerOrders(dOrders);
  };

  // Get dealer's total order count dynamically
  const getDealerOrderCount = (dealerId: string) => {
    return orders.filter(o => o.dealerId === dealerId).length;
  };

  const filteredDealers = dealers.filter(d => {
    const query = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(query) ||
      d.shopName.toLowerCase().includes(query) ||
      d.mobile.includes(query)
    );
  });

  const getOrderStatusBadge = (status: Order['orderStatus']) => {
    const base = "px-2 py-0.2 text-[9px] font-bold rounded-full border text-center inline-block";
    let cls = `${base} bg-slate-50 text-slate-700 border-slate-100`;
    let label = String(status);
    switch (status) {
      case 'new':
        cls = `${base} bg-blue-50 text-blue-700 border-blue-100`;
        label = "Pending";
        break;
      case 'confirmed':
        cls = `${base} bg-indigo-50 text-indigo-700 border-indigo-100`;
        label = "Confirmed";
        break;
      case 'partially_confirmed':
        cls = `${base} bg-amber-50 text-amber-700 border-amber-100`;
        label = "Partially Confirmed";
        break;
      case 'processing':
        cls = `${base} bg-sky-50 text-sky-750 border-sky-100`;
        label = "Processing";
        break;
      case 'dispatched':
        cls = `${base} bg-teal-50 text-teal-700 border-teal-100`;
        label = "Dispatched";
        break;
      case 'completed':
        cls = `${base} bg-green-50 text-green-700 border-green-100`;
        label = "Delivered";
        break;
      case 'cancelled':
        cls = `${base} bg-rose-50 text-rose-700 border-rose-100`;
        label = "Cancelled";
        break;
    }
    return <span className={cls}>{label.toUpperCase()}</span>;
  };

  return (
    <div className="space-y-6">
      
      {/* Action Header Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
            Dealer Directory
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">View and inspect registered pesticide dealer accounts and order histories</p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-650 font-bold px-3 py-1.5 rounded-xl border border-slate-200">
          {dealers.length} Dealers Registered
        </span>
      </div>

      {/* Search Bar Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by contact name, shop / business name, or mobile number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-850 text-xs shadow-inner"
          />
        </div>
      </div>

      {/* Dealers Data Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Desktop View (Table) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                <th className="py-3 px-5">Shop / Business Name</th>
                <th className="py-3 px-5">Dealer Contact</th>
                <th className="py-3 px-5">Mobile Number</th>
                <th className="py-3 px-5">Registration Date</th>
                <th className="py-3 px-5 text-center">Account Status</th>
                <th className="py-3 px-5 text-center">Total Orders</th>
                <th className="py-3 px-5 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDealers.map(dealer => (
                <tr key={dealer.id} className="hover:bg-slate-50/40 transition">
                  <td className="py-3.5 px-5 font-bold text-slate-800">
                    {dealer.shopName}
                    <span className="block font-mono text-[9px] font-bold text-slate-400 mt-0.5">{dealer.id}</span>
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-slate-700">{dealer.name}</td>
                  <td className="py-3.5 px-5 text-slate-650">{dealer.mobile}</td>
                  <td className="py-3.5 px-5 text-slate-500">{dealer.createdAt.split('T')[0]}</td>
                  <td className="py-3.5 px-5 text-center">
                    <span className="bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full text-[9px] font-bold">
                      ACTIVE
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-center font-bold text-slate-800">
                    {getDealerOrderCount(dealer.id)}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <button
                      onClick={() => openDealerDetails(dealer)}
                      className="text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 p-1.5 rounded-lg transition inline-flex items-center justify-center"
                      title="Inspect Dealer Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDealers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">No registered dealers found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="lg:hidden p-4 space-y-3.5 max-h-[calc(100vh-270px)] overflow-y-auto">
          {filteredDealers.map(dealer => (
            <div
              key={dealer.id}
              onClick={() => openDealerDetails(dealer)}
              className="bg-white rounded-xl p-4 shadow-xs border border-slate-100 hover:shadow-sm transition cursor-pointer flex justify-between items-center text-xs"
            >
              <div className="space-y-1 min-w-0 pr-2">
                <h4 className="font-bold text-slate-850 truncate">{dealer.shopName}</h4>
                <p className="text-slate-650">{dealer.name} ({dealer.mobile})</p>
                <p className="text-[10px] text-slate-450 truncate">Location: {dealer.address}</p>
                <div className="flex space-x-2 pt-1">
                  <span className="bg-green-50 text-green-750 text-[9px] font-bold px-1.5 py-0.2 rounded border border-green-100">ACTIVE</span>
                  <span className="text-[9px] font-semibold text-slate-500">{getDealerOrderCount(dealer.id)} Orders</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-350 flex-shrink-0" />
            </div>
          ))}
          {filteredDealers.length === 0 && (
            <p className="text-slate-450 text-center py-8">No registered dealers found.</p>
          )}
        </div>
      </div>

      {/* DEALER DETAIL MODAL POPUP */}
      {selectedDealer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Dealer Profile Sheet</h3>
                <span className="font-mono text-green-700 text-[10px] font-bold block mt-0.5">Dealer ID: {selectedDealer.id}</span>
              </div>
              <button
                onClick={() => setSelectedDealer(null)}
                className="p-1.5 rounded-full hover:bg-slate-150 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
              
              {/* Profile details grid */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-2 text-slate-700">
                  <Store className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Shop Name</span>
                    <span className="font-extrabold text-slate-800 text-xs">{selectedDealer.shopName}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-slate-700">
                  <User className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Contact Person</span>
                    <span className="font-semibold text-slate-800">{selectedDealer.name}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-slate-700">
                  <Smartphone className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Mobile Number</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedDealer.mobile}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-slate-700">
                  <Mail className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Email Address</span>
                    <span className="font-semibold text-slate-850 truncate block max-w-[200px]">{selectedDealer.email || 'None'}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-slate-700 sm:col-span-2">
                  <MapPin className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Delivery & Billing Address</span>
                    <span className="font-medium text-slate-800 leading-normal">{selectedDealer.address}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-slate-700">
                  <Percent className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">GSTIN details</span>
                    <span className="font-mono font-bold text-slate-800 uppercase">{selectedDealer.gstNumber || 'Not provided'}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-slate-700">
                  <Calendar className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Registration Date</span>
                    <span className="font-semibold text-slate-800">{selectedDealer.createdAt.split('T')[0]}</span>
                  </div>
                </div>
              </div>

              {/* Complete Order History of selected dealer */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 text-[9px] uppercase tracking-wider flex items-center">
                  <ClipboardList className="w-4 h-4 mr-1.5 text-green-700" />
                  <span>Chronological Order History ({dealerOrders.length} Orders)</span>
                </h4>
                
                <div className="border border-slate-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[8px] border-b border-slate-100">
                        <th className="py-2.5 px-4">Order ID</th>
                        <th className="py-2.5 px-4 text-center">Date</th>
                        <th className="py-2.5 px-4 text-center">Payment</th>
                        <th className="py-2.5 px-4 text-right">Invoice Total</th>
                        <th className="py-2.5 px-4 text-center">Fulfillment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dealerOrders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/20">
                          <td className="py-2.5 px-4 font-mono font-extrabold text-green-700">{order.id}</td>
                          <td className="py-2.5 px-4 text-center text-slate-500">{order.date}</td>
                          <td className="py-2.5 px-4 text-center text-slate-600">
                            {order.paymentMethod === 'pay_now' ? 'UPI' : 'Credit'}
                            <span className={`px-1 rounded ml-1 text-[8px] font-bold ${
                              order.paymentStatus === 'paid' ? 'text-green-700 bg-green-50' : 'text-amber-700 bg-amber-50'
                            }`}>{order.paymentStatus.toUpperCase()}</span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-800">₹{order.total.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-4 text-center">
                            {getOrderStatusBadge(order.orderStatus)}
                          </td>
                        </tr>
                      ))}
                      {dealerOrders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 italic">No orders registered for this dealer.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDealer(null)}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow text-xs cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
