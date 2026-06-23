// CartPage.jsx
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Icons } from '../components/common/Icons';
import { formatPrice, getImageUrl } from '../utils/api';

export function CartPage() {
  const { items, removeItem, updateQty, total, clearCart } = useCart();

  if (items.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <Icons.Cart size={80} className="text-cream/10 mb-6" />
      <h2 className="font-display text-5xl text-cream/30 tracking-widest">YOUR CART IS EMPTY</h2>
      <p className="text-cream/30 text-sm mt-3 mb-8 font-serif italic">Discover our handcrafted pieces</p>
      <Link to="/shop" className="btn-gold">Shop Now</Link>
    </div>
  );

  const shipping = total >= 50000 ? 0 : 3000;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl md:text-5xl text-cream tracking-wide">YOUR CART</h1>
        <button onClick={clearCart} className="text-cream/30 hover:text-terracotta text-xs tracking-widest uppercase transition-colors">Clear All</button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Items */}
        <div className="md:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="flex gap-4 p-4 bg-obsidian-light border border-obsidian-border">
              <Link to={`/product/${item.slug}`} className="w-24 h-24 shrink-0 bg-obsidian overflow-hidden">
                <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1">
                <Link to={`/product/${item.slug}`} className="font-sans text-sm text-cream hover:text-gold transition-colors">{item.name}</Link>
                <p className="text-gold font-semibold mt-1">{formatPrice(item.price)}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-obsidian-border">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-cream/60 hover:text-gold">
                      <Icons.Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm text-cream">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-cream/60 hover:text-gold">
                      <Icons.Plus size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-cream font-semibold text-sm">{formatPrice(item.price * item.quantity)}</span>
                    <button onClick={() => removeItem(item.id)} className="text-cream/30 hover:text-terracotta transition-colors">
                      <Icons.Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-obsidian-light border border-obsidian-border p-6 h-fit">
          <h3 className="font-display text-xl text-cream tracking-widest mb-6">ORDER SUMMARY</h3>
          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between text-cream/60">
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-cream/60">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-gold">Free</span> : formatPrice(shipping)}</span>
            </div>
            {total < 50000 && (
              <p className="text-xs text-gold/60 italic">Add {formatPrice(50000 - total)} more for free shipping</p>
            )}
          </div>
          <div className="border-t border-obsidian-border pt-4 mb-6">
            <div className="flex justify-between text-cream font-semibold">
              <span>Total</span>
              <span className="text-lg">{formatPrice(total + shipping)}</span>
            </div>
          </div>
          <Link to="/checkout" className="btn-gold w-full flex items-center justify-center gap-2">
            Proceed to Checkout <Icons.ArrowRight size={16} />
          </Link>
          <Link to="/shop" className="block text-center text-cream/30 hover:text-gold text-xs tracking-widest uppercase mt-4 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
