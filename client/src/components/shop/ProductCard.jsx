import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../common/Icons';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice, getImageUrl } from '../../utils/api';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ProductCard({ product, className = '' }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const imgSrc = getImageUrl(product.primary_image || product.image);
  const inStock = !product.stock_qty || product.stock_qty > 0;
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.compare_price) * 100) : 0;

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Sign in to save to wishlist'); return; }
    try {
      const res = await api.post('/wishlist/toggle', { product_id: product.id });
      setWishlisted(res.data.action === 'added');
      toast.success(res.data.action === 'added' ? 'Added to wishlist' : 'Removed from wishlist');
    } catch { toast.error('Failed'); }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!inStock) return;
    addItem(product);
  };

  return (
    <div className={`card-product ${className}`}>
      <Link to={`/product/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-square bg-obsidian overflow-hidden">
          {!imgLoaded && <div className="absolute inset-0 shimmer" />}
          <img
            src={imgSrc}
            alt={product.name}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.is_new && (
              <span className="bg-gold text-obsidian text-[9px] font-bold tracking-widest uppercase px-2 py-0.5">NEW</span>
            )}
            {hasDiscount && (
              <span className="bg-terracotta text-cream text-[9px] font-bold tracking-widest uppercase px-2 py-0.5">-{discountPct}%</span>
            )}
            {!inStock && (
              <span className="bg-obsidian-light border border-obsidian-border text-cream/50 text-[9px] tracking-widest uppercase px-2 py-0.5">Sold Out</span>
            )}
          </div>

          {/* Wishlist btn */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm border border-obsidian-border hover:border-gold/40 transition-all ${wishlisted ? 'text-gold' : 'text-cream/50'}`}
            aria-label="Wishlist"
          >
            <Icons.Heart size={14} filled={wishlisted} />
          </button>

          {/* Quick add overlay */}
          {inStock && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-0 left-0 right-0 bg-gold text-obsidian text-[10px] font-bold tracking-widest uppercase py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
            >
              Add to Cart
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {product.category_name && (
            <span className="text-[9px] tracking-widest uppercase text-gold/60 font-sans">{product.category_name}</span>
          )}
          <h3 className="font-sans text-sm text-cream mt-0.5 line-clamp-2 leading-snug">{product.name}</h3>

          {/* Rating */}
          {parseFloat(product.avg_rating) > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Icons.Star key={s} size={10} filled={s <= Math.round(product.avg_rating)} className={s <= Math.round(product.avg_rating) ? 'text-gold' : 'text-cream/20'} />
                ))}
              </div>
              <span className="text-[10px] text-cream/40">({product.review_count})</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className="font-sans text-sm font-semibold text-cream">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="font-sans text-xs text-cream/30 line-through">{formatPrice(product.compare_price)}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
