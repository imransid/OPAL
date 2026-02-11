import { useState, useEffect } from 'react';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../../lib/firestore';
import { jsonToProduct, type ProductJsonInput } from '../../lib/product-json';
import type { Product, Category } from '../../lib/types';

const defaultProduct: Omit<Product, 'id'> = {
  title: '',
  description: '',
  price: 0,
  thumb_src: '',
  stock: true,
  colors: [],
  sizes: {},
  sizePrices: {},
  images: [],
  resource: '',
};

export default function AdminProducts() {
  const [list, setList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>(defaultProduct);
  const [jsonInput, setJsonInput] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [jsonLongDesc, setJsonLongDesc] = useState('');
  const [jsonFeatures, setJsonFeatures] = useState('');
  const [jsonSpecs, setJsonSpecs] = useState('');
  const [jsonDelivery, setJsonDelivery] = useState('');
  /** Raw comma-separated strings so user can type commas; parsed on submit */
  const [colorsStr, setColorsStr] = useState('');
  const [sizesStr, setSizesStr] = useState('');
  const [sizePricesStr, setSizePricesStr] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [productsData, categoriesData] = await Promise.all([getProducts(), getCategories()]);
      setList(productsData);
      setCategories(categoriesData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const topLevel = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => c.parentId);

  const getCategoryLabel = (c: Category) => {
    if (!c.parentId) return c.title;
    const parent = categories.find((p) => p.id === c.parentId);
    return parent ? `${parent.title} › ${c.title}` : c.title;
  };

  const getCategoryTitle = (categoryId?: string) =>
    categoryId ? categories.find((c) => c.id === categoryId)?.title ?? categoryId : '—';

  useEffect(() => {
    load();
  }, []);

  const syncJsonFields = (f: Omit<Product, 'id'>) => {
    setJsonLongDesc(f.longDescription ? JSON.stringify(f.longDescription, null, 2) : '');
    setJsonFeatures(f.features && Array.isArray(f.features) ? JSON.stringify(f.features, null, 2) : '');
    setJsonSpecs(f.specifications ? JSON.stringify(f.specifications, null, 2) : '');
    setJsonDelivery(f.delivery ? JSON.stringify(f.delivery, null, 2) : '');
  };

  const openCreate = () => {
    setEditing(null);
    setForm(defaultProduct);
    setJsonInput('');
    setColorsStr('');
    setSizesStr('');
    setSizePricesStr('');
    syncJsonFields(defaultProduct);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description ?? '',
      shortDescription: p.shortDescription,
      full_description: p.full_description,
      longDescription: p.longDescription,
      details: p.details,
      price: p.price,
      discountPrice: p.discountPrice,
      currency: p.currency,
      thumb_src: p.thumb_src,
      thumb_alt: p.thumb_alt,
      images: p.images ?? [],
      color: p.color,
      colors: p.colors ?? [],
      stock: p.stock ?? true,
      rating: p.rating,
      reviews: p.reviews,
      size: p.size,
      sizes: p.sizes ?? {},
      sizePrices: p.sizePrices ?? {},
      highlights: p.highlights,
      features: p.features,
      data: p.data,
      specifications: p.specifications,
      featuresDetails: p.featuresDetails,
      brand: p.brand,
      model: p.model,
      slug: p.slug,
      resource: p.resource,
      delivery: p.delivery,
      status: p.status,
      categoryId: p.categoryId,
    });
    setColorsStr((p.colors ?? []).join(', '));
    setSizesStr(
      p.sizes && Object.keys(p.sizes).length > 0
        ? Object.entries(p.sizes)
          .map(([s, n]) => (n > 0 ? `${s}:${n}` : s))
          .join(', ')
        : ''
    );
    setSizePricesStr(
      p.sizePrices && Object.keys(p.sizePrices).length > 0
        ? Object.entries(p.sizePrices)
          .map(([s, pr]) => `${s}:${pr}`)
          .join(', ')
        : ''
    );
    syncJsonFields({
      ...p,
      longDescription: p.longDescription,
      features: p.features,
      specifications: p.specifications,
      delivery: p.delivery,
    } as Omit<Product, 'id'>);
  };

  const handleImportJson = () => {
    setError('');
    try {
      const parsed = JSON.parse(jsonInput) as ProductJsonInput;
      const mapped = jsonToProduct(parsed);
      const next = { ...form, ...mapped };
      setForm(next);
      setColorsStr((next.colors ?? []).join(', '));
      setSizesStr(
        next.sizes && Object.keys(next.sizes).length > 0
          ? Object.entries(next.sizes)
            .map(([s, n]) => (n > 0 ? `${s}:${n}` : s))
            .join(', ')
          : ''
      );
      syncJsonFields(next);
      setShowImport(false);
    } catch (e) {
      setError('Invalid JSON: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const merged = { ...form };
    try {
      if (jsonLongDesc.trim()) merged.longDescription = JSON.parse(jsonLongDesc);
      if (jsonFeatures.trim()) merged.features = JSON.parse(jsonFeatures);
      if (jsonSpecs.trim()) merged.specifications = JSON.parse(jsonSpecs);
      if (jsonDelivery.trim()) merged.delivery = JSON.parse(jsonDelivery);
    } catch (err) {
      setError('Invalid JSON in one of the fields: ' + (err instanceof Error ? err.message : String(err)));
      return;
    }
    // Parse comma-separated strings into colors and sizes (so user can type commas in the fields)
    merged.colors = colorsStr.split(',').map((s) => s.trim()).filter(Boolean);
    const parsedSizes: Record<string, number> = {};
    sizesStr.split(',').map((s) => s.trim()).filter(Boolean).forEach((part) => {
      const colon = part.indexOf(':');
      if (colon > 0) {
        const k = part.slice(0, colon).trim();
        const v = parseInt(part.slice(colon + 1).trim(), 10);
        parsedSizes[k] = Number.isNaN(v) ? 0 : v;
      } else {
        parsedSizes[part] = 0;
      }
    });
    merged.sizes = parsedSizes;
    const parsedSizePrices: Record<string, number> = {};
    sizePricesStr.split(',').map((s) => s.trim()).filter(Boolean).forEach((part) => {
      const colon = part.indexOf(':');
      if (colon > 0) {
        const k = part.slice(0, colon).trim();
        const v = parseFloat(part.slice(colon + 1).trim());
        if (!Number.isNaN(v)) parsedSizePrices[k] = v;
      }
    });
    merged.sizePrices = Object.keys(parsedSizePrices).length > 0 ? parsedSizePrices : undefined;
    try {
      if (editing) {
        await updateProduct(editing.id, merged);
      } else {
        await createProduct(merged);
      }
      setEditing(null);
      setForm(defaultProduct);
      setColorsStr('');
      setSizesStr('');
      setSizePricesStr('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    setError('');
    try {
      await deleteProduct(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const update = <K extends keyof Omit<Product, 'id'>>(key: K, value: Omit<Product, 'id'>[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleStockToggle = async (p: Product, newStock: boolean) => {
    setError('');
    try {
      await updateProduct(p.id, { stock: newStock });
      setList((prev) => prev.map((item) => (item.id === p.id ? { ...item, stock: newStock } : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update stock');
    }
  };

  if (loading) {
    return <div className="text-center py-5"><span className="spinner-border" /></div>;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Products</h2>
        <button type="button" className="btn btn-dark" onClick={openCreate}>Add product</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        <div className="col-lg-5 mb-4">
          <div className="card shadow-sm mb-3">
            <div className="card-header bg-light py-2 d-flex justify-content-between align-items-center">
              <small className="fw-semibold">Import from JSON</small>
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={() => setShowImport(!showImport)}
              >
                {showImport ? 'Hide' : 'Show'}
              </button>
            </div>
            {showImport && (
              <div className="card-body py-2">
                <textarea
                  className="form-control font-monospace small"
                  rows={8}
                  placeholder='Paste JSON (brand, model, title, slug, shortDescription, longDescription, features, specifications, pricing, images, delivery...)'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                />
                <button type="button" className="btn btn-dark btn-sm mt-2" onClick={handleImportJson}>
                  Apply to form
                </button>
              </div>
            )}
          </div>
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              {editing ? 'Edit product' : 'New product'}
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-2">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={form.categoryId ?? ''}
                    onChange={(e) => update('categoryId', e.target.value || undefined)}
                  >
                    <option value="">None</option>
                    {topLevel.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                    {subCategories.map((s) => (
                      <option key={s.id} value={s.id}>{getCategoryLabel(s)}</option>
                    ))}
                  </select>
                  <small className="text-body-secondary">Use sub-category (e.g. Men › Men's Shoes) for products</small>
                </div>
                <div className="mb-2">
                  <label className="form-label">Title *</label>
                  <input type="text" className="form-control" value={form.title} onChange={(e) => update('title', e.target.value)} required />
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label">Brand</label>
                    <input type="text" className="form-control" value={form.brand ?? ''} onChange={(e) => update('brand', e.target.value)} placeholder="Baseus" />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Model</label>
                    <input type="text" className="form-control" value={form.model ?? ''} onChange={(e) => update('model', e.target.value)} placeholder="EnerFill FM11" />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label">Slug</label>
                  <input type="text" className="form-control" value={form.slug ?? ''} onChange={(e) => update('slug', e.target.value)} placeholder="baseus-enerfill-fm11" />
                </div>
                <div className="mb-2">
                  <label className="form-label">Resource</label>
                  <input type="text" className="form-control" value={form.resource ?? ''} onChange={(e) => update('resource', e.target.value)} placeholder="e.g. link or resource name" />
                </div>
                <div className="mb-2">
                  <label className="form-label">Short description</label>
                  <textarea className="form-control" rows={2} value={form.shortDescription ?? form.description ?? ''} onChange={(e) => { update('shortDescription', e.target.value); update('description', e.target.value); }} placeholder="Brief product summary" />
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label">Price *</label>
                    <input type="number" className="form-control" value={form.price ?? ''} onChange={(e) => update('price', Number(e.target.value) || 0)} min={0} step={0.01} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Discount price</label>
                    <input type="number" className="form-control" value={form.discountPrice ?? ''} onChange={(e) => update('discountPrice', e.target.value ? Number(e.target.value) : undefined)} min={0} step={0.01} placeholder="Optional" />
                  </div>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label">Currency</label>
                    <input type="text" className="form-control" value={form.currency ?? 'BDT'} onChange={(e) => update('currency', e.target.value)} placeholder="BDT" />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Availability</label>
                    <select
                      className="form-select"
                      value={form.stock === false ? 'out' : 'in'}
                      onChange={(e) => update('stock', e.target.value === 'in')}
                    >
                      <option value="in">In stock</option>
                      <option value="out">Out of stock</option>
                    </select>
                    <small className="text-body-secondary">Out of stock products are hidden from purchase.</small>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label">Colour (summary)</label>
                  <input type="text" className="form-control" value={form.color ?? ''} onChange={(e) => update('color', e.target.value || undefined)} placeholder="e.g. 8 colors" />
                </div>
                <div className="mb-2">
                  <label className="form-label">Colours available</label>
                  <input
                    type="text"
                    className="form-control"
                    value={colorsStr}
                    onChange={(e) => setColorsStr(e.target.value)}
                    placeholder="red, blue, green"
                  />
                  <small className="text-body-secondary">Comma-separated list of colour names</small>
                </div>
                <div className="mb-2">
                  <label className="form-label">Size available</label>
                  <input
                    type="text"
                    className="form-control"
                    value={sizesStr}
                    onChange={(e) => setSizesStr(e.target.value)}
                    placeholder="S, M, L or S:5, M:10"
                  />
                  <small className="text-body-secondary">Comma-separated. Optional stock per size: Size:qty</small>
                </div>
                <div className="mb-2">
                  <label className="form-label">Size-wise price (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={sizePricesStr}
                    onChange={(e) => setSizePricesStr(e.target.value)}
                    placeholder="S:10, M:12, L:14"
                  />
                  <small className="text-body-secondary">Different price per size. Format: Size:price (comma-separated). Product price is used when no size or size not listed.</small>
                </div>
                <div className="mb-2">
                  <label className="form-label">Image URL (cover/thumb)</label>
                  <input type="text" className="form-control" value={form.thumb_src} onChange={(e) => update('thumb_src', e.target.value)} placeholder="/images/cover.jpg or gs://..." />
                </div>
                <div className="mb-2">
                  <label className="form-label">Gallery URLs (one per line)</label>
                  <textarea
                    className="form-control font-monospace small"
                    rows={2}
                    value={form.images?.map((i) => i.src).join('\n') ?? ''}
                    onChange={(e) =>
                      update(
                        'images',
                        e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((src) => ({ src, alt: '' }))
                      )
                    }
                    placeholder="https://...&#10;https://..."
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Long description (JSON)</label>
                  <textarea
                    className="form-control font-monospace small"
                    rows={3}
                    value={jsonLongDesc}
                    onChange={(e) => setJsonLongDesc(e.target.value)}
                    placeholder='{"intro":"...","usage":"...","compatibility":["iPhone"]}'
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Features (JSON array)</label>
                  <textarea
                    className="form-control font-monospace small"
                    rows={4}
                    value={jsonFeatures}
                    onChange={(e) => setJsonFeatures(e.target.value)}
                    placeholder='[{"title":"...","description":"..."}]'
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Specifications (JSON)</label>
                  <textarea
                    className="form-control font-monospace small"
                    rows={3}
                    value={jsonSpecs}
                    onChange={(e) => setJsonSpecs(e.target.value)}
                    placeholder='{"batteryCapacity":"10000mAh","weightG":209}'
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Delivery (JSON)</label>
                  <textarea
                    className="form-control font-monospace small"
                    rows={2}
                    value={jsonDelivery}
                    onChange={(e) => setJsonDelivery(e.target.value)}
                    placeholder='{"deliveryTime":"1 hour","deliveryAreas":["Dhaka"]}'
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-dark">{editing ? 'Update' : 'Create'}</button>
                  {editing && <button type="button" className="btn btn-outline-secondary" onClick={openCreate}>Cancel</button>}
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Title</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 ? (
                      <tr><td colSpan={7} className="text-center text-body-secondary">No products. Add one or import from JSON.</td></tr>
                    ) : (
                      list.map((p) => (
                        <tr key={p.id}>
                          <td>
                            {p.thumb_src ? <img src={p.thumb_src} alt="" width={40} height={40} style={{ objectFit: 'cover' }} className="rounded" /> : '—'}
                          </td>
                          <td>{p.title.length > 25 ? p.title.slice(0, 25) + '...' : p.title}</td>
                          <td>
                            <span className={`badge ${p.stock !== false ? 'bg-success' : 'bg-danger'} me-1`}>
                              {p.stock !== false ? 'In stock' : 'Out of stock'}
                            </span>
                            <select
                              className="form-select form-select-sm d-inline-block w-auto"
                              value={p.stock !== false ? 'in' : 'out'}
                              onChange={(e) => handleStockToggle(p, e.target.value === 'in')}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="in">In stock</option>
                              <option value="out">Out of stock</option>
                            </select>
                          </td>
                          <td>
                            <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => setViewProduct(p)}>View</button>
                            <button type="button" className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(p)}>Edit</button>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View product modal */}
      {viewProduct && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setViewProduct(null)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Product: {viewProduct.title}</h5>
                <button type="button" className="btn-close" onClick={() => setViewProduct(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {viewProduct.thumb_src && (
                    <div className="col-12 col-md-4">
                      <img src={viewProduct.thumb_src} alt="" className="img-fluid rounded" style={{ maxHeight: 200, objectFit: 'cover' }} />
                    </div>
                  )}
                  <div className="col">
                    <dl className="row mb-0 small">
                      <dt className="col-sm-3">Model</dt>
                      <dd className="col-sm-9">{viewProduct.model ?? '—'}</dd>
                      <dt className="col-sm-3">Brand</dt>
                      <dd className="col-sm-9">{viewProduct.brand ?? '—'}</dd>
                      <dt className="col-sm-3">Category</dt>
                      <dd className="col-sm-9">{getCategoryTitle(viewProduct.categoryId)}</dd>
                      <dt className="col-sm-3">Price</dt>
                      <dd className="col-sm-9">{viewProduct.currency ?? ''}{viewProduct.price}{viewProduct.discountPrice != null ? ` (discount: ${viewProduct.currency ?? ''}${viewProduct.discountPrice})` : ''}</dd>
                      <dt className="col-sm-3">Stock</dt>
                      <dd className="col-sm-9">{viewProduct.stock !== false ? 'In stock' : 'Out of stock'}</dd>
                      <dt className="col-sm-3">Colour</dt>
                      <dd className="col-sm-9">{viewProduct.color ?? (viewProduct.colors?.length ? viewProduct.colors.join(', ') : '—')}</dd>
                      <dt className="col-sm-3">Size available</dt>
                      <dd className="col-sm-9">{viewProduct.sizes && Object.keys(viewProduct.sizes).length ? Object.keys(viewProduct.sizes).join(', ') : '—'}</dd>
                      {viewProduct.sizePrices && Object.keys(viewProduct.sizePrices).length > 0 && (
                        <>
                          <dt className="col-sm-3">Size prices</dt>
                          <dd className="col-sm-9">{Object.entries(viewProduct.sizePrices).map(([s, pr]) => `${s}: ${viewProduct.currency ?? ''}${pr}`).join(', ')}</dd>
                        </>
                      )}
                      <dt className="col-sm-3">Resource</dt>
                      <dd className="col-sm-9">{viewProduct.resource ?? '—'}</dd>
                      <dt className="col-sm-3">Slug</dt>
                      <dd className="col-sm-9">{viewProduct.slug ?? '—'}</dd>
                      {viewProduct.shortDescription != null && viewProduct.shortDescription !== '' && (
                        <>
                          <dt className="col-sm-3">Description</dt>
                          <dd className="col-sm-9">{viewProduct.shortDescription}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <a href={`/product/?id=${viewProduct.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">Open on site</a>
                <button type="button" className="btn btn-secondary" onClick={() => setViewProduct(null)}>Close</button>
                <button type="button" className="btn btn-dark" onClick={() => { setViewProduct(null); openEdit(viewProduct); }}>Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
