import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Icons } from '../common/Icons';
import { formatPrice, getImageUrl } from '../../utils/api';

export default function CartDrawer() {
  const { items, removeItem, updateQty, total, count, isOpen, setIsOpen } = useCart();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-[95] w-full max-w-sm bg-obsidian-mid border-l border-obsidian-border flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-obsidian-border shrink-0">
          <div>
            <h2 className="font-display text-xl tracking-widest text-cream">YOUR CART</h2>
            {count > 0 && <p className="text-[10px] text-gold/60 tracking-widest uppercase">{count} item{count !== 1 ? 's' : ''}</p>}
          </div>
          <button onClick={() => setIsOpen(false)} className="text-cream/60 hover:text-gold p-1">
            <Icons.Close size={22} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-16">
              <Icons.Cart size={48} className="text-cream/10 mb-4" />
              <p className="font-display text-2xl text-cream/30 tracking-widest">EMPTY</p>
              <p className="text-cream/30 text-sm mt-2 font-serif italic">Your cart is waiting to be filled</p>
              <button onClick={() => setIsOpen(false)} className="btn-outline mt-6 text-xs">
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4 border-b border-obsidian-border last:border-0">
                  <Link to={`/product/${item.slug}`} onClick={() => setIsOpen(false)} className="w-20 h-20 shrink-0 bg-obsidian overflow-hidden">
                    <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.slug}`} onClick={() => setIsOpen(false)} className="font-sans text-sm text-cream hover:text-gold transition-colors line-clamp-2 leading-snug">
                      {item.name}
                    </Link>
                    <p className="text-gold text-sm font-semibold mt-1">{formatPrice(item.price)}</p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-6 h-6 border border-obsidian-border text-cream/60 hover:border-gold hover:text-gold flex items-center justify-center transition-colors">
                        <Icons.Minus size={12} />
                      </button>
                      <span className="text-cream text-sm w-5 text-center font-sans">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-6 h-6 border border-obsidian-border text-cream/60 hover:border-gold hover:text-gold flex items-center justify-center transition-colors">
                        <Icons.Plus size={12} />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="ml-2 text-cream/30 hover:text-terracotta transition-colors">
                        <Icons.Trash size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-5 border-t border-obsidian-border bg-obsidian shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="font-sans text-xs tracking-widest uppercase text-cream/50">Subtotal</span>
              <span className="font-sans text-lg font-semibold text-cream">{formatPrice(total)}</span>
            </div>
            <p className="text-cream/30 text-[10px] tracking-wider text-center mb-4">Shipping & taxes calculated at checkout</p>
            <Link to="/checkout" onClick={() => setIsOpen(false)} className="btn-gold w-full flex items-center justify-center gap-2">
              Checkout <Icons.ArrowRight size={16} />
            </Link>
            <button onClick={() => setIsOpen(false)} className="w-full text-center text-cream/40 text-xs tracking-widest uppercase mt-3 py-2 hover:text-gold transition-colors">
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
