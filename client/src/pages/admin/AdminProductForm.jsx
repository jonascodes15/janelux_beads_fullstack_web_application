import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Icons } from '../../components/common/Icons';
import { getImageUrl } from '../../utils/api';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', description: '', short_description: '', price: '',
  compare_price: '', stock_qty: 0, category_id: '', is_featured: false,
  is_new: true, is_active: true, meta_title: '', meta_description: '',
};

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]); // [{url, uploading}]
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data.categories || []));

    if (isEdit) {
      // Fetch product by id via slug — we need to fetch by id; use admin route
      // We'll load all products and find by id
      api.get(`/products?limit=200`).then(res => {
        const found = res.data.products?.find(p => String(p.id) === String(id));
        if (found) {
          setForm({
            name: found.name || '',
            description: found.description || '',
            short_description: found.short_description || '',
            price: found.price || '',
            compare_price: found.compare_price || '',
            stock_qty: found.stock_qty || 0,
            category_id: found.category_id || '',
            is_featured: found.is_featured || false,
            is_new: found.is_new !== false,
            is_active: found.is_active !== false,
            meta_title: found.meta_title || '',
            meta_description: found.meta_description || '',
          });
          // Load images from product detail
          api.get(`/products/${found.slug}`).then(r => {
            const imgs = r.data.product?.images?.map(i => ({ url: i.image_url, uploading: false })) || [];
            setImages(imgs);
          });
        }
      }).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const update = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
  };

  const handleImageUpload = async (files) => {
    const toUpload = Array.from(files).slice(0, 5 - images.length);
    if (!toUpload.length) return;

    // Add placeholders
    const placeholders = toUpload.map(() => ({ url: '', uploading: true }));
    setImages(prev => [...prev, ...placeholders]);

    let successCount = 0;
    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await api.post('/upload/product-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) {
          setImages(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(img => img.uploading);
            if (idx !== -1) copy[idx] = { url: res.data.url, uploading: false };
            return copy;
          });
          successCount++;
          toast.success(`Image uploaded (${res.data.reduction_percent}% smaller)`);
        }
      } catch (err) {
        setImages(prev => prev.filter(img => !img.uploading || prev.indexOf(img) !== prev.findIndex(x => x.uploading)));
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    if (images.some(i => i.uploading)) { toast.error('Please wait for images to finish uploading'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
        stock_qty: parseInt(form.stock_qty) || 0,
        category_id: form.category_id || null,
        images: images.filter(i => i.url).map(i => i.url),
      };

      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created!');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="shimmer h-96" />;

  return (
    <>
      <Helmet><title>{isEdit ? 'Edit Product' : 'New Product'} — Janelux Admin</title></Helmet>

      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/admin/products')} className="text-cream/40 hover:text-gold transition-colors">
          <Icons.ChevronLeft size={22} />
        </button>
        <div>
          <span className="section-label">{isEdit ? 'Editing' : 'New'}</span>
          <h1 className="font-display text-4xl text-cream tracking-wide">{isEdit ? 'EDIT PRODUCT' : 'ADD PRODUCT'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">
        {/* Main fields */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic info */}
          <div className="bg-obsidian-light border border-obsidian-border p-6">
            <h3 className="font-display text-lg text-cream tracking-widest mb-4">PRODUCT DETAILS</h3>
            <div className="space-y-4">
              <div>
                <label className="section-label text-[10px]">Product Name *</label>
                <input value={form.name} onChange={update('name')} className="input-dark" placeholder="e.g. Midnight Garden Beaded Clutch" required />
              </div>
              <div>
                <label className="section-label text-[10px]">Short Description</label>
                <input value={form.short_description} onChange={update('short_description')} className="input-dark" placeholder="Brief tagline shown on product cards" maxLength={500} />
              </div>
              <div>
                <label className="section-label text-[10px]">Full Description</label>
                <textarea value={form.description} onChange={update('description')} className="input-dark resize-none" rows={6} placeholder="Detailed product description, materials, dimensions, crafting process..." />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-obsidian-light border border-obsidian-border p-6">
            <h3 className="font-display text-lg text-cream tracking-widest mb-2">PRODUCT IMAGES</h3>
            <p className="text-cream/30 text-xs mb-4">Up to 5 images. Auto-compressed to WebP for performance.</p>

            <div
              className="border-2 border-dashed border-obsidian-border hover:border-gold/40 transition-colors p-8 text-center cursor-pointer mb-4"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleImageUpload(e.dataTransfer.files); }}
            >
              <Icons.Upload size={32} className="text-cream/20 mx-auto mb-3" />
              <p className="text-cream/40 text-sm">Drop images here or <span className="text-gold">click to upload</span></p>
              <p className="text-cream/20 text-xs mt-1">JPEG, PNG, WebP — Max 10MB each</p>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square bg-obsidian border border-obsidian-border overflow-hidden">
                    {img.uploading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
                        {i === 0 && <span className="absolute top-1 left-1 bg-gold text-obsidian text-[8px] px-1 font-bold">MAIN</span>}
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-obsidian/80 text-cream/70 hover:text-terracotta w-6 h-6 flex items-center justify-center transition-colors"
                        >
                          <Icons.Close size={12} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="bg-obsidian-light border border-obsidian-border p-6">
            <h3 className="font-display text-lg text-cream tracking-widest mb-4">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="section-label text-[10px]">Meta Title</label>
                <input value={form.meta_title} onChange={update('meta_title')} className="input-dark" placeholder="Leave blank to use product name" />
              </div>
              <div>
                <label className="section-label text-[10px]">Meta Description</label>
                <textarea value={form.meta_description} onChange={update('meta_description')} className="input-dark resize-none" rows={3} placeholder="Brief SEO description (max 160 chars)" maxLength={160} />
                <p className="text-cream/20 text-[10px] mt-1">{form.meta_description.length}/160</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-obsidian-light border border-obsidian-border p-6">
            <h3 className="font-display text-lg text-cream tracking-widest mb-4">PRICING</h3>
            <div className="space-y-4">
              <div>
                <label className="section-label text-[10px]">Price (₦) *</label>
                <input type="number" value={form.price} onChange={update('price')} className="input-dark" placeholder="0.00" min="0" step="50" required />
              </div>
              <div>
                <label className="section-label text-[10px]">Compare Price (₦)</label>
                <input type="number" value={form.compare_price} onChange={update('compare_price')} className="input-dark" placeholder="Original price (shows strikethrough)" min="0" step="50" />
              </div>
              <div>
                <label className="section-label text-[10px]">Stock Quantity</label>
                <input type="number" value={form.stock_qty} onChange={update('stock_qty')} className="input-dark" min="0" />
              </div>
            </div>
          </div>

          {/* Organisation */}
          <div className="bg-obsidian-light border border-obsidian-border p-6">
            <h3 className="font-display text-lg text-cream tracking-widest mb-4">ORGANISATION</h3>
            <div className="space-y-4">
              <div>
                <label className="section-label text-[10px]">Category</label>
                <select value={form.category_id} onChange={update('category_id')} className="input-dark">
                  <option value="">— No Category —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-obsidian">{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                {[
                  { field: 'is_active', label: 'Visible in store' },
                  { field: 'is_featured', label: 'Featured on homepage' },
                  { field: 'is_new', label: 'Show "NEW" badge' },
                ].map(({ field, label }) => (
                  <label key={field} className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setForm(f => ({ ...f, [field]: !f[field] }))}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${form[field] ? 'bg-gold' : 'bg-obsidian-border'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form[field] ? 'left-5' : 'left-0.5'}`} />
                    </div>
                    <span className="text-cream/60 text-xs">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button type="submit" disabled={saving} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <><div className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" /> Saving...</> : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
            <button type="button" onClick={() => navigate('/admin/products')} className="btn-outline w-full">Cancel</button>
          </div>
        </div>
      </form>
    </>
  );
}
