import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Icons } from '../../components/common/Icons';
import { formatPrice } from '../../utils/api';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUSES = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  processing: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  refunded: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/admin/orders${params}`);
      setOrders(res.data.orders || []);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success(`Order marked as ${status}`);
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  return (
    <>
      <Helmet><title>Orders — Janelux Admin</title></Helmet>

      <div className="mb-8">
        <span className="section-label">Manage</span>
        <h1 className="font-display text-4xl text-cream tracking-wide">ORDERS</h1>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto mb-6 pb-1">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`whitespace-nowrap text-[10px] tracking-widest uppercase px-4 py-2 border transition-all flex-shrink-0 ${
              statusFilter === s ? 'bg-gold text-obsidian border-gold' : 'border-obsidian-border text-cream/50 hover:border-gold/40 hover:text-gold'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="shimmer h-20" />)
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-obsidian-light border border-obsidian-border">
            <Icons.Package size={48} className="text-cream/10 mx-auto mb-4" />
            <p className="text-cream/30 text-sm">No {statusFilter !== 'all' ? statusFilter : ''} orders found</p>
          </div>
        ) : orders.map(order => (
          <div key={order.id} className="bg-obsidian-light border border-obsidian-border overflow-hidden">
            {/* Order header */}
            <div
              className="flex flex-wrap items-center gap-3 px-5 py-4 cursor-pointer hover:bg-obsidian transition-colors"
              onClick={() => setExpanded(expanded === order.id ? null : order.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gold/80 text-xs">{order.order_number}</span>
                  <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 border ${STATUS_COLORS[order.status] || 'bg-cream/10 text-cream/50 border-cream/10'}`}>
                    {order.status}
                  </span>
                  {order.payment_status === 'paid' && (
                    <span className="text-[9px] text-green-400 tracking-widest">• Paid</span>
                  )}
                </div>
                <p className="text-cream/60 text-xs mt-0.5">{order.full_name || order.shipping_name} · {order.shipping_email}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-cream font-semibold text-sm">{formatPrice(order.total)}</p>
                <p className="text-cream/30 text-xs">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <Icons.ChevronDown size={16} className={`text-cream/30 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} />
            </div>

            {/* Expanded details */}
            {expanded === order.id && (
              <div className="border-t border-obsidian-border px-5 py-5 bg-obsidian">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Shipping */}
                  <div>
                    <h4 className="text-[10px] tracking-widest uppercase text-cream/30 mb-3">Shipping Address</h4>
                    <div className="text-cream/60 text-sm space-y-0.5">
                      <p className="text-cream font-medium">{order.shipping_name}</p>
                      <p>{order.shipping_address}</p>
                      <p>{order.shipping_city}, {order.shipping_state}</p>
                      <p>{order.shipping_country}</p>
                      <p className="text-gold/60 mt-1">{order.shipping_phone}</p>
                    </div>
                  </div>

                  {/* Update status */}
                  <div>
                    <h4 className="text-[10px] tracking-widest uppercase text-cream/30 mb-3">Update Status</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(order.id, s)}
                          disabled={order.status === s || updating === order.id}
                          className={`px-3 py-2 text-[10px] tracking-widest uppercase border transition-all disabled:opacity-40 ${
                            order.status === s
                              ? `${STATUS_COLORS[s]} border opacity-100`
                              : 'border-obsidian-border text-cream/50 hover:border-gold/40 hover:text-gold'
                          }`}
                        >
                          {updating === order.id ? '...' : s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Paystack ref */}
                {order.paystack_reference && (
                  <p className="text-cream/30 text-xs mt-4">Paystack ref: {order.paystack_reference}</p>
                )}

                {order.notes && <p className="text-cream/50 text-xs mt-2">Notes: {order.notes}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
