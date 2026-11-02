import React, { useState } from 'react';
import { FolderTree, Plus, Edit, Trash2, Package, Sparkles } from 'lucide-react';
import { Category, Product } from '../../types';
import { Language } from '../../locales/translations';
import { getDatabase, persistDatabase, addActivityLog } from '../../db/sqliteEngine';

interface CategoriesSectionProps {
  categories: Category[];
  products: Product[];
  lang: Language;
  onRefresh: () => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  categories,
  products,
  lang,
  onRefresh
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    slug: '',
    description: '',
    icon: 'Folder'
  });

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      name_ar: '',
      slug: `cat-${Date.now().toString().slice(-4)}`,
      description: '',
      icon: 'Folder'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      name_ar: cat.name_ar,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const db = await getDatabase();
      if (editingCategory) {
        db.run(
          `UPDATE categories SET name = ?, name_ar = ?, slug = ?, description = ?, icon = ? WHERE id = ?`,
          [formData.name, formData.name_ar, formData.slug, formData.description, formData.icon, editingCategory.id]
        );
        await addActivityLog('SQL_QUERY', 'CATEGORY', String(editingCategory.id), `Updated category ${formData.name}`);
      } else {
        db.run(
          `INSERT INTO categories (name, name_ar, slug, parent_id, description, icon, sort_order)
           VALUES (?, ?, ?, NULL, ?, ?, 10)`,
          [formData.name, formData.name_ar, formData.slug, formData.description, formData.icon]
        );
        await addActivityLog('SQL_QUERY', 'CATEGORY', formData.slug, `Created category ${formData.name}`);
      }
      persistDatabase(db);
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0B0F19] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              TAXONOMY & HIERARCHY
            </span>
            <span className="text-xs text-emerald-400 font-mono">{categories.length} Categories</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Product Categories & Collections Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize catalog classifications, bilingual titles, and slugs served directly to your existing online store.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-purple-900/30 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => {
          const count = products.filter((p) => p.category_id === c.id).length;
          return (
            <div
              key={c.id}
              className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 flex flex-col justify-between hover:border-purple-500/30 transition-all space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{c.name}</h3>
                      <div className="text-xs text-purple-300/80 font-arabic">{c.name_ar}</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    ID #{c.id}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {c.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Package className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-mono tabular-nums text-slate-200">{count} products</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">
              {editingCategory ? `Edit Category #${editingCategory.id}` : 'Create New Category'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Category Name (English)</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Category Name (Arabic / بالعربية)</label>
                <input
                  type="text"
                  dir="rtl"
                  required
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-arabic"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
