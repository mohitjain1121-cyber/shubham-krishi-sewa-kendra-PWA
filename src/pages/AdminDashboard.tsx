import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { dbService } from '../services/db';
import type { Order, Product, UserProfile } from '../services/db';
import { ClipboardList, Database, Users, IndianRupee, Clock, ArrowRight, Eye } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { setView, selectOrder } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dealers, setDealers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const session = dbService.getCurrentSession();
    if (session) {
      setOrders(dbService.getOrders(session.id, session.role));
      setProducts(dbService.getProducts(true));
      setDealers(dbService.getDealers());
    }
  }, []);

  // Compute metrics dynamically from the simulated DB
  const totalProducts = products.filter(p => !p.archived).length;
  const totalDealers = dealers.length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.orderStatus === 'new' || o.orderStatus === 'confirmed' || o.orderStatus === 'partially_confirmed' || o.orderStatus === 'processing').length;
  
  const pendingPaymentsAmount = orders
    .filter(o => o.paymentStatus === 'pending' && o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const metrics = [
    { label: 'Total Products', value: totalProducts, icon: Database, color: 'text-green-700 bg-green-50 border-green-100', subtitle: 'Active catalog items' },
    { label: 'Total Dealers', value: totalDealers, icon: Users, color: 'text-blue-700 bg-blue-50 border-blue-100', subtitle: 'Registered partners' },
    { label: 'Total Orders', value: totalOrders, icon: ClipboardList, color: 'text-purple-700 bg-purple-50 border-purple-100', subtitle: 'Lifetime orders' },
    { label: 'Pending Orders', value: pendingOrders, icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-100', subtitle: 'Requires fulfillment' },
    { 
      label: 'Pending Payments', 
      value: `₹${pendingPaymentsAmount.toLocaleString('en-IN')}`, 
      icon: IndianRupee, 
      color: 'text-rose-700 bg-rose-50 border-rose-100', 
      subtitle: 'Outstanding balance' 
    },
  ];

  const handleOrderClick = (orderId: string) => {
    selectOrder(orderId);
    setView('admin_orders');
  };

  const getOrderStatusBadge = (status: Order['orderStatus']) => {
    const base = "px-2 py-0.5 text-[10px] font-bold rounded-full border text-center inline-block";
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

  const getPaymentStatusBadge = (status: Order['paymentStatus']) => {
    const base = "px-2 py-0.5 text-[10px] font-bold rounded border text-center inline-block";
    return status === 'paid'
      ? `${base} bg-green-50 text-green-700 border-green-100`
      : `${base} bg-amber-50 text-amber-700 border-amber-100`;
  };

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                  {m.label}
                </span>
                <div className={`p-2.5 rounded-xl border ${m.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-800 leading-tight block">
                  {m.value}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">
                  {m.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Recent Order Requests
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Most recent partner dealership orders awaiting fulfillment</p>
          </div>
          <button
            onClick={() => setView('admin_orders')}
            className="text-green-700 hover:text-green-800 text-xs font-bold flex items-center space-x-1 transition"
          >
            <span>Manage All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Responsive Table container */}
        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No orders registered in the system yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                  <th className="py-3 px-5">Order No.</th>
                  <th className="py-3 px-5">Dealer Shop</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Amount</th>
                  <th className="py-3 px-5">Payment Method</th>
                  <th className="py-3 px-5">Payment Status</th>
                  <th className="py-3 px-5">Order Status</th>
                  <th className="py-3 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 8).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-5 font-mono font-extrabold text-green-700">
                      {order.id}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-800">
                      {order.shopName}
                      <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                        Dealer: {order.dealerName}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {order.date}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      ₹{order.total.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-medium">
                      {order.paymentMethod === 'pay_now' ? 'UPI / Pay Now' : 'Pay Later (Credit)'}
                    </td>
                    <td className="py-3.5 px-5">
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </td>
                    <td className="py-3.5 px-5">
                      {getOrderStatusBadge(order.orderStatus)}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => handleOrderClick(order.id)}
                        className="text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 p-1.5 rounded-lg transition inline-flex items-center justify-center"
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
