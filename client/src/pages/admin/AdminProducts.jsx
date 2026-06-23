import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Icons } from '../../components/common/Icons';
import { formatPrice, getImageUrl } from '../../utils/api';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products?limit=100${search ? `&search=${encodeURIComponent(search)}` : ''}`);
      setProducts(res.data.products || []);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [search]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove "${name}" from the store?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product removed');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch { toast.error('Failed to remove'); }
    finally { setDeleting(null); }
  };

  return (
    <>
      <Helmet><title>Products — Janelux Admin</title></Helmet>

      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="section-label">Manage</span>
          <h1 className="font-display text-4xl text-cream tracking-wide">PRODUCTS</h1>
        </div>
        <Link to="/admin/products/new" className="btn-gold flex items-center gap-2">
          <Icons.Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input-dark pl-9 text-sm"
          />
        </div>
        <button onClick={fetchProducts} className="btn-outline px-4 py-2 flex items-center gap-2 text-xs">
          <Icons.RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-obsidian-light border border-obsidian-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-obsidian-border">
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] tracking-widest uppercase text-cream/30 font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-obsidian-border">
                    {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="shimmer h-4 w-full" /></td>)}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-cream/20">No products found</td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="border-b border-obsidian-border hover:bg-obsidian transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-obsidian shrink-0 overflow-hidden">
                        {p.primary_image && <img src={getImageUrl(p.primary_image)} alt={p.name} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="text-cream text-xs font-medium line-clamp-1 max-w-[200px]">{p.name}</p>
                        {p.is_featured && <span className="text-[9px] text-gold tracking-widest uppercase">Featured</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-cream/50 text-xs">{p.category_name || '—'}</td>
                  <td className="px-4 py-3 text-cream text-xs font-semibold">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${p.stock_qty === 0 ? 'text-red-400' : p.stock_qty < 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {p.stock_qty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 ${p.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {p.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/product/${p.slug}`} target="_blank" className="text-cream/30 hover:text-gold transition-colors p-1" title="View">
                        <Icons.Eye size={15} />
                      </Link>
                      <Link to={`/admin/products/${p.id}/edit`} className="text-cream/30 hover:text-gold transition-colors p-1" title="Edit">
                        <Icons.Edit size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={deleting === p.id}
                        className="text-cream/30 hover:text-terracotta transition-colors p-1 disabled:opacity-30"
                        title="Remove"
                      >
                        <Icons.Trash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-obsidian-border text-cream/30 text-xs">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </div>
      </div>
    </>
  );
}
