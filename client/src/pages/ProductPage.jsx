import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Icons } from '../components/common/Icons';
import ProductCard from '../components/shop/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, getImageUrl } from '../utils/api';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  const [review, setReview] = useState({ rating: 5, title: '', body: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`)
      .then(res => setProduct(res.data.product))
      .catch(() => {})
      .finally(() => setLoading(false));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  if (loading) return (
    <div className="max-w-screen-xl mx-auto px-4 py-16">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square shimmer" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className={`shimmer h-6 ${i === 0 ? 'w-3/4' : i === 1 ? 'w-1/2' : 'w-full'}`} />)}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h2 className="font-display text-4xl text-cream/30 tracking-widest">PRODUCT NOT FOUND</h2>
      <Link to="/shop" className="btn-outline mt-6">Back to Shop</Link>
    </div>
  );

  const inStock = product.stock_qty > 0;
  const images = product.images?.length > 0 ? product.images : [{ image_url: null }];
  const hasDiscount = product.compare_price && product.compare_price > product.price;

  const handleAddToCart = () => {
    addItem({ ...product, primary_image: images[0]?.image_url }, qty);
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Sign in to save to wishlist'); return; }
    try {
      const res = await api.post('/wishlist/toggle', { product_id: product.id });
      setWishlisted(res.data.action === 'added');
      toast.success(res.data.action === 'added' ? 'Added to wishlist' : 'Removed');
    } catch { toast.error('Failed'); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Sign in to leave a review'); return; }
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { product_id: product.id, ...review });
      toast.success('Review submitted! It will appear after approval.');
      setReview({ rating: 5, title: '', body: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmittingReview(false); }
  };

  return (
    <>
      <Helmet>
        <title>{product.meta_title || product.name} — Janelux Beads</title>
        <meta name="description" content={product.meta_description || product.short_description} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description,
          brand: { '@type': 'Brand', name: 'Janelux Beads' },
          offers: { '@type': 'Offer', price: product.price, priceCurrency: 'NGN', availability: inStock ? 'InStock' : 'OutOfStock' },
        })}</script>
      </Helmet>

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-cream/30 mb-6">
          <Link to="/" className="hover:text-gold">Home</Link>
          <Icons.ChevronRight size={10} />
          <Link to="/shop" className="hover:text-gold">Shop</Link>
          {product.category_slug && (
            <><Icons.ChevronRight size={10} />
            <Link to={`/shop/${product.category_slug}`} className="hover:text-gold">{product.category_name}</Link></>
          )}
          <Icons.ChevronRight size={10} />
          <span className="text-cream/50 truncate max-w-[120px]">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Images */}
          <div>
            <div className="relative aspect-square bg-obsidian-light border border-obsidian-border overflow-hidden mb-3">
              <img
                src={getImageUrl(images[selectedImg]?.image_url)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.is_new && (
                <span className="absolute top-4 left-4 bg-gold text-obsidian text-[9px] font-bold tracking-widest uppercase px-2 py-0.5">NEW</span>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`w-16 h-16 shrink-0 border overflow-hidden transition-all ${selectedImg === i ? 'border-gold' : 'border-obsidian-border hover:border-gold/40'}`}
                  >
                    <img src={getImageUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.category_name && (
              <Link to={`/shop/${product.category_slug}`} className="text-[10px] tracking-widest uppercase text-gold/60 hover:text-gold transition-colors">{product.category_name}</Link>
            )}
            <h1 className="font-sans text-2xl md:text-3xl text-cream mt-1 font-medium leading-snug">{product.name}</h1>

            {/* Rating */}
            {parseFloat(product.avg_rating) > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Icons.Star key={s} size={14} filled={s <= Math.round(product.avg_rating)} className={s <= Math.round(product.avg_rating) ? 'text-gold' : 'text-cream/20'} />
                  ))}
                </div>
                <span className="text-cream/40 text-xs">({product.review_count} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className="font-sans text-2xl font-semibold text-cream">{formatPrice(product.price)}</span>
              {hasDiscount && <span className="text-cream/30 line-through text-sm">{formatPrice(product.compare_price)}</span>}
              {hasDiscount && <span className="text-terracotta text-xs font-bold tracking-widest uppercase">Save {Math.round((1 - product.price / product.compare_price) * 100)}%</span>}
            </div>

            {product.short_description && (
              <p className="text-cream/60 text-sm leading-relaxed mt-4 font-serif italic border-l-2 border-gold/30 pl-4">{product.short_description}</p>
            )}

            <div className="gold-divider" />

            {/* Stock status */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs tracking-widest uppercase text-cream/50">{inStock ? `In Stock (${product.stock_qty} available)` : 'Out of Stock'}</span>
            </div>

            {/* Qty + Add to cart */}
            {inStock && (
              <div className="flex gap-3 mb-4">
                <div className="flex items-center border border-obsidian-border">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-12 flex items-center justify-center text-cream/60 hover:text-gold transition-colors">
                    <Icons.Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-cream text-sm font-sans">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock_qty, q + 1))} className="w-10 h-12 flex items-center justify-center text-cream/60 hover:text-gold transition-colors">
                    <Icons.Plus size={14} />
                  </button>
                </div>
                <button onClick={handleAddToCart} className="btn-gold flex-1 flex items-center justify-center gap-2">
                  <Icons.Cart size={16} /> Add to Cart
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleWishlist} className={`flex-1 btn-outline flex items-center justify-center gap-2 ${wishlisted ? 'text-gold border-gold' : ''}`}>
                <Icons.Heart size={14} filled={wishlisted} />
                {wishlisted ? 'Saved' : 'Save to Wishlist'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-6 space-y-2">
              {[
                { icon: <Icons.Shield size={14} />, text: 'Authentic handcrafted piece' },
                { icon: <Icons.Truck size={14} />, text: 'Free delivery on orders over ₦50,000' },
                { icon: <Icons.RefreshCw size={14} />, text: '7-day return policy' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-cream/40 text-xs">
                  <span className="text-gold/50">{b.icon}</span>
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16 border-t border-obsidian-border">
          <div className="flex gap-0 border-b border-obsidian-border">
            {['description', 'reviews', 'care'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-4 text-xs tracking-widest uppercase transition-all border-b-2 -mb-px ${tab === t ? 'border-gold text-gold' : 'border-transparent text-cream/40 hover:text-cream/70'}`}
              >
                {t}{t === 'reviews' && product.review_count > 0 ? ` (${product.review_count})` : ''}
              </button>
            ))}
          </div>

          <div className="py-8 max-w-2xl">
            {tab === 'description' && (
              <div className="text-cream/60 text-sm leading-relaxed font-sans space-y-4">
                {product.description ? (
                  <p>{product.description}</p>
                ) : (
                  <p className="text-cream/30 italic">No description available.</p>
                )}
              </div>
            )}

            {tab === 'reviews' && (
              <div>
                {product.reviews?.length > 0 ? (
                  <ul className="space-y-6 mb-10">
                    {product.reviews.map(r => (
                      <li key={r.id} className="border-b border-obsidian-border pb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-sans text-sm text-cream">{r.full_name}</span>
                          <span className="text-cream/30 text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex mb-2">
                          {[1,2,3,4,5].map(s => <Icons.Star key={s} size={12} filled={s <= r.rating} className={s <= r.rating ? 'text-gold' : 'text-cream/20'} />)}
                        </div>
                        {r.title && <p className="text-cream/80 text-sm font-semibold mb-1">{r.title}</p>}
                        <p className="text-cream/50 text-sm">{r.body}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-cream/30 text-sm mb-8">No reviews yet. Be the first!</p>
                )}

                {/* Review form */}
                {user && (
                  <form onSubmit={handleReview} className="border-t border-obsidian-border pt-8">
                    <h4 className="font-display text-xl text-cream tracking-wide mb-4">LEAVE A REVIEW</h4>
                    <div className="mb-4">
                      <label className="section-label text-xs mb-2">Your Rating</label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} type="button" onClick={() => setReview(r => ({ ...r, rating: s }))} className={s <= review.rating ? 'text-gold' : 'text-cream/20'}>
                            <Icons.Star size={24} filled={s <= review.rating} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Review title"
                      value={review.title}
                      onChange={e => setReview(r => ({ ...r, title: e.target.value }))}
                      className="input-dark mb-3"
                    />
                    <textarea
                      placeholder="Share your experience with this piece..."
                      value={review.body}
                      onChange={e => setReview(r => ({ ...r, body: e.target.value }))}
                      rows={4}
                      className="input-dark mb-4 resize-none"
                      required
                    />
                    <button type="submit" disabled={submittingReview} className="btn-gold disabled:opacity-50">
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {tab === 'care' && (
              <div className="text-cream/60 text-sm leading-relaxed space-y-3">
                <p>To keep your Janelux Beads piece looking its best:</p>
                <ul className="space-y-2 ml-4">
                  {['Store in a cool, dry place away from direct sunlight.', 'Avoid contact with water, perfumes and harsh chemicals.', 'Wipe gently with a soft, dry cloth after each use.', 'Store in the dust bag provided when not in use.', 'Handle with care — beads are hand-strung and delicate.'].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Icons.Check size={14} className="text-gold/50 mt-0.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {product.related?.length > 0 && (
          <div className="mt-16 border-t border-obsidian-border pt-12">
            <div className="mb-8">
              <span className="section-label">You May Also Like</span>
              <h3 className="font-display text-3xl text-cream tracking-wide">RELATED PIECES</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {product.related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
