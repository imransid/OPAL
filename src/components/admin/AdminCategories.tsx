import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../lib/firestore';
import type { Category } from '../../lib/types';

const defaultCategory: Omit<Category, 'id'> = {
  title: '',
  collection: '',
  thumb_src: '',
  parentId: undefined,
};

const DEFAULT_PARENT_CATEGORIES = [
  'Electronics',
  'Men',
  'Women',
  'Kids',
  'Accessories',
  'Home',
  'Beauty',
  'Sports',
];

export default function AdminCategories() {
  const [list, setList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Omit<Category, 'id'>>(defaultCategory);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCategories();
      setList(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const topLevel = list.filter((c) => !c.parentId);
  const subCategories = list.filter((c) => c.parentId);

  const openCreate = (parent?: Category) => {
    setEditing(null);
    setForm({ ...defaultCategory, parentId: parent?.id });
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ title: c.title, collection: c.collection, thumb_src: c.thumb_src, parentId: c.parentId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await updateCategory(editing.id, form);
      } else {
        await createCategory(form);
      }
      setEditing(null);
      setForm(defaultCategory);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const handleSeedParents = async () => {
    setSeeding(true);
    setError('');
    try {
      const existing = list.map((c) => c.title.trim().toLowerCase());
      let added = 0;
      for (const title of DEFAULT_PARENT_CATEGORIES) {
        if (existing.includes(title.toLowerCase())) continue;
        await createCategory({ title, collection: title.toLowerCase().replace(/\s+/g, '-'), thumb_src: '', parentId: undefined });
        added++;
        existing.push(title.toLowerCase());
      }
      await load();
      if (added > 0) setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add categories');
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    setError('');
    try {
      await deleteCategory(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  if (loading) {
    return <div className="text-center py-5"><span className="spinner-border" /></div>;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Categories</h2>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-dark" onClick={handleSeedParents} disabled={seeding}>
            {seeding ? 'Adding…' : 'Quick add parent categories'}
          </button>
          <button type="button" className="btn btn-dark" onClick={() => openCreate()}>Add category</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        <div className="col-lg-5 mb-4">
          <div className="card shadow-sm mb-3">
            <div className="card-header bg-light py-2">
              <small className="fw-semibold">🔹 Example – Categories & sub-categories</small>
            </div>
            <div className="card-body py-2 small text-body-secondary">
              <p className="mb-1"><strong>Quick add:</strong> Electronics, Men, Women, Kids, Accessories, Home, Beauty, Sports</p>
              <p className="mb-1"><strong>Category:</strong> Shoes &amp; Footwear (parent, no parent selected)</p>
              <p className="mb-0"><strong>Sub-category:</strong> Men&apos;s Shoes (parent: Shoes &amp; Footwear)</p>
            </div>
          </div>
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              {editing ? 'Edit category' : form.parentId ? 'New sub-category' : 'New category'}
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-2">
                  <label className="form-label">Parent category</label>
                  <select
                    className="form-select"
                    value={form.parentId ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value || undefined }))}
                  >
                    <option value="">None (top-level category)</option>
                    {topLevel.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Title</label>
                  <input type="text" className="form-control" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={form.parentId ? "e.g. Men's Shoes" : "e.g. Shoes & Footwear"} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Collection</label>
                  <input type="text" className="form-control" value={form.collection} onChange={(e) => setForm((f) => ({ ...f, collection: e.target.value }))} placeholder="e.g. footwear, electronics" />
                </div>
                <div className="mb-2">
                  <label className="form-label">Image URL</label>
                  <input type="text" className="form-control" value={form.thumb_src} onChange={(e) => setForm((f) => ({ ...f, thumb_src: e.target.value }))} placeholder="/images/categories/category-name.jpg" />
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
                      <th>Collection</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 ? (
                      <tr><td colSpan={4} className="text-center text-body-secondary">No categories. Add one.</td></tr>
                    ) : (
                      <>
                        {topLevel.map((c) => (
                          <React.Fragment key={c.id}>
                            <tr>
                              <td>
                                {c.thumb_src ? <img src={c.thumb_src} alt="" width={40} height={40} style={{ objectFit: 'cover' }} /> : '—'}
                              </td>
                              <td><strong>{c.title}</strong></td>
                              <td>{c.collection}</td>
                              <td>
                                <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => openCreate(c)}>Add sub</button>
                                <button type="button" className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(c)}>Edit</button>
                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}>Delete</button>
                              </td>
                            </tr>
                            {subCategories.filter((s) => s.parentId === c.id).map((s) => (
                              <tr key={s.id} className="table-light">
                                <td>
                                  {s.thumb_src ? <img src={s.thumb_src} alt="" width={40} height={40} style={{ objectFit: 'cover' }} /> : '—'}
                                </td>
                                <td className="ps-4">↳ {s.title}</td>
                                <td>{s.collection}</td>
                                <td>
                                  <button type="button" className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(s)}>Edit</button>
                                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
