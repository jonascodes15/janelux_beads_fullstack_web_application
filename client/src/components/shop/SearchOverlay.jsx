import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../common/Icons';
import { formatPrice, getImageUrl } from '../../utils/api';
import api from '../../utils/api';

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(query)}&limit=6`);
        setResults(res.data.products || []);
      } catch { setResults([]); } finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timer.current);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-obsidian/98 backdrop-blur-md animate-fade-in">
      {/* Search bar */}
      <div className="border-b border-obsidian-border px-4 py-4 flex items-center gap-4">
        <Icons.Search size={20} className="text-gold/60 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for bags, jewelry, waist beads..."
          className="flex-1 bg-transparent text-cream text-lg placeholder-cream/20 outline-none font-sans"
        />
        {loading && <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin shrink-0" />}
        <button onClick={onClose} className="text-cream/50 hover:text-gold p-1 shrink-0">
          <Icons.Close size={22} />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        {results.length > 0 ? (
          <>
            <p className="text-[10px] tracking-widest uppercase text-cream/30 mb-4">{results.length} results for "{query}"</p>
            <ul className="space-y-3">
              {results.map(p => (
                <li key={p.id}>
                  <Link to={`/product/${p.slug}`} onClick={onClose} className="flex gap-4 p-3 hover:bg-obsidian-light border border-transparent hover:border-gold/20 transition-all group">
                    <div className="w-16 h-16 bg-obsidian-light shrink-0 overflow-hidden">
                      <img src={getImageUrl(p.primary_image)} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-cream group-hover:text-gold transition-colors leading-snug">{p.name}</p>
                      {p.category_name && <p className="text-[10px] text-gold/50 tracking-widest uppercase mt-0.5">{p.category_name}</p>}
                      <p className="text-gold text-sm font-semibold mt-1">{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link to={`/shop?search=${encodeURIComponent(query)}`} onClick={onClose} className="block text-center text-gold/60 text-xs tracking-widest uppercase mt-6 hover:text-gold transition-colors py-3 border border-obsidian-border hover:border-gold/30">
              View all results
            </Link>
          </>
        ) : query.length >= 2 && !loading ? (
          <div className="text-center pt-12">
            <p className="font-display text-3xl text-cream/20 tracking-widest">NO RESULTS</p>
            <p className="text-cream/30 text-sm mt-2">Try different search terms</p>
          </div>
        ) : query.length === 0 ? (
          <div>
            <p className="text-[10px] tracking-widest uppercase text-cream/30 mb-4">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {['Handbags', 'Waist Beads', 'Necklaces', 'Bracelets', 'Custom Orders', 'Sets'].map(term => (
                <button key={term} onClick={() => setQuery(term)} className="border border-obsidian-border text-cream/50 hover:border-gold/40 hover:text-gold px-4 py-2 text-xs tracking-widest uppercase transition-all">
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
