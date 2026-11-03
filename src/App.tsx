import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, SectionKey } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
const OverviewSection = React.lazy(() => import('./components/sections/OverviewSection').then(m => ({ default: m.OverviewSection })));
const DatabaseSection = React.lazy(() => import('./components/sections/DatabaseSection').then(m => ({ default: m.DatabaseSection })));
const ProductsSection = React.lazy(() => import('./components/sections/ProductsSection').then(m => ({ default: m.ProductsSection })));
const MediaStorageSection = React.lazy(() => import('./components/sections/MediaStorageSection').then(m => ({ default: m.MediaStorageSection })));
const CategoriesSection = React.lazy(() => import('./components/sections/CategoriesSection').then(m => ({ default: m.CategoriesSection })));
const OrdersSection = React.lazy(() => import('./components/sections/OrdersSection').then(m => ({ default: m.OrdersSection })));
const CustomersSection = React.lazy(() => import('./components/sections/CustomersSection').then(m => ({ default: m.CustomersSection })));
const ApiManagementSection = React.lazy(() => import('./components/sections/ApiManagementSection').then(m => ({ default: m.ApiManagementSection })));
const EncryptionSection = React.lazy(() => import('./components/sections/EncryptionSection').then(m => ({ default: m.EncryptionSection })));
const BackupSection = React.lazy(() => import('./components/sections/BackupSection').then(m => ({ default: m.BackupSection })));
const RestoreSection = React.lazy(() => import('./components/sections/RestoreSection').then(m => ({ default: m.RestoreSection })));
const StorageMonitoringSection = React.lazy(() => import('./components/sections/StorageMonitoringSection').then(m => ({ default: m.StorageMonitoringSection })));
const ActivityLogsSection = React.lazy(() => import('./components/sections/ActivityLogsSection').then(m => ({ default: m.ActivityLogsSection })));
const SettingsSection = React.lazy(() => import('./components/sections/SettingsSection').then(m => ({ default: m.SettingsSection })));
import { Language } from './locales/translations';
import { Product, Category, Order, Customer, StoreSetting, ActivityLog, StoredMediaFile, StorageQuota } from './types';
import {
  getAllProducts,
  getAllCategories,
  getAllOrders,
  getAllCustomers,
  getAllSettings,
  getAllLogs,
  getDatabase
} from './db/sqliteEngine';
import { getStoredMediaList, getStorageQuota } from './services/storageService';
import { getPermanentStorageProducts, getPermanentStorageOrders, getPermanentStorageStatus, clearAdminToken, adminLogout, PermanentStorageStatus } from './services/gitStorageClient';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('aiwebcrafter_authenticated') === 'true' && Boolean(localStorage.getItem('aiwebcrafter_admin_token'));
  });
  const [lang, setLang] = useState<Language>('en');
  const [currentSection, setCurrentSection] = useState<SectionKey>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Core Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<StoreSetting[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [mediaFiles, setMediaFiles] = useState<StoredMediaFile[]>([]);
  const [quota, setQuota] = useState<StorageQuota>(getStorageQuota());
  const [storageStatus, setStorageStatus] = useState<PermanentStorageStatus | null>(null);

  // Load Database and Storage Data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await getDatabase();
      const [prodsSql, cats, ordsSql, custs, sets, lgs] = await Promise.all([
        getAllProducts(),
        getAllCategories(),
        getAllOrders(),
        getAllCustomers(),
        getAllSettings(),
        getAllLogs()
      ]);

      // Attempt to load primary catalog and orders from Backend Permanent Storage
      let backendProds: Product[] | null = null;
      let backendOrds: Order[] | null = null;

      try {
        const prodRes = await getPermanentStorageProducts();
        if (prodRes && Array.isArray(prodRes.items)) {
          backendProds = prodRes.items;
        }
      } catch (e) {
        console.warn('Backend storage products fetch notice (using SQLite cache):', e);
      }

      try {
        const ordRes = await getPermanentStorageOrders();
        if (Array.isArray(ordRes)) {
          backendOrds = ordRes;
        }
      } catch (e) {
        console.warn('Backend storage orders fetch notice (using SQLite cache):', e);
      }

      setProducts(backendProds || prodsSql);
      setCategories(cats);
      setOrders(backendOrds || ordsSql);
      setCustomers(custs);
      setSettings(sets);
      setLogs(lgs);
      setMediaFiles(getStoredMediaList());
      setQuota(getStorageQuota());
      
      const status = await getPermanentStorageStatus();
      setStorageStatus(status);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  // Language & RTL Sync
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const handleLoginSuccess = () => {
    localStorage.setItem('aiwebcrafter_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    localStorage.removeItem('aiwebcrafter_authenticated');
    await adminLogout();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        lang={lang}
        onToggleLang={handleToggleLang}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080B12] text-slate-100 flex flex-col font-sans">
      <Header
        currentSection={currentSection}
        lang={lang}
        onToggleLang={handleToggleLang}
        onLogout={handleLogout}
        onOpenSql={() => setCurrentSection('database')}
      />

      <div className="flex-1 flex max-w-full">
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(key) => setCurrentSection(key)}
          lang={lang}
          productsCount={products.length}
          ordersCount={orders.length}
          storeName={settings.find((s) => s.key === 'store_name')?.value || 'Natural Health Morocco'}
          storeUrl={settings.find((s) => s.key === 'store_url')?.value || 'https://natural-health-morocco.vercel.app'}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden min-h-[calc(100vh-4rem)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <div className="text-xs font-mono text-purple-300">
                Initializing SQLite Wasm Engine & Syncing Tables...
              </div>
            </div>
          ) : (
            <React.Suspense fallback={
              <div className="flex flex-col items-center justify-center py-24 text-purple-400">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mb-3"></div>
                <span className="text-xs text-slate-400">Loading module...</span>
              </div>
            }>
              {currentSection === 'overview' && (
                <OverviewSection
                  lang={lang}
                  products={products}
                  orders={orders}
                  logs={logs}
                  quota={quota}
                  storageStatus={storageStatus}
                  onNavigate={(sec) => setCurrentSection(sec)}
                  onOpenSql={() => setCurrentSection('database')}
                />
              )}

              {currentSection === 'database' && (
                <DatabaseSection lang={lang} storageStatus={storageStatus} />
              )}

              {currentSection === 'products' && (
                <ProductsSection
                  products={products}
                  categories={categories}
                  lang={lang}
                  onRefresh={loadAllData}
                />
              )}

              {currentSection === 'media' && (
                <MediaStorageSection
                  mediaFiles={mediaFiles}
                  quota={quota}
                  lang={lang}
                  onRefresh={loadAllData}
                />
              )}

              {currentSection === 'categories' && (
                <CategoriesSection
                  categories={categories}
                  products={products}
                  lang={lang}
                  onRefresh={loadAllData}
                />
              )}

              {currentSection === 'orders' && (
                <OrdersSection
                  orders={orders}
                  lang={lang}
                  onRefresh={loadAllData}
                />
              )}

              {currentSection === 'customers' && (
                <CustomersSection
                  customers={customers}
                  lang={lang}
                />
              )}

              {currentSection === 'api' && (
                <ApiManagementSection
                  lang={lang}
                  onRefresh={loadAllData}
                />
              )}

              {currentSection === 'encryption' && (
                <EncryptionSection lang={lang} />
              )}

              {currentSection === 'backup' && (
                <BackupSection lang={lang} />
              )}

              {currentSection === 'restore' && (
                <RestoreSection
                  lang={lang}
                  onRefresh={loadAllData}
                />
              )}

              {currentSection === 'storage_monitor' && (
                <StorageMonitoringSection
                  quota={quota}
                  lang={lang}
                />
              )}

              {currentSection === 'logs' && (
                <ActivityLogsSection
                  logs={logs}
                  lang={lang}
                />
              )}

              {currentSection === 'settings' && (
                <SettingsSection
                  settings={settings}
                  lang={lang}
                  onRefresh={loadAllData}
                />
              )}
            </React.Suspense>
          )}
        </main>
      </div>
    </div>
  );
}
