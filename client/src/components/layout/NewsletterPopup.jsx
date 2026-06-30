import { useState, useEffect } from 'react';
import { Icons } from '../common/Icons';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// How long to wait before showing the popup (ms)
const DELAY_MS = 5000;

// How many days before showing it again to the same visitor after they close it
const SNOOZE_DAYS = 7;

const STORAGE_KEY = 'jlx_newsletter_popup_dismissed_at';

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Don't show again if already subscribed or recently dismissed
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < SNOOZE_DAYS) return;
    }

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Lock body scroll while popup is open
  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  const close = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      // Reuses the exact same backend route as the footer + inline homepage forms
      const res = await api.post('/newsletter/subscribe', { email });
      toast.success(res.data.message);
      setDone(true);
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      // Auto-close shortly after success
      setTimeout(() => setVisible(false), 2200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div className="relative bg-obsidian border border-gold/20 max-w-md w-full p-8 md:p-10 text-center animate-fade-up">
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-cream/40 hover:text-gold transition-colors p-1"
          aria-label="Close"
        >
          <Icons.Close size={20} />
        </button>

        {done ? (
          <div className="py-6">
            <Icons.Check size={40} className="text-gold mx-auto mb-4" />
            <p className="font-display text-2xl text-cream tracking-wide">YOU'RE IN!</p>
            <p className="text-cream/50 text-sm mt-2 font-serif italic">Check your email for your welcome gift.</p>
          </div>
        ) : (
          <>
            <span className="section-label justify-center flex">Exclusive Access</span>
            <h2 className="font-display text-3xl md:text-4xl text-cream tracking-wide mb-4">
              JOIN THE INNER CIRCLE
            </h2>
            <p className="font-serif italic text-cream/50 text-sm mb-8">
              Get early access to new drops, styling tips, and exclusive offers. Plus 10% off your first order.
            </p>

            <form onSubmit={handleSubscribe} className="flex gap-0">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                className="input-dark flex-1"
                required
                autoFocus
              />
              <button type="submit" disabled={loading} className="btn-gold whitespace-nowrap disabled:opacity-50">
                {loading ? '...' : 'Join'}
              </button>
            </form>

            <button
              onClick={close}
              className="text-cream/30 hover:text-gold text-[10px] tracking-widest uppercase mt-6 transition-colors"
            >
              No thanks, maybe later
            </button>
          </>
        )}
      </div>
    </div>
  );
}
