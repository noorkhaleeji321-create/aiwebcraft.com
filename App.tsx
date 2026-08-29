import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar.js';
import Hero from './components/Hero.js';
import CategoryNavigation from './components/CategoryNavigation.js';
import FilterPanel from './components/FilterPanel.js';
import ListingGrid from './components/ListingGrid.js';
import ProjectDetails from './components/ProjectDetails.js';
import SellProject from './components/SellProject.js';
import AdminDashboard from './components/admin/AdminDashboard.js';
import BuyerDeliveryCenter from './components/delivery/BuyerDeliveryCenter.js';
import SellerDeliveryCenter from './components/delivery/SellerDeliveryCenter.js';
import Footer from './components/Footer.js';
import Assistant from './components/Assistant.js';
import AccountModal from './components/AccountModal.js';
import ContactAdminModal from './components/ContactAdminModal.js';
import LandingPage from './components/LandingPage.js';
import { MOCK_LISTINGS, CATEGORIES_LIST } from './data/mockListings.js';
import { getApprovedSellerListings, getStoredSellerProjects, getDeletedListingIds, deleteSellerProject, addDeletedListingId } from './services/sellerStore.js';
import { getOrderById } from './services/deliveryStore.js';
import { getCurrentSupabaseUser, fetchListingsFromSupabase, fetchPlatformCommissionPercentage } from './services/supabaseService.js';
import { Listing, FilterOptions, CategoryType, ViewState, Language } from './types.js';
import { isListingInCategory } from './utils/categoryUtils.js';
import { 
  CategoriesPage, 
  BuyerPurchasesPage, 
  BuyerOrdersPage, 
  BuyerMessagesPage, 
  BuyerAccountPage 
} from './components/BuyerSubPages.js';
import OnDemandCustomPage from './components/OnDemandCustomPage.js';

import { UserRole } from './components/SidebarNav.js';
import { I18nProvider } from './src/context/I18nContext.js';

function App() {
  const [view, setView] = useState<ViewState>({ type: 'home' });
  const [language, setLanguage] = useState<Language>('en');
  const [userRole, setUserRole] = useState<UserRole>('BUYER');
  const [savedIds, setSavedIds] = useState<string[]>(['lst-101']); // Initial saved favorite for demo
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isContactAdminOpen, setIsContactAdminOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isFilteringLoading, setIsFilteringLoading] = useState(false);
  const [approvedSellerListings, setApprovedSellerListings] = useState<Listing[]>([]);
  const [supabaseListings, setSupabaseListings] = useState<Listing[]>([]);

  useEffect(() => {
    const handleOpenContactAdmin = () => setIsContactAdminOpen(true);
    window.addEventListener('open-contact-admin', handleOpenContactAdmin);
    return () => window.removeEventListener('open-contact-admin', handleOpenContactAdmin);
  }, []);

  useEffect(() => {
    // Synchronize global commission rate from server for all sessions/browsers
    fetchPlatformCommissionPercentage().catch(() => {});

    getCurrentSupabaseUser().then((user) => {
      setCurrentUser(user);
      if (user) {
        const role = user.app_metadata?.role;
        if (role === 'admin') {
          setUserRole('SUPER_ADMIN');
        } else {
          setUserRole('BUYER');
        }
      } else {
        setUserRole('BUYER');
      }
      setAuthChecking(false);
    });
  }, []);

  const isAdmin = currentUser?.app_metadata?.role === 'admin' || userRole === 'SUPER_ADMIN';

  useEffect(() => {
    const approved = getApprovedSellerListings();
    setApprovedSellerListings(approved);
  }, [view]);

  useEffect(() => {
    // Fetch live listings from the Supabase database
    fetchListingsFromSupabase().then((listings) => {
      setSupabaseListings(listings);
    });
  }, [view]);

  // Combined Public Marketplace Listings (Default MOCK_LISTINGS + Approved Seller Submissions + Supabase Live Listings)
  const allPublicListings = useMemo(() => {
    const deletedIds = getDeletedListingIds();
    const mockIds = new Set(MOCK_LISTINGS.map((l) => l.id));
    const uniqueApproved = approvedSellerListings.filter((l) => !mockIds.has(l.id));
    const uniqueSupabase = supabaseListings.filter((l) => !mockIds.has(l.id) && (l.status === 'approved' || l.status === 'For Sale'));
    
    // Combine everything
    const merged = [...MOCK_LISTINGS, ...uniqueApproved, ...uniqueSupabase];
    
    // Ensure absolute uniqueness by id and filter out deleted IDs
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (item.id === '6b67c62e-9c11-421a-9a9f-e6ae91075ed3' || deletedIds.includes(item.id)) {
        return false;
      }
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [approvedSellerListings, supabaseListings]);

  const handleDeleteListing = (id: string) => {
    deleteSellerProject(id);
    addDeletedListingId(id);
    setApprovedSellerListings((prev) => prev.filter((l) => l.id !== id));
    setSupabaseListings((prev) => prev.filter((l) => l.id !== id));
  };

  // Filter State
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: 'All',
    minPrice: null,
    maxPrice: null,
    minRevenue: null,
    verifiedOnly: false,
    selectedTech: [],
    sortBy: 'newest',
    businessStageFilter: 'All',
    assetTypeFilter: 'All'
  });

  const handleFilterChange = (updated: Partial<FilterOptions>) => {
    setIsFilteringLoading(true);
    setFilters((prev) => ({ ...prev, ...updated }));
    setTimeout(() => setIsFilteringLoading(false), 200);
  };

  const resetFilters = () => {
    setIsFilteringLoading(true);
    setFilters({
      search: '',
      category: 'All',
      minPrice: null,
      maxPrice: null,
      minRevenue: null,
      verifiedOnly: false,
      selectedTech: [],
      sortBy: 'newest',
      businessStageFilter: 'All',
      assetTypeFilter: 'All'
    });
    setTimeout(() => setIsFilteringLoading(false), 200);
  };

  // Saved / Favorites toggle
  const toggleSaveListing = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter and Sort Logic
  const filteredListings = useMemo(() => {
    return allPublicListings.filter((listing) => {
      // Saved View Filter
      if (view.type === 'saved' && !savedIds.includes(listing.id)) {
        return false;
      }

      // Search Query Match (Title, Tagline, Tech, Platform)
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchesTitle = listing.title.toLowerCase().includes(query);
        const matchesTagline = listing.tagline.toLowerCase().includes(query);
        const matchesPlatform = listing.platform.toLowerCase().includes(query);
        const matchesTech = Object.values(listing.techStack || {})
          .flat()
          .some((t) => (t as string)?.toLowerCase().includes(query));

        if (!matchesTitle && !matchesTagline && !matchesPlatform && !matchesTech) {
          return false;
        }
      }

      // Category Match
      if (filters.category !== 'All' && !isListingInCategory(listing, filters.category)) {
        return false;
      }

      // Min Price
      if (filters.minPrice !== null && listing.askingPrice < filters.minPrice) {
        return false;
      }

      // Max Price
      if (filters.maxPrice !== null && listing.askingPrice > filters.maxPrice) {
        return false;
      }

      // Min Monthly Revenue
      if (
        filters.minRevenue !== null &&
        listing.monthlyRevenue < filters.minRevenue
      ) {
        return false;
      }

      // Verified Sellers Only
      if (filters.verifiedOnly && !listing.seller.verified) {
        return false;
      }

      // Selected Tech Stack Tags
      if (filters.selectedTech.length > 0) {
        const allTechs = Object.values(listing.techStack || {}).flat();
        const hasMatchingTech = filters.selectedTech.some((tech) =>
          allTechs.includes(tech)
        );
        if (!hasMatchingTech) return false;
      }

      // Business Stage Filter
      if (filters.businessStageFilter && filters.businessStageFilter !== 'All' && listing.business_stage !== filters.businessStageFilter) {
        return false;
      }

      // Asset Type Filter
      if (filters.assetTypeFilter && filters.assetTypeFilter !== 'All' && listing.asset_type !== filters.assetTypeFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return a.askingPrice - b.askingPrice;
        case 'price-high':
          return b.askingPrice - a.askingPrice;
        case 'revenue-high':
          return b.monthlyRevenue - a.monthlyRevenue;
        case 'profit-high':
          return b.monthlyProfit - a.monthlyProfit;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [allPublicListings, filters, view, savedIds]);

  // Dynamic Category Item Counts
  const categoriesWithCounts = useMemo(() => {
    return CATEGORIES_LIST.map((cat) => {
      if (cat.id === 'All') {
        return { id: cat.id as CategoryType, label: cat.name, count: allPublicListings.length };
      }
      const count = allPublicListings.filter((l) => isListingInCategory(l, cat.id)).length;
      return { id: cat.id as CategoryType, label: cat.name, count };
    });
  }, [allPublicListings]);

  // Hash URL listener for /admin
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
        const isAdmin = currentUser?.app_metadata?.role === 'admin' || userRole === 'SUPER_ADMIN';
        if (isAdmin) {
          setView({ type: 'admin' });
        } else {
          window.location.hash = '';
          setView({ type: 'home' });
        }
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [userRole, currentUser]);

  // Navigation Handler
  const handleNavigate = (viewType: any, targetSection?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (viewType === 'admin') {
      const isAdmin = currentUser?.app_metadata?.role === 'admin' || userRole === 'SUPER_ADMIN';
      if (isAdmin) {
        window.location.hash = 'admin';
        setView({ type: 'admin', initialSubTab: targetSection });
      } else {
        window.location.hash = '';
        setView({ type: 'home' });
      }
    } else if (viewType === 'home') {
      if (window.location.hash === '#admin') {
        window.history.pushState('', document.title, window.location.pathname + window.location.search);
      }
      setView({ type: 'home', initialSubTab: targetSection });
      if (targetSection && targetSection !== 'marketplace' && targetSection !== 'categories') {
        setTimeout(() => {
          const el = document.getElementById(targetSection);
          if (el) {
            const offset = 90;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = el.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }
        }, 100);
      }
    } else if (viewType === 'sell') {
      setView({ type: 'sell', initialSubTab: targetSection });
    } else if (viewType === 'saved') {
      setView({ type: 'saved' });
    } else {
      setView({ type: viewType });
    }
  };

  if (!currentUser) {
    return (
      <I18nProvider>
        <div className="min-h-screen bg-[#F5F2EB]">
          <LandingPage onOpenAuth={(isSignUp) => setIsAccountModalOpen(true)} />
          <AccountModal
            isOpen={isAccountModalOpen}
            onClose={() => setIsAccountModalOpen(false)}
            savedCount={savedIds.length}
            onViewSaved={() => handleNavigate('saved')}
            onAuthenticated={(user) => {
              setCurrentUser(user);
              if (user) {
                const role = user.app_metadata?.role;
                if (role === 'admin') {
                  setUserRole('SUPER_ADMIN');
                  setView({ type: 'admin' });
                  window.location.hash = 'admin';
                } else {
                  setUserRole('BUYER');
                  setView({ type: 'home' });
                }
              } else {
                setUserRole('BUYER');
                setView({ type: 'home' });
              }
              setIsAccountModalOpen(false);
            }}
            isRequired={true}
          />
        </div>
      </I18nProvider>
    );
  }

  return (
    <I18nProvider>
    <div className="min-h-screen bg-[#F5F2EB] font-sans text-[#2C2A26] selection:bg-[#D6D1C7] selection:text-[#2C2A26] flex flex-col lg:flex-row">
      {/* Vertical Sidebar Navigation */}
      <Navbar
        activeView={view.type}
        activeSubTab={(view as any).initialSubTab}
        userRole={userRole}
        onRoleChange={setUserRole}
        onNavigate={handleNavigate}
        savedCount={savedIds.length}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onContactAdmin={() => setIsContactAdminOpen(true)}
        language={language}
        onLanguageChange={setLanguage}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
      />

      {/* Main Views Container */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <main className="flex-1 m-0 p-0 -mt-[25px]" style={{ marginLeft: '0px', paddingLeft: '0px', marginTop: '-25px' }}>
          {/* HOME / MARKETPLACE VIEW */}
          {view.type === 'home' && (
            <>
              {/* Hero Banner Section */}
              <Hero onExploreClick={() => handleNavigate('home', 'marketplace')} />

              {/* Marketplace Directory & Filters Container */}
              <section className="w-full px-4 sm:px-6 lg:px-8 pt-1 pb-6 space-y-4 ml-0 mr-0 mb-0" id="marketplace">
                {/* Category Navigation Pills */}
                <CategoryNavigation
                  categories={categoriesWithCounts}
                  selectedCategory={filters.category}
                  onSelectCategory={(cat) => handleFilterChange({ category: cat })}
                />

                {/* Full-Width Main Content Workspace */}
                <div className="w-full">
                  {/* Listings Grid (full width for spacious card presentation) */}
                  <div className="w-full">
                    <ListingGrid
                      listings={filteredListings}
                      isLoading={isFilteringLoading}
                      savedIds={savedIds}
                      onToggleSave={toggleSaveListing}
                      onViewDetails={(listing) => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setView({ type: 'project', listing });
                      }}
                      onResetFilters={resetFilters}
                      activeFilterSummary={
                        filters.category !== 'All' ? `Category: ${filters.category}` : undefined
                      }
                      onDeleteListing={isAdmin ? handleDeleteListing : undefined}
                    />
                  </div>
                </div>
              </section>
            </>
          )}

          {/* SAVED FAVORITES VIEW */}
          {view.type === 'saved' && (
            <section className="w-full px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-16 space-y-6">
              <div className="border-b border-[#E2DDD3] pb-4 flex items-center justify-between">
                <div>
                  <h1 className="font-serif font-bold text-3xl text-[#2C2A26]">
                    Your Saved Projects ({savedIds.length})
                  </h1>
                  <p className="text-sm text-[#5D5A53]">
                    Bookmark and compare verified SaaS platforms and digital assets
                  </p>
                </div>

                <button
                  onClick={() => handleNavigate('home')}
                  className="px-4 py-2 bg-white border border-[#E2DDD3] rounded-xl text-xs font-semibold text-[#2C2A26]"
                >
                  Explore Marketplace
                </button>
              </div>

              <ListingGrid
                listings={filteredListings}
                isLoading={isFilteringLoading}
                savedIds={savedIds}
                onToggleSave={toggleSaveListing}
                onViewDetails={(listing) => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setView({ type: 'project', listing });
                }}
                onResetFilters={() => handleNavigate('home')}
                onDeleteListing={isAdmin ? handleDeleteListing : undefined}
              />
            </section>
          )}

          {/* DYNAMIC PROJECT DETAILS VIEW */}
          {view.type === 'project' && (
            <ProjectDetails
              listing={view.listing}
              onBack={() => handleNavigate('home', 'marketplace')}
              isSaved={savedIds.includes(view.listing.id)}
              onToggleSave={toggleSaveListing}
              onOpenBuyerDelivery={(orderId) => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setView({ type: 'buyer-delivery', orderId });
              }}
              onNavigateMessages={() => handleNavigate('buyer-messages')}
            />
          )}

          {/* BUYER DELIVERY CENTER VIEW */}
          {view.type === 'buyer-delivery' && (() => {
            const orderObj = getOrderById(view.orderId);
            if (!orderObj) {
              return (
                <div className="max-w-4xl mx-auto pt-10 pb-16 text-center space-y-4">
                  <h2 className="font-serif font-bold text-2xl text-[#2C2A26]">Order Not Found</h2>
                  <button onClick={() => handleNavigate('home')} className="px-4 py-2 bg-[#2C2A26] text-white rounded-xl">
                    Back to Marketplace
                  </button>
                </div>
              );
            }
            return (
              <div className="pt-6 lg:pt-8 px-4 sm:px-6 lg:px-8">
                <BuyerDeliveryCenter
                  order={orderObj}
                  onBack={() => handleNavigate('home')}
                  onOrderUpdated={() => setView({ ...view })}
                />
              </div>
            );
          })()}

          {/* SELLER DELIVERY CENTER VIEW */}
          {view.type === 'seller-delivery' && (() => {
            const orderObj = getOrderById(view.orderId);
            if (!orderObj) {
              return (
                <div className="max-w-4xl mx-auto pt-10 pb-16 text-center space-y-4">
                  <h2 className="font-serif font-bold text-2xl text-[#2C2A26]">Order Not Found</h2>
                  <button onClick={() => handleNavigate('sell')} className="px-4 py-2 bg-[#2C2A26] text-white rounded-xl">
                    Back to Seller Dashboard
                  </button>
                </div>
              );
            }
            return (
              <div className="pt-6 lg:pt-8 px-4 sm:px-6 lg:px-8">
                <SellerDeliveryCenter
                  order={orderObj}
                  onBack={() => handleNavigate('sell')}
                  onOrderUpdated={() => setView({ ...view })}
                />
              </div>
            );
          })()}

        {/* SELL YOUR PROJECT VIEW */}
        {view.type === 'sell' && (
          <SellProject
            onBackToMarketplace={() => handleNavigate('home')}
            onViewPublicListing={(listing) => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setView({ type: 'project', listing });
            }}
            initialSubTab={view.initialSubTab}
            projectId={view.projectId}
          />
        )}

        {/* ADMIN DASHBOARD VIEW */}
        {view.type === 'admin' && (
          <AdminDashboard
            onBackToMarketplace={() => handleNavigate('home')}
            initialSubTab={view.initialSubTab}
          />
        )}

        {/* ON-DEMAND CUSTOM BUILDS VIEW */}
        {view.type === 'on-demand' && (
          <OnDemandCustomPage
            onNavigateHome={() => handleNavigate('home')}
          />
        )}

        {/* CUSTOM BUYER WORKSPACE VIEWS */}
        {view.type === 'categories' && (
          <CategoriesPage
            onSelectCategory={(cat) => handleFilterChange({ category: cat })}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}

        {view.type === 'buyer-purchases' && (
          <BuyerPurchasesPage />
        )}

        {view.type === 'buyer-orders' && (
          <BuyerOrdersPage
            onOpenDelivery={(orderId) => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setView({ type: 'buyer-delivery', orderId });
            }}
          />
        )}

        {view.type === 'buyer-messages' && (
          <BuyerMessagesPage 
            onNavigateHome={() => handleNavigate('home', 'marketplace')} 
            userRole={userRole}
          />
        )}

        {view.type === 'buyer-account' && (
          <BuyerAccountPage />
        )}
      </main>

      {/* Footer */}
      <Footer
        onCategoryClick={(cat) => {
          handleNavigate('home', 'marketplace');
          handleFilterChange({ category: cat });
        }}
        onSellClick={() => handleNavigate('sell')}
        onAdminClick={() => handleNavigate('admin')}
        onContactAdmin={() => setIsContactAdminOpen(true)}
      />

      {/* AI Marketplace Concierge Chat Widget */}
      <Assistant />

      {/* Direct Contact Administration Modal */}
      <ContactAdminModal
        isOpen={isContactAdminOpen}
        onClose={() => setIsContactAdminOpen(false)}
        userRole={userRole}
      />

      {/* Account / Login Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        savedCount={savedIds.length}
        onViewSaved={() => handleNavigate('saved')}
        onAuthenticated={(user) => {
          setCurrentUser(user);
          if (user) {
            const role = user.app_metadata?.role;
            if (role === 'admin') {
              setUserRole('SUPER_ADMIN');
              setView({ type: 'admin' });
              window.location.hash = 'admin';
            } else {
              setUserRole('BUYER');
              setView({ type: 'home' });
            }
          } else {
            setUserRole('BUYER');
            setView({ type: 'home' });
          }
          setIsAccountModalOpen(false);
        }}
        isRequired={!currentUser}
      />
      </div>
    </div>
    </I18nProvider>
  );
}

export default App;
