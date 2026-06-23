// OrderConfirmPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Icons } from '../components/common/Icons';
import { formatPrice } from '../utils/api';
import api from '../utils/api';

export default function OrderConfirmPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${orderNumber}`).then(res => setOrder(res.data.order)).catch(() => {});
  }, [orderNumber]);

  return (
    <>
      <Helmet><title>Order Confirmed — Janelux Beads</title></Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          {/* Success animation */}
          <div className="w-20 h-20 border-2 border-gold rounded-full flex items-center justify-center mx-auto mb-8 animate-fade-in">
            <Icons.Check size={36} className="text-gold" />
          </div>

          <span className="section-label justify-center flex">Thank You!</span>
          <h1 className="font-display text-4xl md:text-5xl text-cream tracking-wide mb-4">ORDER CONFIRMED</h1>
          <p className="text-cream/50 font-serif italic mb-2">Your handcrafted piece is being prepared with love.</p>

          <div className="bg-obsidian-light border border-gold/20 px-6 py-4 my-8">
            <p className="text-cream/40 text-xs tracking-widest uppercase mb-1">Order Number</p>
            <p className="font-display text-2xl text-gold tracking-widest">{orderNumber}</p>
          </div>

          {order && (
            <div className="bg-obsidian-light border border-obsidian-border p-6 text-left mb-8">
              <h3 className="font-display text-sm tracking-widest text-cream/50 mb-4">ORDER DETAILS</h3>
              <ul className="space-y-3">
                {order.items?.map(item => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-cream/70">{item.product_name} × {item.quantity}</span>
                    <span className="text-cream">{formatPrice(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-obsidian-border mt-4 pt-4 flex justify-between font-semibold">
                <span className="text-cream/70">Total</span>
                <span className="text-cream">{formatPrice(order.total)}</span>
              </div>
              <p className="text-cream/40 text-xs mt-4">
                Shipping to: {order.shipping_address}, {order.shipping_city}, {order.shipping_state}
              </p>
            </div>
          )}

          <p className="text-cream/40 text-sm mb-8">A confirmation email has been sent to {order?.shipping_email}.</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/shop" className="btn-gold">Continue Shopping</Link>
            <Link to="/account" className="btn-outline">View My Orders</Link>
          </div>
        </div>
      </div>
    </>
  );
}
