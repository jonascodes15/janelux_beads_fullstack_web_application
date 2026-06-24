import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Icons } from '../components/common/Icons';
import ProductCard from '../components/shop/ProductCard';
import api from '../utils/api';

// Hero slides — replace image URLs with real product images
const HERO_SLIDES = [
  {
    title: 'WOVEN FROM\nHERITAGE',
    subtitle: 'Luxury bead handbags handcrafted in Nigeria',
    cta: 'Shop Handbags',
    href: '/shop/handbags',
    bg: 'from-obsidian via-obsidian-mid to-obsidian-light',
    accent: 'Each piece tells a story of African artistry passed down through generations.',
  },
  {
    title: 'ADORN\nYOURSELF',
    subtitle: 'Statement jewelry that celebrates who you are',
    cta: 'Shop Jewelry',
    href: '/shop/necklaces',
    bg: 'from-[#1A0F00] via-obsidian to-obsidian',
    accent: 'Bold. Beautiful. Unapologetically African.',
  },
  {
    title: 'CUSTOM\nCREATIONS',
    subtitle: 'Bespoke pieces crafted to your exact vision',
    cta: 'Order Custom',
    href: '/shop/custom-orders',
    bg: 'from-obsidian via-[#0F0A00] to-obsidian',
    accent: 'Work directly with Esther to create your dream piece.',
  },
];



function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback((idx) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 300);
  }, [animating]);

  const next = () => goTo((current + 1) % HERO_SLIDES.length);
  const prev = () => goTo((current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  // Auto-advance
  useEffect(() => {
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [current]);

  const slide = HERO_SLIDES[current];

  return (
    <section className={`relative bg-gradient-to-br ${slide.bg} min-h-[88vh] flex items-end overflow-hidden transition-all duration-700`}>
      {/* Decorative bead pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="beads" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="3" fill="#C9993F" />
              <circle cx="0" cy="0" r="2" fill="#C9993F" />
              <circle cx="40" cy="0" r="2" fill="#C9993F" />
              <circle cx="0" cy="40" r="2" fill="#C9993F" />
              <circle cx="40" cy="40" r="2" fill="#C9993F" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#beads)" />
        </svg>
      </div>

      {/* Gold line accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Content */}
      <div className={`relative z-10 px-6 pb-16 pt-24 max-w-screen-xl mx-auto w-full transition-all duration-500 ${animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <span className="section-label">New Collection {new Date().getFullYear()}</span>

        <h1 className="font-display text-[clamp(4rem,16vw,10rem)] leading-none tracking-wide text-cream whitespace-pre-line">
          {slide.title}
        </h1>

        <div className="gold-divider" />

        <p className="font-serif italic text-cream/70 text-lg md:text-xl mb-2">{slide.subtitle}</p>
        <p className="text-cream/40 text-sm mb-8 max-w-sm">{slide.accent}</p>

        <div className="flex flex-wrap gap-4">
          <Link to={slide.href} className="btn-gold flex items-center gap-2">
            {slide.cta} <Icons.ArrowRight size={16} />
          </Link>
          <Link to="/shop" className="btn-outline">
            View All
          </Link>
        </div>
      </div>

      {/* Nav */}
      <div className="absolute bottom-8 right-6 flex items-center gap-4 z-10">
        <button onClick={prev} className="w-10 h-10 border border-cream/20 hover:border-gold flex items-center justify-center text-cream/60 hover:text-gold transition-all">
          <Icons.ChevronLeft size={18} />
        </button>
        <div className="flex gap-1.5">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className={`h-px transition-all duration-300 ${i === current ? 'w-8 bg-gold' : 'w-4 bg-cream/30'}`} />
          ))}
        </div>
        <button onClick={next} className="w-10 h-10 border border-cream/20 hover:border-gold flex items-center justify-center text-cream/60 hover:text-gold transition-all">
          <Icons.ChevronRight size={18} />
        </button>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-cream/20 animate-bounce z-10">
        <span className="text-[9px] tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-cream/20 to-transparent" />
      </div>
    </section>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [featRes, newRes] = await Promise.all([
          api.get('/products?featured=true&limit=4'),
          api.get('/products?new=true&limit=8'),
        ]);
        setFeatured(featRes.data.products || []);
        setNewArrivals(newRes.data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <>
      <Helmet>
        <title>Janelux Beads — Luxury African Bead Accessories</title>
        <meta name="description" content="Handcrafted luxury bead handbags, jewelry and accessories. Celebrating African artistry and heritage. Shop our exclusive collections." />
      </Helmet>

      {/* Hero */}
      <HeroCarousel />

      {/* Trust strip */}
      <div className="bg-obsidian-light border-y border-obsidian-border py-4">
        <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Icons.Shield size={16} />, text: 'Authentic Handcraft' },
            { icon: <Icons.Truck size={16} />, text: 'Nationwide Delivery' },
            { icon: <Icons.RefreshCw size={16} />, text: 'Easy Returns' },
            { icon: <Icons.Star size={16} />, text: '5-Star Rated' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2 justify-center md:justify-start">
              <span className="text-gold/60">{t.icon}</span>
              <span className="text-cream/50 text-[10px] tracking-widest uppercase font-sans">{t.text}</span>
            </div>
          ))}
        </div>
      </div>



      {/* Featured */}
      {(loading || featured.length > 0) && (
        <section className="py-16 px-4 bg-obsidian-light border-y border-obsidian-border">
          <div className="max-w-screen-xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="section-label">Handpicked</span>
                <h2 className="section-title">FEATURED PIECES</h2>
              </div>
              <Link to="/shop?featured=true" className="btn-ghost flex items-center gap-1 text-xs">
                See all <Icons.ArrowRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="aspect-square shimmer" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {featured.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Brand story */}
      <section className="py-20 px-4 max-w-screen-xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            {/* Decorative art element */}
            <div className="relative aspect-square bg-obsidian-light border border-obsidian-border overflow-hidden max-w-md">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 300 300" className="w-2/3 opacity-20">
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#E8C06A" /><stop offset="100%" stopColor="#A07828" />
                    </linearGradient>
                  </defs>
                  {[...Array(8)].map((_, i) => (
                    <circle key={i} cx="150" cy="150" r={20 + i * 18} fill="none" stroke="url(#g1)" strokeWidth="1" opacity={0.8 - i * 0.08} />
                  ))}
                  {[...Array(16)].map((_, i) => {
                    const angle = (i / 16) * Math.PI * 2;
                    const r = 120;
                    return <circle key={i} cx={150 + Math.cos(angle) * r} cy={150 + Math.sin(angle) * r} r="6" fill="url(#g1)" />;
                  })}
                </svg>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-display text-5xl text-gold/20 tracking-widest">JB</p>
              </div>
            </div>
          </div>
          <div>
            <span className="section-label">Our Story</span>
            <h2 className="font-display text-4xl md:text-5xl text-cream tracking-wide leading-none mb-4">
              CRAFTED WITH<br />LOVE & PURPOSE
            </h2>
            <div className="gold-divider" />
            <p className="text-cream/60 font-serif italic text-lg leading-relaxed mb-4">
              "Every bead I string carries the spirit of my ancestors and the dreams of modern African women."
            </p>
            <p className="text-cream/50 text-sm leading-relaxed mb-6 font-sans">
              Janelux Beads was born from a deep love of African craft traditions and a vision to bring handcrafted luxury to the world. Founded by Esther, each piece is a celebration of heritage, identity, and artistry.
            </p>
            <Link to="/about" className="btn-outline inline-flex items-center gap-2">
              Our Story <Icons.ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {(loading || newArrivals.length > 0) && (
        <section className="py-16 px-4 border-t border-obsidian-border">
          <div className="max-w-screen-xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="section-label">Fresh in</span>
                <h2 className="section-title">NEW ARRIVALS</h2>
              </div>
              <Link to="/shop?new=true" className="btn-ghost flex items-center gap-1 text-xs">
                View all <Icons.ArrowRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => <div key={i} className="aspect-square shimmer" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Social proof / Instagram */}
      <section className="py-16 px-4 bg-obsidian-light border-y border-obsidian-border">
        <div className="max-w-screen-xl mx-auto text-center mb-10">
          <span className="section-label justify-center flex">Follow Our Journey</span>
          <h2 className="section-title">@JANELUXBEADS</h2>
          <p className="text-cream/40 text-sm mt-2 font-serif italic">Tag us in your looks for a chance to be featured</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <a href="https://www.instagram.com/janeluxbeads" target="_blank" rel="noopener noreferrer" className="btn-outline inline-flex items-center gap-2 text-xs">
              <Icons.Instagram size={14} /> Instagram
            </a>
            <a href="https://www.tiktok.com/@janelux_beads" target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center gap-2 text-xs">
              <Icons.TikTok size={14} /> TikTok
            </a>
          </div>
        </div>
        {/* Placeholder grid for Instagram feed */}
        <div className="max-w-screen-xl mx-auto grid grid-cols-3 md:grid-cols-6 gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-obsidian border border-obsidian-border flex items-center justify-center group cursor-pointer hover:border-gold/30 transition-colors">
              <Icons.Instagram size={24} className="text-cream/10 group-hover:text-gold/30 transition-colors" />
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="section-label justify-center flex">Exclusive Access</span>
          <h2 className="font-display text-4xl md:text-5xl text-cream tracking-wide mb-4">JOIN THE INNER CIRCLE</h2>
          <p className="text-cream/50 font-serif italic mb-8">Get early access to new drops, styling tips, and exclusive offers. Plus 10% off your first order.</p>
          <NewsletterInline />
        </div>
      </section>
    </>
  );
}

function NewsletterInline() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      setDone(true);
    } catch (err) {
      import('react-hot-toast').then(({ default: toast }) => toast.error(err.response?.data?.message || 'Failed'));
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="flex items-center justify-center gap-2 text-gold">
      <Icons.Check size={20} />
      <span className="font-sans text-sm tracking-widest uppercase">You're in! Check your email.</span>
    </div>
  );

  return (
    <form onSubmit={handle} className="flex gap-0 max-w-md mx-auto">
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" className="input-dark flex-1" required />
      <button type="submit" disabled={loading} className="btn-gold disabled:opacity-50 whitespace-nowrap">
        {loading ? '...' : 'Join'}
      </button>
    </form>
  );
}
