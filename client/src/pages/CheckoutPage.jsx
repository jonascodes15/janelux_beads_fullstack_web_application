import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Icons } from '../components/common/Icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, getImageUrl } from '../utils/api';
import api from '../utils/api';
import toast from 'react-hot-toast';

const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: 'Lagos',
    country: 'Nigeria',
  });
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const shipping = total >= 50000 ? 0 : 3000;
  const discount = coupon ? coupon.discount : 0;
  const grandTotal = total + shipping - discount;

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post('/admin/validate-coupon', { code: couponCode, subtotal: total });
      if (res.data.success) {
        setCoupon(res.data);
        toast.success(`Coupon applied! You save ${formatPrice(res.data.discount)}`);
      } else {
        toast.error(res.data.message);
        setCoupon(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      setCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePaystack = async () => {
    if (!form.name || !form.email || !form.phone || !form.address || !form.city) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    setProcessing(true);

    // Load Paystack inline
    const PaystackPop = (await import('@paystack/inline-js')).default;
    const handler = PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: form.email,
      amount: grandTotal * 100, // kobo
      currency: 'NGN',
      ref: `JLX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      metadata: { custom_fields: [{ display_name: 'Customer Name', variable_name: 'customer_name', value: form.name }] },

      onSuccess: async (response) => {
        try {
          // Verify payment server-side
          await api.post('/payment/verify', { reference: response.reference });

          // Create order
          const orderRes = await api.post('/orders', {
            items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
            shipping: form,
            coupon_code: coupon ? couponCode : null,
            paystack_reference: response.reference,
          });

          clearCart();
          navigate(`/order-confirmed/${orderRes.data.order_number}`);
        } catch (err) {
          toast.error('Payment received but order creation failed. Please contact us with your reference: ' + response.reference);
        } finally {
          setProcessing(false);
        }
      },

      onCancel: () => {
        toast.error('Payment cancelled');
        setProcessing(false);
      },
    });

    handler.openIframe();
  };

  if (items.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h2 className="font-display text-4xl text-cream/30 tracking-widest">YOUR CART IS EMPTY</h2>
      <Link to="/shop" className="btn-gold mt-6">Shop Now</Link>
    </div>
  );

  return (
    <>
      <Helmet><title>Checkout — Janelux Beads</title></Helmet>

      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <h1 className="font-display text-4xl md:text-5xl text-cream tracking-wide mb-10">CHECKOUT</h1>

        <div className="grid md:grid-cols-5 gap-10">
          {/* Form */}
          <div className="md:col-span-3 space-y-8">
            {/* Contact */}
            <section>
              <h3 className="font-display text-xl text-cream tracking-widest mb-4">CONTACT INFORMATION</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="section-label text-[10px]">Full Name *</label>
                  <input value={form.name} onChange={update('name')} className="input-dark" placeholder="Your full name" required />
                </div>
                <div>
                  <label className="section-label text-[10px]">Email *</label>
                  <input type="email" value={form.email} onChange={update('email')} className="input-dark" placeholder="email@example.com" required />
                </div>
                <div>
                  <label className="section-label text-[10px]">Phone *</label>
                  <input type="tel" value={form.phone} onChange={update('phone')} className="input-dark" placeholder="080XXXXXXXX" required />
                </div>
              </div>
            </section>

            {/* Shipping */}
            <section>
              <h3 className="font-display text-xl text-cream tracking-widest mb-4">SHIPPING ADDRESS</h3>
              <div className="space-y-3">
                <div>
                  <label className="section-label text-[10px]">Street Address *</label>
                  <input value={form.address} onChange={update('address')} className="input-dark" placeholder="No 5, Bode Thomas Street" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="section-label text-[10px]">City *</label>
                    <input value={form.city} onChange={update('city')} className="input-dark" placeholder="Lagos" required />
                  </div>
                  <div>
                    <label className="section-label text-[10px]">State *</label>
                    <select value={form.state} onChange={update('state')} className="input-dark">
                      {NIGERIAN_STATES.map(s => <option key={s} value={s} className="bg-obsidian">{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Coupon */}
            <section>
              <h3 className="font-display text-xl text-cream tracking-widest mb-4">DISCOUNT CODE</h3>
              <div className="flex gap-0">
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  className="input-dark flex-1 uppercase tracking-widest"
                  placeholder="ENTER CODE"
                />
                <button onClick={validateCoupon} disabled={couponLoading} className="btn-outline whitespace-nowrap">
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {coupon && (
                <p className="text-gold text-xs mt-2 flex items-center gap-1">
                  <Icons.Check size={12} /> Coupon applied — saving {formatPrice(discount)}
                </p>
              )}
            </section>
          </div>

          {/* Order summary */}
          <div className="md:col-span-2">
            <div className="bg-obsidian-light border border-obsidian-border p-6 sticky top-24">
              <h3 className="font-display text-xl text-cream tracking-widest mb-6">ORDER SUMMARY</h3>

              {/* Items */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 bg-obsidian shrink-0 relative overflow-hidden">
                      <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                      <span className="absolute -top-1 -right-1 bg-gold text-obsidian text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-cream text-xs line-clamp-1">{item.name}</p>
                    </div>
                    <span className="text-cream text-xs shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-obsidian-border pt-4 space-y-2 text-sm mb-6">
                <div className="flex justify-between text-cream/60"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
                <div className="flex justify-between text-cream/60"><span>Shipping</span><span>{shipping === 0 ? <span className="text-gold">Free</span> : formatPrice(shipping)}</span></div>
                {discount > 0 && <div className="flex justify-between text-gold"><span>Discount</span><span>-{formatPrice(discount)}</span></div>}
                <div className="border-t border-obsidian-border pt-3 flex justify-between text-cream font-semibold text-base">
                  <span>Total</span><span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={handlePaystack}
                disabled={processing}
                className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing
                  ? <><div className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" /> Processing...</>
                  : <><Icons.Shield size={16} /> Pay {formatPrice(grandTotal)}</>}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-cream/30 text-[10px] tracking-widest">
                <Icons.Shield size={10} />
                <span>Secured by Paystack</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
