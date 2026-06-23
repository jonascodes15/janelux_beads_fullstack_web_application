import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Icons } from '../../components/common/Icons';
import { formatPrice } from '../../utils/api';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ─── Shared admin table wrapper ───────────────────────────────────
function AdminPage({ title, subtitle, action, children }) {
  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="section-label">{subtitle || 'Manage'}</span>
          <h1 className="font-display text-4xl text-cream tracking-wide">{title.toUpperCase()}</h1>
        </div>
        {action}
      </div>
      {children}
    </>
  );
}

// ─── Modal ────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-obsidian-mid border border-obsidian-border w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-obsidian-border">
          <h3 className="font-display text-xl text-cream tracking-widest">{title.toUpperCase()}</h3>
          <button onClick={onClose} className="text-cream/40 hover:text-gold"><Icons.Close size={20} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── AdminCategories ──────────────────────────────────────────────
export function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | category object
  const [form, setForm] = useState({ name: '', description: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const r = await api.get('/categories'); setCategories(r.data.categories || []); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openEdit = (cat) => { setForm({ name: cat.name, description: cat.description || '', sort_order: cat.sort_order || 0 }); setModal(cat); };
  const openAdd = () => { setForm({ name: '', description: '', sort_order: categories.length }); setModal('add'); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.post('/categories', form);
        toast.success('Category created');
      } else {
        await api.put(`/categories/${modal.id}`, { ...form, is_active: true });
        toast.success('Category updated');
      }
      setModal(null);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/categories/${id}`);
    toast.success('Deleted');
    fetch();
  };

  return (
    <>
      <Helmet><title>Categories — Janelux Admin</title></Helmet>
      <AdminPage title="Categories" action={
        <button onClick={openAdd} className="btn-gold flex items-center gap-2"><Icons.Plus size={16} /> Add Category</button>
      }>
        <div className="bg-obsidian-light border border-obsidian-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-obsidian-border">
              {['Name', 'Products', 'Order', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[10px] tracking-widest uppercase text-cream/30 font-normal">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={4} className="px-5 py-3"><div className="shimmer h-4" /></td></tr>) :
                categories.map(cat => (
                  <tr key={cat.id} className="border-b border-obsidian-border hover:bg-obsidian transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-cream text-xs font-medium">{cat.name}</p>
                      {cat.description && <p className="text-cream/30 text-[10px] mt-0.5 line-clamp-1">{cat.description}</p>}
                    </td>
                    <td className="px-5 py-3 text-cream/50 text-xs">{cat.product_count || 0}</td>
                    <td className="px-5 py-3 text-cream/50 text-xs">{cat.sort_order}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(cat)} className="text-cream/30 hover:text-gold p-1"><Icons.Edit size={15} /></button>
                        <button onClick={() => remove(cat.id)} className="text-cream/30 hover:text-terracotta p-1"><Icons.Trash size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </AdminPage>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Category' : 'Edit Category'} onClose={() => setModal(null)}>
          <form onSubmit={save} className="space-y-4">
            <div><label className="section-label text-[10px]">Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-dark" required /></div>
            <div><label className="section-label text-[10px]">Description</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-dark" /></div>
            <div><label className="section-label text-[10px]">Sort Order</label><input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="input-dark" /></div>
            <button type="submit" disabled={saving} className="btn-gold w-full">{saving ? 'Saving...' : 'Save'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}

// ─── AdminCustomers ───────────────────────────────────────────────
export function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/customers').then(r => setCustomers(r.data.customers || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet><title>Customers — Janelux Admin</title></Helmet>
      <AdminPage title="Customers" subtitle={`${customers.length} registered`}>
        <div className="bg-obsidian-light border border-obsidian-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-obsidian-border">
                {['Name', 'Email', 'Orders', 'Spent', 'Verified', 'Joined'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] tracking-widest uppercase text-cream/30 font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="shimmer h-4" /></td></tr>) :
                  customers.map(c => (
                    <tr key={c.id} className="border-b border-obsidian-border hover:bg-obsidian transition-colors">
                      <td className="px-4 py-3 text-cream font-medium">{c.full_name}</td>
                      <td className="px-4 py-3 text-cream/60">{c.email}</td>
                      <td className="px-4 py-3 text-cream/60">{c.order_count}</td>
                      <td className="px-4 py-3 text-gold font-semibold">{formatPrice(c.total_spent)}</td>
                      <td className="px-4 py-3"><span className={c.is_verified ? 'text-green-400' : 'text-red-400'}>{c.is_verified ? '✓' : '✗'}</span></td>
                      <td className="px-4 py-3 text-cream/30">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminPage>
    </>
  );
}

// ─── AdminCoupons ─────────────────────────────────────────────────
export function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', min_order_amount: 0, max_uses: '', expires_at: '' });
  const [saving, setSaving] = useState(false);

  const fetch = () => { setLoading(true); api.get('/admin/coupons').then(r => setCoupons(r.data.coupons || [])).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditing(null); setForm({ code: '', type: 'percentage', value: '', min_order_amount: 0, max_uses: '', expires_at: '' }); setModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ code: c.code, type: c.type, value: c.value, min_order_amount: c.min_order_amount, max_uses: c.max_uses || '', expires_at: c.expires_at ? c.expires_at.split('T')[0] : '' }); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, value: parseFloat(form.value), min_order_amount: parseFloat(form.min_order_amount) || 0, max_uses: form.max_uses ? parseInt(form.max_uses) : null, expires_at: form.expires_at || null };
      if (editing) { await api.put(`/admin/coupons/${editing.id}`, { ...payload, is_active: editing.is_active }); toast.success('Coupon updated'); }
      else { await api.post('/admin/coupons', payload); toast.success('Coupon created'); }
      setModal(false);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    await api.delete(`/admin/coupons/${id}`);
    toast.success('Deleted');
    fetch();
  };

  return (
    <>
      <Helmet><title>Coupons — Janelux Admin</title></Helmet>
      <AdminPage title="Coupons" action={<button onClick={openAdd} className="btn-gold flex items-center gap-2"><Icons.Plus size={16} /> New Coupon</button>}>
        <div className="bg-obsidian-light border border-obsidian-border overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-obsidian-border">
              {['Code', 'Discount', 'Min Order', 'Used', 'Expires', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] tracking-widest uppercase text-cream/30 font-normal whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="shimmer h-4" /></td></tr>) :
                coupons.map(c => (
                  <tr key={c.id} className="border-b border-obsidian-border hover:bg-obsidian transition-colors">
                    <td className="px-4 py-3 font-mono text-gold font-bold tracking-widest">{c.code}</td>
                    <td className="px-4 py-3 text-cream">{c.type === 'percentage' ? `${c.value}%` : formatPrice(c.value)}</td>
                    <td className="px-4 py-3 text-cream/60">{c.min_order_amount > 0 ? formatPrice(c.min_order_amount) : '—'}</td>
                    <td className="px-4 py-3 text-cream/60">{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                    <td className="px-4 py-3 text-cream/60">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}</td>
                    <td className="px-4 py-3"><span className={c.is_active ? 'text-green-400' : 'text-red-400'}>{c.is_active ? 'Active' : 'Disabled'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-cream/30 hover:text-gold p-1"><Icons.Edit size={15} /></button>
                        <button onClick={() => remove(c.id)} className="text-cream/30 hover:text-terracotta p-1"><Icons.Trash size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </AdminPage>

      {modal && (
        <Modal title={editing ? 'Edit Coupon' : 'New Coupon'} onClose={() => setModal(false)}>
          <form onSubmit={save} className="space-y-4">
            <div><label className="section-label text-[10px]">Code *</label><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="input-dark font-mono tracking-widest" placeholder="SUMMER20" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="section-label text-[10px]">Type</label><select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-dark"><option value="percentage" className="bg-obsidian">Percentage (%)</option><option value="fixed" className="bg-obsidian">Fixed Amount (₦)</option></select></div>
              <div><label className="section-label text-[10px]">Value *</label><input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} className="input-dark" placeholder={form.type === 'percentage' ? '10' : '5000'} required min="0" /></div>
            </div>
            <div><label className="section-label text-[10px]">Min Order (₦)</label><input type="number" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} className="input-dark" min="0" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="section-label text-[10px]">Max Uses</label><input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} className="input-dark" placeholder="Unlimited" min="1" /></div>
              <div><label className="section-label text-[10px]">Expires</label><input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className="input-dark" /></div>
            </div>
            <button type="submit" disabled={saving} className="btn-gold w-full">{saving ? 'Saving...' : 'Save Coupon'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}

// ─── AdminReviews ─────────────────────────────────────────────────
export function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => { setLoading(true); api.get('/reviews/pending').then(r => setReviews(r.data.reviews || [])).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const approve = async (id) => {
    await api.patch(`/reviews/${id}/approve`);
    setReviews(prev => prev.filter(r => r.id !== id));
    toast.success('Review approved');
  };

  const remove = async (id) => {
    await api.delete(`/reviews/${id}`);
    setReviews(prev => prev.filter(r => r.id !== id));
    toast.success('Review deleted');
  };

  return (
    <>
      <Helmet><title>Reviews — Janelux Admin</title></Helmet>
      <AdminPage title="Reviews" subtitle={`${reviews.length} pending approval`}>
        {loading ? <div className="shimmer h-48" /> : reviews.length === 0 ? (
          <div className="text-center py-16 bg-obsidian-light border border-obsidian-border">
            <Icons.Star size={48} className="text-cream/10 mx-auto mb-4" />
            <p className="text-cream/30 text-sm">No pending reviews</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="bg-obsidian-light border border-obsidian-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-cream text-sm font-medium">{r.full_name}</p>
                    <p className="text-cream/40 text-xs">{r.product_name}</p>
                    <div className="flex mt-1">{[1,2,3,4,5].map(s => <Icons.Star key={s} size={12} filled={s <= r.rating} className={s <= r.rating ? 'text-gold' : 'text-cream/20'} />)}</div>
                  </div>
                  <span className="text-cream/30 text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.title && <p className="text-cream text-sm font-semibold mb-1">{r.title}</p>}
                <p className="text-cream/60 text-sm mb-4">{r.body}</p>
                <div className="flex gap-3">
                  <button onClick={() => approve(r.id)} className="btn-gold flex items-center gap-2 py-2 px-4 text-xs"><Icons.Check size={14} /> Approve</button>
                  <button onClick={() => remove(r.id)} className="btn-outline flex items-center gap-2 py-2 px-4 text-xs text-terracotta border-terracotta/30 hover:bg-terracotta hover:text-cream"><Icons.Trash size={14} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPage>
    </>
  );
}

// ─── AdminNewsletter ──────────────────────────────────────────────
export function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/newsletter/subscribers').then(r => setSubscribers(r.data.subscribers || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet><title>Newsletter — Janelux Admin</title></Helmet>
      <AdminPage title="Newsletter" subtitle={`${subscribers.length} active subscribers`}>
        <div className="bg-obsidian-light border border-obsidian-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-obsidian-border">
                {['Email', 'Subscribed On'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] tracking-widest uppercase text-cream/30 font-normal">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={2} className="px-5 py-3"><div className="shimmer h-4" /></td></tr>) :
                  subscribers.length === 0 ? <tr><td colSpan={2} className="px-5 py-8 text-center text-cream/20">No subscribers yet</td></tr> :
                  subscribers.map(s => (
                    <tr key={s.id} className="border-b border-obsidian-border hover:bg-obsidian transition-colors">
                      <td className="px-5 py-3 text-cream/70">{s.email}</td>
                      <td className="px-5 py-3 text-cream/30">{new Date(s.subscribed_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminPage>
    </>
  );
}

// ─── AdminSettings ────────────────────────────────────────────────
export function AdminSettings() {
  const [password, setPassword] = useState({ current: '', newPass: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    if (password.newPass !== password.confirm) { toast.error('Passwords do not match'); return; }
    if (password.newPass.length < 8) { toast.error('Min 8 characters'); return; }
    setSaving(true);
    try {
      toast.success('Password updated! (Connect to backend endpoint to make this functional)');
      setPassword({ current: '', newPass: '', confirm: '' });
    } finally { setSaving(false); }
  };

  return (
    <>
      <Helmet><title>Settings — Janelux Admin</title></Helmet>
      <AdminPage title="Settings">
        <div className="max-w-md space-y-8">
          {/* Change password */}
          <div className="bg-obsidian-light border border-obsidian-border p-6">
            <h3 className="font-display text-xl text-cream tracking-widest mb-4">CHANGE PASSWORD</h3>
            <form onSubmit={changePassword} className="space-y-4">
              <div><label className="section-label text-[10px]">Current Password</label><input type="password" value={password.current} onChange={e => setPassword(p => ({ ...p, current: e.target.value }))} className="input-dark" required /></div>
              <div><label className="section-label text-[10px]">New Password</label><input type="password" value={password.newPass} onChange={e => setPassword(p => ({ ...p, newPass: e.target.value }))} className="input-dark" minLength={8} required /></div>
              <div><label className="section-label text-[10px]">Confirm New Password</label><input type="password" value={password.confirm} onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))} className="input-dark" required /></div>
              <button type="submit" disabled={saving} className="btn-gold">{saving ? 'Saving...' : 'Update Password'}</button>
            </form>
          </div>

          {/* Info */}
          <div className="bg-obsidian-light border border-obsidian-border p-6">
            <h3 className="font-display text-xl text-cream tracking-widest mb-4">SYSTEM INFO</h3>
            <div className="space-y-2 text-xs text-cream/50">
              {[['Store', 'Janelux Beads'], ['Version', '1.0.0'], ['Currency', 'NGN (₦)'], ['Payment', 'Paystack'], ['Email', 'Resend API']].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-cream/30 tracking-widest uppercase">{k}</span><span>{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      </AdminPage>
    </>
  );
}

export default AdminCategories;
