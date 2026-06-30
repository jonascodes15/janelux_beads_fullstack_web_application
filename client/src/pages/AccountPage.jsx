import { useState, useEffect, useRef } from 'react';
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

// ─────────────────────────────────────────────────────────────────
// ABOUT PAGE IMAGE ARRAYS — add your hosted URLs here
// ─────────────────────────────────────────────────────────────────

// Hero background carousel (full-width behind the title)
// Recommended: wide landscape images, 1440×900px or larger
const ABOUT_HERO_IMAGES = [
  'https://i.ibb.co/nqfwcx0J/IMG-2353.png',
  'https://i.ibb.co/0R21XGns/IMG-2355.png',
  'https://i.ibb.co/p6hqL9hj/IMG-2354.png',
];

// Side image carousel (left column next to the story text)
// Recommended: portrait or square images, min 600×800px
const ABOUT_SIDE_IMAGES = [
  'https://i.ibb.co/7xYtG1wy/IMG-2359.png',
  'https://i.ibb.co/23CP7NDK/IMG-2360.png',
  // 'https://i.ibb.co/xxxx/team.jpg',
];

// Animated counter hook
function useCountUp(target, duration = 1800, suffix = '') {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

function AnimatedStat({ target, suffix, label }) {
  const { count, ref } = useCountUp(target);
  return (
    <div ref={ref} className="bg-obsidian-light border border-obsidian-border p-3 sm:p-6 text-center">
      <div className="font-display text-2xl sm:text-4xl md:text-5xl text-gold">
        {count}{suffix}
      </div>
      <div className="text-cream/50 text-[9px] sm:text-xs tracking-wider sm:tracking-widest uppercase mt-1 sm:mt-2 leading-tight">{label}</div>
    </div>
  );
}

function AboutImageCarousel({ images, className = '', aspect = 'aspect-[4/5]' }) {
  const [idx, setIdx] = useState(0);
  const hasImages = images.length > 0;

  useEffect(() => {
    if (!hasImages || images.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 4500);
    return () => clearInterval(t);
  }, [hasImages, images.length]);

  if (!hasImages) {
    // Decorative placeholder
    return (
      <div className={`relative ${aspect} bg-obsidian-light border border-obsidian-border overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 300 300" className="w-2/3 opacity-15">
            <defs>
              <linearGradient id="pg1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E8C06A" /><stop offset="100%" stopColor="#A07828" />
              </linearGradient>
            </defs>
            {[...Array(8)].map((_, i) => (
              <circle key={i} cx="150" cy="150" r={20 + i * 18} fill="none" stroke="url(#pg1)" strokeWidth="1" opacity={0.8 - i * 0.08} />
            ))}
            {[...Array(16)].map((_, i) => {
              const angle = (i / 16) * Math.PI * 2;
              return <circle key={i} cx={150 + Math.cos(angle) * 120} cy={150 + Math.sin(angle) * 120} r="5" fill="url(#pg1)" />;
            })}
          </svg>
        </div>
        <div className="absolute bottom-6 left-6">
          <p className="font-display text-5xl text-gold/20 tracking-widest">JB</p>
        </div>
        <div className="absolute inset-0 flex items-end justify-center pb-8">
          <p className="text-cream/20 text-[10px] tracking-widest uppercase text-center px-4">
            Add image URLs to<br />ABOUT_SIDE_IMAGES
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${aspect} bg-obsidian overflow-hidden ${className}`}>
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Janelux Beads story ${i + 1}`}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: i === idx ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-obsidian/50 via-transparent to-transparent pointer-events-none" />
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all duration-300 ${i === idx ? 'w-5 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-cream/40 hover:bg-cream/70'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AboutHero() {
  const [idx, setIdx] = useState(0);
  const hasImages = ABOUT_HERO_IMAGES.length > 0;

  useEffect(() => {
    if (!hasImages || ABOUT_HERO_IMAGES.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % ABOUT_HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, [hasImages]);

  return (
    <div className="relative min-h-[50vh] flex items-end overflow-hidden bg-obsidian">
      {/* Background images */}
      {hasImages ? (
        ABOUT_HERO_IMAGES.map((src, i) => (
          <div key={i} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === idx ? 1 : 0 }}>
            <img src={src} alt="" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-obsidian/80 via-obsidian/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-obsidian to-transparent" />
          </div>
        ))
      ) : (
        /* No images yet — just a rich dark gradient */
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A0F00] via-obsidian to-obsidian">
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%"><defs><pattern id="ab" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="3" fill="#C9993F" /><circle cx="0" cy="0" r="2" fill="#C9993F" />
              <circle cx="40" cy="0" r="2" fill="#C9993F" /><circle cx="0" cy="40" r="2" fill="#C9993F" /><circle cx="40" cy="40" r="2" fill="#C9993F" />
            </pattern></defs><rect width="100%" height="100%" fill="url(#ab)" /></svg>
          </div>
        </div>
      )}

      {/* Gold top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Hero text */}
      <div className="relative z-10 px-4 md:px-12 py-16 max-w-screen-xl mx-auto w-full">
        <span className="section-label">Our Story</span>
        <h1 className="font-display text-5xl md:text-7xl text-cream tracking-wide leading-none mb-4">
          CRAFTED WITH<br />LOVE & PURPOSE
        </h1>
        <p className="font-serif italic text-cream/70 text-lg md:text-xl max-w-xl">
          "Every bead I string carries the spirit of my ancestors and the dreams of modern African women."
        </p>
      </div>

      {/* Dot indicators */}
      {hasImages && ABOUT_HERO_IMAGES.length > 1 && (
        <div className="absolute bottom-6 right-8 flex gap-1.5 z-10">
          {ABOUT_HERO_IMAGES.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`rounded-full transition-all duration-300 ${i === idx ? 'w-5 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-cream/30 hover:bg-cream/60'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Us — Janelux Beads</title>
        <meta name="description" content="The story of Janelux Beads — handcrafted luxury bead accessories celebrating African heritage." />
      </Helmet>

      {/* Hero with optional background carousel */}
      <AboutHero />

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">

          {/* Left — side image carousel */}
          <AboutImageCarousel images={ABOUT_SIDE_IMAGES} aspect="aspect-[4/5]" className="md:sticky md:top-24" />

          {/* Right — story text */}
          <div>
            <div className="gold-divider" />
            <div className="space-y-4 text-cream/60 text-sm leading-relaxed mb-12">
              <p>Janelux Beads was founded by Esther, a passionate artisan from Lagos, Nigeria, with a vision to bring the beauty of handcrafted African bead work to the world. What began as a hobby — learning from her grandmother how to string beads — has grown into a luxury brand celebrated across Nigeria and beyond.</p>
              <p>Each piece in the Janelux Beads collection is handcrafted, meaning no two are ever exactly alike. This is by design. We believe in the uniqueness of every woman who wears our pieces, and we create accessories that reflect that individuality.</p>
              <p>Our materials are carefully sourced, our techniques are traditional, and our designs are contemporary — a fusion that represents the best of African heritage meeting modern luxury.</p>
            </div>

            {/* Animated stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <AnimatedStat target={500} suffix="+" label="Happy Customers" />
              <AnimatedStat target={100} suffix="%" label="Handcrafted" />
              <AnimatedStat target={8} suffix="" label="Collections" />
            </div>

            <div className="mt-10">
              <Link to="/shop" className="btn-gold inline-flex items-center gap-2">
                Shop the Collection <Icons.ArrowRight size={16} />
              </Link>
            </div>
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
