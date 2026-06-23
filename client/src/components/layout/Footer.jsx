import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../common/Icons';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await api.post('/newsletter/subscribe', { email });
      toast.success(res.data.message);
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-obsidian border-t border-obsidian-border mt-24">
      {/* Newsletter strip */}
      <div className="bg-obsidian-light border-b border-obsidian-border py-12 px-4">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="section-label">Join the family</span>
            <h3 className="font-display text-3xl text-cream tracking-wide">SUBSCRIBE FOR EXCLUSIVES</h3>
            <p className="text-cream/50 text-sm mt-1 font-serif italic">10% off your first order. Early access to new drops.</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-0">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              className="input-dark flex-1 md:w-72"
              required
            />
            <button type="submit" disabled={loading} className="btn-gold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? '...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-screen-xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            {/* Full logo mark in footer */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 flex items-center justify-center">
                  {/* Stylized JB monogram */}
                  <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
                    <defs>
                      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E8C06A" />
                        <stop offset="50%" stopColor="#C9993F" />
                        <stop offset="100%" stopColor="#A07828" />
                      </linearGradient>
                    </defs>
                    <text x="4" y="36" fontFamily="Georgia, serif" fontSize="32" fontWeight="bold" fill="url(#goldGrad)">JB</text>
                  </svg>
                </div>
                <div>
                  <div className="font-display text-lg tracking-widest2 text-cream leading-none">JANELUX</div>
                  <div className="font-sans text-[9px] tracking-widest3 text-gold/70 uppercase">BEADS</div>
                </div>
              </div>
              <p className="text-cream/40 text-xs leading-relaxed font-serif italic">
                Handcrafted bead accessories celebrating the richness of African artistry and heritage.
              </p>
            </div>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/janeluxbeads" target="_blank" rel="noopener noreferrer" className="text-cream/30 hover:text-gold transition-colors" aria-label="Instagram">
                <Icons.Instagram size={18} />
              </a>
              <a href="https://www.tiktok.com/@janelux_beads" target="_blank" rel="noopener noreferrer" className="text-cream/30 hover:text-gold transition-colors" aria-label="TikTok">
                <Icons.TikTok size={18} />
              </a>
              <a href="mailto:hello@janeluxbeads.com" className="text-cream/30 hover:text-gold transition-colors" aria-label="Email">
                <Icons.Mail size={18} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-sans text-[10px] tracking-widest2 uppercase text-gold mb-4">Shop</h4>
            <ul className="space-y-2">
              {['Handbags', 'Wristlets', 'Necklaces', 'Bracelets', 'Earrings', 'Waist Beads', 'Sets & Collections', 'Custom Orders'].map(cat => (
                <li key={cat}>
                  <Link to={`/shop/${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} className="text-cream/40 hover:text-gold text-xs transition-colors font-sans">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-sans text-[10px] tracking-widest2 uppercase text-gold mb-4">Help</h4>
            <ul className="space-y-2">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'Shipping Policy', href: '/shipping' },
                { label: 'Returns & Exchanges', href: '/returns' },
                { label: 'Sizing Guide', href: '/sizing' },
                { label: 'FAQs', href: '/faqs' },
              ].map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="text-cream/40 hover:text-gold text-xs transition-colors font-sans">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-sans text-[10px] tracking-widest2 uppercase text-gold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-cream/40 text-xs">
                <Icons.Mail size={14} className="mt-0.5 shrink-0 text-gold/50" />
                <a href="mailto:hello@janeluxbeads.com" className="hover:text-gold transition-colors">hello@janeluxbeads.com</a>
              </li>
              <li className="flex items-start gap-2 text-cream/40 text-xs">
                <Icons.MapPin size={14} className="mt-0.5 shrink-0 text-gold/50" />
                <span>Lagos, Nigeria 🇳🇬</span>
              </li>
              <li className="flex items-start gap-2 text-cream/40 text-xs">
                <Icons.Instagram size={14} className="mt-0.5 shrink-0 text-gold/50" />
                <a href="https://www.instagram.com/janeluxbeads" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">@janeluxbeads</a>
              </li>
              <li className="flex items-start gap-2 text-cream/40 text-xs">
                <Icons.TikTok size={14} className="mt-0.5 shrink-0 text-gold/50" />
                <a href="https://www.tiktok.com/@janelux_beads" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">@janelux_beads</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-obsidian-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-cream/25 text-[11px] tracking-wide font-sans">
            © {new Date().getFullYear()} Janelux Beads. All rights reserved. Handcrafted with love.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-cream/25 hover:text-gold text-[11px] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-cream/25 hover:text-gold text-[11px] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
