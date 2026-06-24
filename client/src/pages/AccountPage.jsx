import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Icons } from '../components/common/Icons';
import { useAuth } from '../context/AuthContext';
import { formatPrice, getImageUrl } from '../utils/api';
import api from '../utils/api';
import toast from 'react-hot-toast';

export function AccountPage() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');
  const [profile, setProfile] = useState({ full_name: user?.full_name || '', phone: '' });

  // Admins should never land here — redirect straight to admin panel
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  useEffect(() => {
    api.get('/orders/my').then(res => setOrders(res.data.orders || [])).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', profile);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update'); }
  };

  const statusColor = { pending: 'text-yellow-500', confirmed: 'text-blue-400', processing: 'text-blue-400', shipped: 'text-purple-400', delivered: 'text-green-400', cancelled: 'text-red-400' };

  return (
    <>
      <Helmet><title>My Account — Janelux Beads</title></Helmet>
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="section-label">Account</span>
            <h1 className="font-display text-4xl text-cream tracking-wide">WELCOME, {user?.full_name?.split(' ')[0]?.toUpperCase()}</h1>
          </div>
          <button onClick={logout} className="btn-ghost flex items-center gap-2 text-xs">
            <Icons.LogOut size={14} /> Sign Out
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-1">
            {[
              { id: 'orders', label: 'My Orders', icon: <Icons.Package size={16} /> },
              { id: 'profile', label: 'Profile', icon: <Icons.User size={16} /> },
              { id: 'wishlist', label: 'Wishlist', icon: <Icons.Heart size={16} /> },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-xs tracking-widest uppercase text-left transition-all border ${tab === t.id ? 'border-gold text-gold bg-gold/5' : 'border-transparent text-cream/50 hover:text-cream/80 hover:border-obsidian-border'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {tab === 'orders' && (
              loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="shimmer h-24" />)}</div> :
                orders.length === 0 ? (
                  <div className="text-center py-16">
                    <Icons.Package size={48} className="text-cream/10 mx-auto mb-4" />
                    <p className="text-cream/30 text-sm">No orders yet</p>
                    <Link to="/shop" className="btn-outline mt-4 inline-block">Shop Now</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="bg-obsidian-light border border-obsidian-border p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-sans text-sm text-cream font-semibold">#{order.order_number}</p>
                            <p className="text-cream/40 text-xs">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs uppercase tracking-widest ${statusColor[order.status] || 'text-cream/50'}`}>{order.status}</span>
                            <p className="text-cream font-semibold text-sm mt-0.5">{formatPrice(order.total)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                          {order.items?.slice(0, 4).map(item => (
                            <div key={item.id} className="w-12 h-12 shrink-0 bg-obsidian overflow-hidden">
                              {item.product_image && <img src={getImageUrl(item.product_image)} alt={item.product_name} className="w-full h-full object-cover" />}
                            </div>
                          ))}
                          {order.items?.length > 4 && <div className="w-12 h-12 shrink-0 bg-obsidian flex items-center justify-center text-cream/30 text-xs">+{order.items.length - 4}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
            )}

            {tab === 'profile' && (
              <form onSubmit={saveProfile} className="max-w-sm space-y-4">
                <h3 className="font-display text-xl text-cream tracking-wide mb-4">PROFILE DETAILS</h3>
                <div>
                  <label className="section-label text-[10px]">Full Name</label>
                  <input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} className="input-dark" />
                </div>
                <div>
                  <label className="section-label text-[10px]">Email</label>
                  <input value={user?.email} disabled className="input-dark opacity-50 cursor-not-allowed" />
                </div>
                <div>
                  <label className="section-label text-[10px]">Phone</label>
                  <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="input-dark" placeholder="080XXXXXXXX" />
                </div>
                <button type="submit" className="btn-gold">Save Changes</button>
              </form>
            )}

            {tab === 'wishlist' && <WishlistTab />}
          </div>
        </div>
      </div>
    </>
  );
}

function WishlistTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/wishlist').then(res => setItems(res.data.items || [])).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const remove = async (productId) => {
    await api.delete(`/wishlist/${productId}`);
    setItems(prev => prev.filter(i => i.product_id !== productId));
    toast.success('Removed from wishlist');
  };

  if (loading) return <div className="shimmer h-64" />;
  if (!items.length) return (
    <div className="text-center py-16">
      <Icons.Heart size={48} className="text-cream/10 mx-auto mb-4" />
      <p className="text-cream/30 text-sm">Your wishlist is empty</p>
      <Link to="/shop" className="btn-outline mt-4 inline-block">Browse Products</Link>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(item => (
        <div key={item.id} className="bg-obsidian-light border border-obsidian-border">
          <Link to={`/product/${item.slug}`} className="block aspect-square bg-obsidian overflow-hidden">
            <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          </Link>
          <div className="p-3">
            <Link to={`/product/${item.slug}`} className="text-cream text-xs hover:text-gold transition-colors line-clamp-1">{item.name}</Link>
            <p className="text-gold text-sm font-semibold mt-1">{formatPrice(item.price)}</p>
            <button onClick={() => remove(item.product_id)} className="text-cream/30 hover:text-terracotta text-[10px] tracking-widest uppercase mt-2 flex items-center gap-1 transition-colors">
              <Icons.Trash size={10} /> Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function WishlistPage() {
  return (
    <>
      <Helmet><title>Wishlist — Janelux Beads</title></Helmet>
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <span className="section-label">Saved Items</span>
        <h1 className="font-display text-5xl text-cream tracking-wide mb-10">MY WISHLIST</h1>
        <WishlistTab />
      </div>
    </>
  );
}

export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Us — Janelux Beads</title>
        <meta name="description" content="The story of Janelux Beads — handcrafted luxury bead accessories celebrating African heritage." />
      </Helmet>
      <div className="max-w-screen-xl mx-auto px-4 py-16">
        <div className="max-w-3xl">
          <span className="section-label">Our Story</span>
          <h1 className="font-display text-5xl md:text-7xl text-cream tracking-wide leading-none mb-6">CRAFTED WITH<br />LOVE & PURPOSE</h1>
          <div className="gold-divider" />
          <p className="font-serif italic text-cream/70 text-xl leading-relaxed mb-6">
            "Every bead I string carries the spirit of my ancestors and the dreams of modern African women."
          </p>
          <div className="space-y-4 text-cream/60 text-sm leading-relaxed">
            <p>Janelux Beads was founded by Esther, a passionate artisan from Lagos, Nigeria, with a vision to bring the beauty of handcrafted African bead work to the world. What began as a hobby — learning from her grandmother how to string beads — has grown into a luxury brand celebrated across Nigeria and beyond.</p>
            <p>Each piece in the Janelux Beads collection is handcrafted, meaning no two are ever exactly alike. This is by design. We believe in the uniqueness of every woman who wears our pieces, and we create accessories that reflect that individuality.</p>
            <p>Our materials are carefully sourced, our techniques are traditional, and our designs are contemporary — a fusion that represents the best of African heritage meeting modern luxury.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12">
            {[{ num: '500+', label: 'Happy Customers' }, { num: '100%', label: 'Handcrafted' }, { num: '8', label: 'Collections' }].map(s => (
              <div key={s.label} className="bg-obsidian-light border border-obsidian-border p-6 text-center">
                <div className="font-display text-4xl text-gold">{s.num}</div>
                <div className="text-cream/50 text-xs tracking-widest uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handle = (e) => {
    e.preventDefault();
    setSent(true);
    toast.success('Message sent! We\'ll reply within 24 hours.');
  };

  return (
    <>
      <Helmet><title>Contact Us — Janelux Beads</title></Helmet>
      <div className="max-w-screen-xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-16 max-w-4xl">
          <div>
            <span className="section-label">Get in Touch</span>
            <h1 className="font-display text-5xl text-cream tracking-wide mb-6">CONTACT US</h1>
            <div className="gold-divider" />
            <p className="text-cream/50 text-sm mb-8">Have a question about a product, need help with your order, or want to discuss a custom piece? We'd love to hear from you.</p>
            <div className="space-y-4">
              {[
                { icon: <Icons.Mail size={18} />, label: 'Email', val: 'hello@janeluxbeads.com', href: 'mailto:hello@janeluxbeads.com' },
                { icon: <Icons.Instagram size={18} />, label: 'Instagram', val: '@janeluxbeads', href: 'https://www.instagram.com/janeluxbeads' },
                { icon: <Icons.TikTok size={18} />, label: 'TikTok', val: '@janelux_beads', href: 'https://www.tiktok.com/@janelux_beads' },
                { icon: <Icons.MapPin size={18} />, label: 'Location', val: 'Lagos, Nigeria 🇳🇬', href: null },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="text-gold/60">{c.icon}</span>
                  <div>
                    <p className="text-[10px] text-cream/30 tracking-widest uppercase">{c.label}</p>
                    {c.href ? <a href={c.href} target="_blank" rel="noopener noreferrer" className="text-cream/70 hover:text-gold text-sm transition-colors">{c.val}</a>
                      : <p className="text-cream/70 text-sm">{c.val}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!sent ? (
            <form onSubmit={handle} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="section-label text-[10px]">Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-dark" required />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="section-label text-[10px]">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-dark" required />
                </div>
              </div>
              <div>
                <label className="section-label text-[10px]">Subject</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input-dark" placeholder="e.g. Custom Order Enquiry" />
              </div>
              <div>
                <label className="section-label text-[10px]">Message</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="input-dark resize-none" rows={5} required />
              </div>
              <button type="submit" className="btn-gold">Send Message</button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <Icons.Check size={48} className="text-gold mb-4" />
              <h3 className="font-display text-2xl text-cream tracking-wide">MESSAGE SENT</h3>
              <p className="text-cream/50 text-sm mt-2">We'll get back to you within 24 hours.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function NotFoundPage() {
  return (
    <>
      <Helmet><title>404 — Page Not Found | Janelux Beads</title></Helmet>
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="font-display text-[8rem] md:text-[12rem] text-cream/5 leading-none select-none">404</div>
        <h1 className="font-display text-4xl text-cream tracking-wide -mt-8 mb-4">PAGE NOT FOUND</h1>
        <p className="text-cream/40 text-sm mb-8 font-serif italic">The page you're looking for has wandered off...</p>
        <Link to="/" className="btn-gold">Return Home</Link>
      </div>
    </>
  );
}

export default AccountPage;