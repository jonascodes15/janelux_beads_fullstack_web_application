import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Icons } from '../../components/common/Icons';
import { formatPrice } from '../../utils/api';
import api from '../../utils/api';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-indigo-500/20 text-indigo-400',
  shipped: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

function StatCard({ icon, label, value, sub, link }) {
  const Card = link ? Link : 'div';
  return (
    <Card to={link} className={`bg-obsidian-light border border-obsidian-border p-5 ${link ? 'hover:border-gold/30 transition-colors' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-gold/60">{icon}</div>
        {link && <Icons.ChevronRight size={14} className="text-cream/20" />}
      </div>
      <p className="font-display text-3xl text-cream tracking-wide">{value ?? '—'}</p>
      <p className="text-cream/40 text-[10px] tracking-widest uppercase mt-1">{label}</p>
      {sub && <p className="text-gold/60 text-xs mt-1">{sub}</p>}
    </Card>
  );
}

function MiniBarChart({ data }) {
  if (!data?.length) return <div className="h-32 flex items-center justify-center text-cream/20 text-xs">No data yet</div>;
  const max = Math.max(...data.map(d => d.revenue || 0)) || 1;

  return (
    <div className="flex items-end gap-1.5 h-28 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-gold/80 hover:bg-gold transition-colors rounded-sm"
            style={{ height: `${Math.max(4, (d.revenue / max) * 100)}%` }}
            title={`${d.date}: ${formatPrice(d.revenue)}`}
          />
          <span className="text-[8px] text-cream/20 truncate w-full text-center">
            {new Date(d.date).toLocaleDateString('en', { day: 'numeric' })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-28" />)}
      </div>
      <div className="shimmer h-64" />
    </div>
  );

  const { stats, revenue_chart, top_products, recent_orders } = data || {};

  return (
    <>
      <Helmet><title>Dashboard — Janelux Admin</title></Helmet>

      <div className="mb-8">
        <span className="section-label">Overview</span>
        <h1 className="font-display text-4xl text-cream tracking-wide">DASHBOARD</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Icons.TrendingUp size={20} />} label="Total Revenue" value={formatPrice(stats?.total_revenue || 0)} link="/admin/orders" />
        <StatCard icon={<Icons.Package size={20} />} label="Total Orders" value={stats?.total_orders || 0} sub={`${stats?.pending_orders || 0} pending`} link="/admin/orders" />
        <StatCard icon={<Icons.Users size={20} />} label="Customers" value={stats?.total_customers || 0} link="/admin/customers" />
        <StatCard icon={<Icons.Tag size={20} />} label="Products" value={stats?.total_products || 0} link="/admin/products" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<Icons.Mail size={20} />} label="Newsletter" value={stats?.newsletter_count || 0} sub="Active subscribers" link="/admin/newsletter" />
        <StatCard icon={<Icons.Star size={20} />} label="Pending Reviews" value={stats?.pending_reviews || 0} sub="Awaiting approval" link="/admin/reviews" />
        <StatCard icon={<Icons.AlertCircle size={20} />} label="Low Stock" value="—" sub="Check products" link="/admin/products" />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Revenue chart */}
        <div className="bg-obsidian-light border border-obsidian-border p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-lg text-cream tracking-widest">REVENUE (7 DAYS)</h3>
          </div>
          <MiniBarChart data={revenue_chart} />
        </div>

        {/* Top products */}
        <div className="bg-obsidian-light border border-obsidian-border p-5">
          <h3 className="font-display text-lg text-cream tracking-widest mb-4">TOP PRODUCTS</h3>
          {top_products?.length > 0 ? (
            <ul className="space-y-3">
              {top_products.map((p, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl text-gold/30">{i + 1}</span>
                    <div>
                      <p className="text-cream text-xs line-clamp-1">{p.name}</p>
                      <p className="text-cream/40 text-[10px]">{p.units_sold} units sold</p>
                    </div>
                  </div>
                  <span className="text-gold text-xs font-semibold">{formatPrice(p.revenue)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-cream/30 text-sm text-center py-6">No sales data yet</p>}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-obsidian-light border border-obsidian-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-obsidian-border">
          <h3 className="font-display text-lg text-cream tracking-widest">RECENT ORDERS</h3>
          <Link to="/admin/orders" className="text-gold/60 hover:text-gold text-[10px] tracking-widest uppercase transition-colors">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-obsidian-border">
                {['Order', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] tracking-widest uppercase text-cream/30 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent_orders?.length > 0 ? recent_orders.map(order => (
                <tr key={order.id} className="border-b border-obsidian-border hover:bg-obsidian transition-colors">
                  <td className="px-5 py-3 font-mono text-gold/80">{order.order_number}</td>
                  <td className="px-5 py-3 text-cream/70">{order.full_name || order.shipping_name || '—'}</td>
                  <td className="px-5 py-3 text-cream font-semibold">{formatPrice(order.total)}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_COLORS[order.status] || 'bg-cream/10 text-cream/50'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-cream/40">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-cream/20 text-sm">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
