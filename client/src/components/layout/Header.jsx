import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../common/Icons';
import CartDrawer from '../shop/CartDrawer';
import SearchOverlay from '../shop/SearchOverlay';

const NAV_LEFT = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Handbags', href: '/shop/handbags' },
  { label: 'Jewelry', href: '/shop/necklaces' },
];

const NAV_RIGHT = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const NAV_ALL = [...NAV_LEFT, ...NAV_RIGHT];

const BagIcon = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const SearchIcon = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L21 21" />
  </svg>
);

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count, setIsOpen: setCartOpen } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Scroll shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isActive = (href) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  // Admin users always go to /admin, regular users go to /account
  const accountHref = user?.role === 'admin' ? '/admin' : '/account';

  return (
    <>
      {/* Announcement bar */}
      <div className="announcement-bar">
        <div className="overflow-hidden whitespace-nowrap">
          <span className="inline-block animate-marquee">
            Free shipping on orders over &#8358;500,000 &nbsp;&middot;&nbsp; New Collection Available &mdash; Shop Now &nbsp;&middot;&nbsp; Handcrafted with Love in Nigeria &#127475;&#127468; &nbsp;&middot;&nbsp; Free shipping on orders over &#8358;500,000 &nbsp;&middot;&nbsp; New Collection Available &mdash; Shop Now &nbsp;&middot;&nbsp; Handcrafted with Love in Nigeria &#127475;&#127468; &nbsp;&middot;&nbsp;
          </span>
        </div>
      </div>

      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-obsidian/95 backdrop-blur-md border-b border-obsidian-border shadow-xl shadow-black/50' : 'bg-obsidian border-b border-obsidian-border'}`}>

        {/* ── DESKTOP HEADER ── */}
        <div className="hidden lg:flex max-w-screen-xl mx-auto px-6 h-16 items-center justify-between gap-6">

          {/* Left nav */}
          <nav className="flex items-center gap-6">
            {NAV_LEFT.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`font-sans text-[11px] tracking-widest uppercase transition-colors duration-200 ${isActive(link.href) ? 'text-gold' : 'text-cream/70 hover:text-cream'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Centre logo */}
          <Link to="/" className="flex flex-col items-center group shrink-0">
            <span className="font-display text-2xl tracking-widest2 text-cream group-hover:text-gold transition-colors leading-none">JANELUX</span>
            <span className="font-sans text-[9px] tracking-widest3 text-gold/80 uppercase leading-tight">BEADS</span>
          </Link>

          {/* Right nav + icons */}
          <div className="flex items-center gap-6">
            {NAV_RIGHT.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`font-sans text-[11px] tracking-widest uppercase transition-colors duration-200 ${isActive(link.href) ? 'text-gold' : 'text-cream/70 hover:text-cream'}`}
              >
                {link.label}
              </Link>
            ))}

            <div className="w-px h-4 bg-obsidian-border" />

            <div className="flex items-center gap-4">
              {/* Search */}
              <button onClick={() => setSearchOpen(true)} className="text-cream/70 hover:text-gold transition-colors" aria-label="Search">
                <SearchIcon size={18} />
              </button>

              {/* Account / Admin — key change: admin goes straight to /admin */}
              {user ? (
                <Link
                  to={accountHref}
                  className="text-cream/70 hover:text-gold transition-colors relative"
                  aria-label={user.role === 'admin' ? 'Admin Panel' : 'My Account'}
                  title={user.role === 'admin' ? 'Admin Panel' : 'My Account'}
                >
                  <Icons.User size={18} />
                  {user.role === 'admin' && (
                    <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-gold rounded-full" />
                  )}
                </Link>
              ) : (
                <Link to="/login" className="text-cream/70 hover:text-gold transition-colors" aria-label="Sign in">
                  <Icons.User size={18} />
                </Link>
              )}

              {/* Wishlist */}
              <Link to="/wishlist" className="text-cream/70 hover:text-gold transition-colors" aria-label="Wishlist">
                <Icons.Heart size={18} />
              </Link>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative text-cream/70 hover:text-gold transition-colors"
                aria-label="Cart"
              >
                <BagIcon size={20} />
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gold text-obsidian text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE HEADER ── */}
        <div className="flex lg:hidden max-w-screen-xl mx-auto px-4 h-16 items-center justify-between gap-4">

          <button
            onClick={() => setMenuOpen(true)}
            className="text-cream/80 hover:text-gold transition-colors p-1 -ml-1"
            aria-label="Open menu"
          >
            <Icons.Menu size={24} />
          </button>

          <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center group">
            <span className="font-display text-xl tracking-widest2 text-cream group-hover:text-gold transition-colors leading-none">JANELUX</span>
            <span className="font-sans text-[9px] tracking-widest3 text-gold/80 uppercase leading-tight">BEADS</span>
          </Link>

          <div className="flex items-center gap-3">
            <button onClick={() => setSearchOpen(true)} className="text-cream/70 hover:text-gold transition-colors p-1" aria-label="Search">
              <SearchIcon size={19} />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-cream/70 hover:text-gold transition-colors p-1"
              aria-label="Cart"
            >
              <BagIcon size={21} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-obsidian text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE FULLSCREEN MENU ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col animate-fade-in lg:hidden">
          <div className="flex items-center justify-between px-6 h-16 border-b border-obsidian-border shrink-0">
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex flex-col">
              <span className="font-display text-xl tracking-widest2 text-cream leading-none">JANELUX</span>
              <span className="font-sans text-[9px] tracking-widest3 text-gold/80 uppercase">BEADS</span>
            </Link>
            <button onClick={() => setMenuOpen(false)} className="text-cream/70 hover:text-gold p-1" aria-label="Close">
              <Icons.Close size={26} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-6 pt-8 pb-4">
            <ul className="space-y-1">
              {NAV_ALL.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="block font-display text-5xl tracking-wide text-cream hover:text-gold transition-colors duration-200 py-2 leading-tight"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label.toUpperCase()}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="border-t border-obsidian-border my-6" />

            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  {/* Admin gets a prominent admin panel link, regular users get account */}
                  {user.role === 'admin' ? (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2 text-gold">
                      <Icons.Dashboard size={14} /> Admin Panel
                    </Link>
                  ) : (
                    <Link to="/account" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2">
                      <Icons.User size={14} /> My Account
                    </Link>
                  )}
                  <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2">
                    <Icons.Heart size={14} /> Wishlist
                  </Link>
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="nav-link flex items-center gap-2 text-left">
                    <Icons.LogOut size={14} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2">
                    <Icons.User size={14} /> Sign In
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2">
                    <Icons.Plus size={14} /> Create Account
                  </Link>
                </>
              )}
            </div>

            <div className="mt-10 flex items-center gap-4">
              <a href="https://www.instagram.com/janeluxbeads" target="_blank" rel="noopener noreferrer" className="text-cream/40 hover:text-gold transition-colors">
                <Icons.Instagram size={20} />
              </a>
              <a href="https://www.tiktok.com/@janelux_beads" target="_blank" rel="noopener noreferrer" className="text-cream/40 hover:text-gold transition-colors">
                <Icons.TikTok size={20} />
              </a>
            </div>
          </nav>
        </div>
      )}

      <CartDrawer />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}