import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jlx_cart') || '[]'); } catch { return []; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('jlx_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        toast.success('Cart updated');
        return prev.map(i => i.id === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock_qty || 99) } : i);
      }
      toast.success('Added to cart');
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.primary_image || product.image, slug: product.slug, stock_qty: product.stock_qty, quantity }];
    });
    setIsOpen(true);
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const updateQty = (id, quantity) => {
    if (quantity < 1) return removeItem(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
