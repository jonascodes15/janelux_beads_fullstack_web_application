import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Icons } from '../components/common/Icons';
import ProductCard from '../components/shop/ProductCard';
import api from '../utils/api';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

const CATEGORIES = [
  { name: 'All Products', slug: '' },
  { name: 'Handbags', slug: 'handbags' },
  { name: 'Wristlets', slug: 'wristlets' },
  { name: 'Necklaces', slug: 'necklaces' },
  { name: 'Bracelets', slug: 'bracelets' },
  { name: 'Earrings', slug: 'earrings' },
  { name: 'Waist Beads', slug: 'waist-beads' },
  { name: 'Sets & Collections', slug: 'sets-collections' },
  { name: 'Custom Orders', slug: 'custom-orders' },
];

export default function ShopPage() {
  const { category: categoryParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [gridView, setGridView] = useState(true);

  const search = searchParams.get('search') || '';
  const featured = searchParams.get('featured') || '';
  const isNew = searchParams.get('new') || '';
  const sort = searchParams.get('sort') || 'newest';
  const category = categoryParam || searchParams.get('category') || '';

  const LIMIT = 12;

  const fetchProducts = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: LIMIT,
        offset: (pg - 1) * LIMIT,
        sort,
        ...(category && { category }),
        ...(search && { search }),
        ...(featured && { featured }),
        ...(isNew && { new: isNew }),
      });
      const res = await api.get(`/products?${params}`);
      setProducts(pg === 1 ? res.data.products : prev => [...prev, ...res.data.products]);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search, featured, isNew, sort]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1);
  }, [fetchProducts]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProducts(next);
  };

  const setSort = (val) => {
    const p = new URLSearchParams(searchParams);
    p.set('sort', val);
    setSearchParams(p);
  };

  const currentCat = CATEGORIES.find(c => c.slug === category);
  const pageTitle = search ? `Search: "${search}"` : currentCat?.name || 'All Products';

  return (
    <>
      <Helmet>
        <title>{pageTitle} — Janelux Beads</title>
        <meta name="description" content={`Shop ${pageTitle} — handcrafted luxury bead accessories by Janelux Beads.`} />
      </Helmet>

      {/* Page header */}
      <div className="border-b border-obsidian-border bg-obsidian-light py-10 px-4">
        <div className="max-w-screen-xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-cream/30 mb-4">
            <Link to="/" className="hover:text-gold transition-colors">Home</Link>
            <Icons.ChevronRight size={10} />
            <Link to="/shop" className="hover:text-gold transition-colors">Shop</Link>
            {category && (
              <>
                <Icons.ChevronRight size={10} />
                <span className="text-gold/60">{currentCat?.name || category}</span>
              </>
            )}
          </nav>
          <h1 className="font-display text-4xl md:text-6xl tracking-wide text-cream">
            {pageTitle.toUpperCase()}
          </h1>
          {!loading && (
            <p className="text-cream/30 text-xs mt-2 tracking-widest">{total} {total === 1 ? 'piece' : 'pieces'}</p>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              to={cat.slug ? `/shop/${cat.slug}` : '/shop'}
              className={`whitespace-nowrap text-[10px] tracking-widest uppercase px-4 py-2 border transition-all flex-shrink-0 ${
                category === cat.slug
                  ? 'bg-gold text-obsidian border-gold'
                  : 'border-obsidian-border text-cream/50 hover:border-gold/40 hover:text-gold'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6 py-3 border-y border-obsidian-border">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 text-cream/60 hover:text-gold text-xs tracking-widest uppercase transition-colors"
          >
            <Icons.Filter size={14} />
            Filter
          </button>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="appearance-none bg-transparent text-cream/60 text-xs tracking-widest uppercase cursor-pointer pr-6 focus:outline-none focus:text-gold"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-obsidian text-cream">{o.label}</option>
                ))}
              </select>
              <Icons.ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-cream/40 pointer-events-none" />
            </div>

            {/* Grid / List toggle */}
            <div className="flex items-center gap-1 ml-3">
              <button onClick={() => setGridView(true)} className={`p-1.5 transition-colors ${gridView ? 'text-gold' : 'text-cream/30 hover:text-cream/60'}`}>
                <Icons.Grid size={16} />
              </button>
              <button onClick={() => setGridView(false)} className={`p-1.5 transition-colors ${!gridView ? 'text-gold' : 'text-cream/30 hover:text-cream/60'}`}>
                <Icons.List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Products grid */}
        {loading && products.length === 0 ? (
          <div className={`grid gap-3 ${gridView ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`shimmer ${gridView ? 'aspect-square' : 'h-32'}`} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Icons.Package size={64} className="text-cream/10 mb-6" />
            <h3 className="font-display text-3xl text-cream/30 tracking-widest">NO PRODUCTS FOUND</h3>
            <p className="text-cream/30 text-sm mt-2 mb-6">
              {search ? `No results for "${search}"` : 'Check back soon for new arrivals'}
            </p>
            <Link to="/shop" className="btn-outline">Browse All Products</Link>
          </div>
        ) : (
          <>
            <div className={`grid gap-3 ${gridView ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>

            {/* Load more */}
            {products.length < total && (
              <div className="text-center mt-12">
                <button onClick={loadMore} disabled={loading} className="btn-outline inline-flex items-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /> Loading...</> : `Load More (${total - products.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
