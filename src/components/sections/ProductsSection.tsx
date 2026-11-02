import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Filter, Edit, Trash2, CheckCircle, XCircle, Image as ImageIcon, ChevronLeft, ChevronRight, X, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Product, Category } from '../../types';
import { Language, TRANSLATIONS } from '../../locales/translations';
import {
  getPermanentStorageProducts,
  createPermanentStorageProduct,
  updatePermanentStorageProduct,
  deletePermanentStorageProduct,
  clearPermanentStorageProducts
} from '../../services/gitStorageClient';
import { ConfirmModal } from '../ConfirmModal';

interface ProductsSectionProps {
  products: Product[];
  categories: Category[];
  lang: Language;
  onRefresh: () => void;
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({
  products: initialProducts,
  categories,
  lang,
  onRefresh
}) => {
  const t = TRANSLATIONS[lang];

  // Local state for products loaded from Backend Permanent Storage
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [gitSha, setGitSha] = useState<string>('');
  const [fromCache, setFromCache] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Mutation states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    slug: '',
    sku: '',
    category_id: 1,
    price: 199,
    promo_price: '',
    stock_quantity: 25,
    description: '',
    description_ar: '',
    is_published: true,
    image_url: '/media/products/moroccan_argan_oil_bottle_1793476978520.jpg'
  });

  // Fetch products directly from Backend Permanent Storage API
  const fetchBackendProducts = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const result = await getPermanentStorageProducts();
      setProductsList(result.items);
      setGitSha(result.git_sha);
      setFromCache(result.from_cache);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load products from backend storage.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendProducts();
  }, []);

  // Filtered Products
  const filteredProducts = productsList.filter((p) => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.name_ar && p.name_ar.includes(searchTerm)) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || String(p.category_id) === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      name_ar: '',
      slug: `item-${Date.now().toString().slice(-4)}`,
      sku: `PROD-${Date.now().toString().slice(-4)}`,
      category_id: categories[0]?.id || 1,
      price: 250,
      promo_price: '',
      stock_quantity: 30,
      description: 'Handcrafted luxury Moroccan product verified for storage catalog.',
      description_ar: 'منتج مغربي طبيعي فاخر عالي الجودة متوافق مع معايير المتجر.',
      is_published: true,
      image_url: '/media/products/moroccan_argan_oil_bottle_1793476978520.jpg'
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      name_ar: product.name_ar || '',
      slug: product.slug,
      sku: product.sku,
      category_id: product.category_id,
      price: product.price,
      promo_price: product.promo_price ? String(product.promo_price) : '',
      stock_quantity: product.stock_quantity,
      description: product.description || '',
      description_ar: product.description_ar || '',
      is_published: product.is_published,
      image_url: product.images && product.images[0] ? product.images[0].image_url : '/media/products/moroccan_argan_oil_bottle_1793476978520.jpg'
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: () => {}
  });

  const handleDeleteProduct = (id: number, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: lang === 'ar' ? 'حذف المنتج (Delete Product)' : 'Delete Product',
      message: lang === 'ar' 
        ? `wach fi3lan bghiti tmsa7 had lkhana "${name}" (#${id})؟` 
        : `Are you sure you want to delete product "${name}" (#${id})?`,
      confirmText: lang === 'ar' ? 'نعم، امسح (Yes, Delete)' : 'Delete',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setDeletingId(id);
        setFeedback(null);

        const result = await deletePermanentStorageProduct(id);
        setDeletingId(null);

        if (result.success) {
          setFeedback({
            type: 'success',
            message: `Product #${id} (${name}) was successfully deleted from Backend Permanent Storage.`
          });
          await fetchBackendProducts();
          onRefresh();
        } else {
          setFeedback({
            type: 'error',
            message: result.error || `Failed to delete product #${id}. Storage operation rejected.`
          });
        }
      }
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const promoVal = formData.promo_price ? Number(formData.promo_price) : null;
    const productPayload = {
      name: formData.name.trim(),
      name_ar: formData.name_ar.trim(),
      slug: formData.slug.trim(),
      sku: formData.sku.trim(),
      category_id: Number(formData.category_id),
      price: Number(formData.price),
      promo_price: promoVal,
      stock_quantity: Number(formData.stock_quantity),
      description: formData.description.trim(),
      description_ar: formData.description_ar.trim(),
      is_published: Boolean(formData.is_published),
      images: [
        {
          image_url: formData.image_url,
          alt_text: formData.name,
          display_order: 1,
          is_primary: true
        }
      ]
    };

    if (editingProduct) {
      // UPDATE via Backend API
      const result = await updatePermanentStorageProduct(editingProduct.id, productPayload);
      setIsSubmitting(false);

      if (result.success) {
        setIsModalOpen(false);
        setFeedback({
          type: 'success',
          message: `Product #${editingProduct.id} "${result.data?.name || formData.name}" updated successfully in Backend Storage.`
        });
        await fetchBackendProducts();
        onRefresh();
      } else {
        // KEEP modal open so user does not lose changes
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to update product. Backend rejected the change.'
        });
      }
    } else {
      // CREATE via Backend API
      const result = await createPermanentStorageProduct(productPayload);
      setIsSubmitting(false);

      if (result.success) {
        setIsModalOpen(false);
        setFeedback({
          type: 'success',
          message: `Product "${result.data?.name || formData.name}" created successfully in Backend Storage (ID: #${result.data?.id || 'new'}).`
        });
        await fetchBackendProducts();
        onRefresh();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to create product. Backend rejected the creation.'
        });
      }
    }
  };

  const handleClearAllProducts = () => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف جميع المنتجات التجريبية (Clear All Sample Data)',
      message: 'wach fiحlan bghiti tmsa7 ga3 lmontajatt lwahmiya/ttajribiya mn lmatjar؟ (Are you sure you want to clear all sample products?)',
      confirmText: 'نعم، امسح الكل (Yes, Clear All)',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setIsLoading(true);
        setFeedback(null);
        const result = await clearPermanentStorageProducts();
        if (result.success) {
          setFeedback({
            type: 'success',
            message: `Sample products cleared successfully (${result.cleared_count || 0} items removed). You can now add your real store products.`
          });
          await fetchBackendProducts();
          onRefresh();
        } else {
          setFeedback({
            type: 'error',
            message: result.error || 'Failed to clear sample products.'
          });
          setIsLoading(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0B0F19] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              BACKEND STORAGE: /api/backend/storage/products
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-emerald-400 font-mono tabular-nums">{productsList.length} Products Stored</span>
            {gitSha && (
              <>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-[10px] text-slate-400 font-mono">SHA: {gitSha.slice(0, 8)}</span>
              </>
            )}
            {fromCache && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                Cached
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Central Product & Inventory Storage
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Stores all product definitions, bilingual names, pricing in MAD, stock counts, and media links for your external store.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleClearAllProducts}
            disabled={isLoading || productsList.length === 0}
            className="px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-30"
            title="Clear sample placeholder data"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{lang === 'ar' ? 'مسح البيانات التجريبية' : 'Clear Sample Data'}</span>
          </button>

          <button
            onClick={fetchBackendProducts}
            disabled={isLoading}
            className="p-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh from Backend Storage"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-purple-900/30 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-white/10 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Network / Permission / Storage Error Alert */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-rose-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Backend Storage Communication Error</div>
              <div className="text-rose-300/90 text-[11px] mt-0.5">{fetchError}</div>
            </div>
          </div>
          <button
            onClick={fetchBackendProducts}
            className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry (إعادة المحاولة)</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by title, Arabic name, or SKU..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Categories ({productsList.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name} ({productsList.filter((p) => p.category_id === c.id).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table with Loading & Empty State */}
      <div className="rounded-xl bg-[#0B0F19] border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
            <div className="text-xs text-purple-300 font-mono">
              Loading products from Backend Permanent Storage (/api/backend/storage/products)...
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/80 text-slate-400 font-medium border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Product Info</th>
                  <th className="px-3 py-3">SKU</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3 text-right">Price (MAD)</th>
                  <th className="px-3 py-3 text-center">Stock</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((p) => {
                    const imgUrl = p.images && p.images[0] ? p.images[0].image_url : null;
                    const isDeleting = deletingId === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-slate-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-white truncate max-w-xs">{p.name}</div>
                              <div className="text-[11px] text-purple-300/80 truncate font-arabic">{p.name_ar}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 font-mono text-slate-400 text-[11px]">
                          {p.sku}
                        </td>

                        <td className="px-3 py-3 text-slate-300">
                          {p.category_name || categories.find((c) => c.id === p.category_id)?.name || 'General'}
                        </td>

                        <td className="px-3 py-3 text-right font-mono tabular-nums text-white">
                          {p.promo_price ? (
                            <div>
                              <span className="text-emerald-400 font-bold">{p.promo_price} MAD</span>
                              <span className="block text-[10px] text-slate-500 line-through">{p.price} MAD</span>
                            </div>
                          ) : (
                            <span>{p.price} MAD</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-center font-mono tabular-nums">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              p.stock_quantity < 10
                                ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                                : 'text-slate-300'
                            }`}
                          >
                            {p.stock_quantity}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          {p.is_published ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Live</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Draft</span>
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              disabled={isDeleting}
                              className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded transition-colors cursor-pointer disabled:opacity-30"
                              title="Edit Product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              disabled={isDeleting}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer disabled:opacity-30"
                              title="Delete Product"
                            >
                              {isDeleting ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-xs text-slate-500 space-y-2">
                      <Package className="w-8 h-8 text-slate-600 mx-auto stroke-[1.5]" />
                      <div className="text-slate-300 font-medium">No Products Found</div>
                      <div className="text-slate-500 max-w-sm mx-auto">
                        {searchTerm || selectedCategory !== 'all'
                          ? 'No products match your current search filters. Try clearing your search.'
                          : 'Your backend storage catalog is currently empty. Click "Add Product" to create one.'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} items
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-xl w-full max-w-xl shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-900/40 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingProduct ? `Edit Product #${editingProduct.id}` : 'Add New Product'}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Target: Backend Permanent Storage (/api/backend/storage/products)
                  </div>
                </div>
              </div>
              <button
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedback && feedback.type === 'error' && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Product Title (English)</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Pure Organic Argan Oil 100ml"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-arabic">اسم المنتج (العربية)</label>
                  <input
                    type="text"
                    required
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="مثال: زيت أركان طبيعي عضوي 100 مل"
                    dir="rtl"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-arabic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Price (MAD)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Promo Price (MAD, optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.promo_price}
                    onChange={(e) => setFormData({ ...formData, promo_price: e.target.value })}
                    placeholder="Leave empty if none"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Image URL / Media Path</label>
                <input
                  type="text"
                  required
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="/media/products/your_image.jpg"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-800 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="is_published" className="text-slate-300 select-none cursor-pointer">
                  Publish to External Store (Live for checkout)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-900/30 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Storage...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Update Product' : 'Create Product'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
