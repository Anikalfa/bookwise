import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './context/AppContext';
import { Sparkles, Star, Clock, TrendingUp } from 'lucide-react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import ProfileDrawer from './components/profile/ProfileDrawer';
import AnalyticsDashboard from './components/profile/AnalyticsDashboard';
import HeroCarousel from './components/home/HeroCarousel';
import CategoryRow from './components/home/CategoryRow';
import BookCard from './components/home/BookCard';
import OnboardingBanner from './components/home/OnboardingBanner';
import api from './services/api';
import { Skeleton, Button } from './components/ui';

import AuthModal from './components/AuthModal';
import BookModal from './components/BookModal';
import DiscoveryModal from './components/DiscoveryModal';
import SearchModal from './components/SearchModal';
import AuthorsView from './components/AuthorsView';
import CategoriesView from './components/CategoriesView';

import { motion, AnimatePresence } from 'framer-motion';

function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 animate-mesh opacity-40" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-200/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/20 blur-[120px]" />
    </div>
  );
}

function TopPicksCarousel({ recs, lang, onSelectBook, reason }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: 220, behavior: 'smooth' });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [recs]);

  return (
    <section className="mb-24 relative">
      {/* Background Decorative Mesh for the Section */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-500">
              {reason && reason.toLowerCase().includes('popular')
                ? (lang === 'bn' ? 'জনপ্রিয় বই' : 'Trending Now')
                : (lang === 'bn' ? 'আপনার জন্য' : 'Personalized For You')}
            </p>
            {!reason.toLowerCase().includes('popular') && (
              <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 text-[8px] font-black uppercase tracking-widest border border-brand-200/50 flex items-center gap-1">
                <Sparkles className="w-2 h-2" />
                Neural Engine
              </span>
            )}
          </div>
          
          <h3 className="text-4xl md:text-5xl font-serif font-black text-primary italic tracking-tight leading-none mb-4">
            {reason && reason.toLowerCase().includes('popular')
              ? (lang === 'bn' ? 'সেরা জনপ্রিয় বই' : 'Popular Picks')
              : (lang === 'bn' ? 'আপনার সেরা পছন্দ' : 'Your Top Picks')}
          </h3>
          
          {reason && (
            <p className="max-w-md text-xs text-secondary font-medium leading-relaxed opacity-80 border-l-2 border-brand-200 pl-4">
              {reason}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="h-px w-24 md:w-48 bg-gradient-to-r from-brand-200 to-transparent hidden md:block" />
          <Button variant="ghost" size="sm" className="rounded-full px-6 text-[10px] font-black uppercase tracking-widest" onClick={() => scrollRef.current?.scrollBy({left: 400, behavior: 'smooth'})}>
            Explore More →
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto pb-8 -mx-4 px-4 snap-x scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {recs.slice(0, 10).map((book, i) => (
          <motion.div 
            key={book.book_id} 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5, type: 'spring' }}
            className="min-w-[200px] max-w-[200px] snap-start shrink-0"
          >
            <BookCard book={book} lang={lang} onClick={() => onSelectBook(book.book_id)} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const { lang, user } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [discoveryType, setDiscoveryType] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filter, setFilter] = useState({ type: null, value: null, label: null });
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'analytics'
  const [recs, setRecs] = useState([]);
  const [recsReason, setRecsReason] = useState('');
  const [featured, setFeatured] = useState([]);
  const [featuredMode, setFeaturedMode] = useState('top');
  const [loading, setLoading] = useState(true);
  const [isCold, setIsCold] = useState(false);

  const fetchRecs = async () => {
    try {
      // If a category filter is active, pass it to the recommender to boost that genre
      let url = '/recommendations';
      if (filter.type === 'categories' && filter.value) {
        url += `?category_id=${filter.value}`;
      }
      const res = await api.get(url);
      const recList = res.data.recommendations || [];
      setRecs(recList);
      setRecsReason(res.data.reason || '');
      setIsCold(!!res.data.is_cold_start);
    } catch (err) { console.error(err); }
  };

  // ── State Reset on User Change ──────────────────────────────────
  useEffect(() => {
    // Clear data immediately when user changes to prevent "flashing" old user data
    setFeatured([]);
    setRecs([]);
    setRecsReason('');
    setIsCold(false);
    setLoading(true);
    setCurrentView('home');
    setSelectedBook(null);
    setFilter({ type: null, value: null, label: null });
  }, [user?.user_id]);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      if (!user) return; // Wait for user to be available
      try {
        setLoading(true);
        let url = `/books/browse?limit=12&sort=${featuredMode}`;
        if (filter.type && filter.value) {
          const key = filter.type === 'categories' ? 'category_id' :
            filter.type === 'authors' ? 'author_id' : 'publisher_id';
          url = `/books/browse?${key}=${filter.value}&limit=18&sort=${featuredMode}`;
        }
        const featRes = await api.get(url);
        if (!active) return;
        setFeatured(featRes.data || []);
        await fetchRecs();
      } catch (err) {
        if (active) console.error('Fetch error:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [user, refreshTrigger, filter, featuredMode]);

  const handleBookSelect = async (bookId) => {
    setSelectedBook(bookId);
    if (!bookId || !user) return;
    
    try {
      // Record click interaction in background
      await api.post(`/books/${bookId}/click`);
      // Re-fetch recommendations to show real-time dynamic shift
      await fetchRecs();
    } catch (err) {
      console.error('Click tracking error:', err);
    }
  };

  const handleInteraction = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchRecs();
  };

  const handleDiscoverySelect = (type, item) => {
    const id = item.category_id || item.author_id || item.publisher_id || item.id;
    const name = item.category_name || item.author_name || item.name || item.category_name_bn;
    setFilter({ type, value: id, label: name });
    setDiscoveryType(null);
  };

  const clearFilter = () => {
    setFilter({ type: null, value: null, label: null });
  };

  const handleLogoClick = () => {
    clearFilter();
    setCurrentView('home');
  };

  // If user is not logged in, force auth modal open
  if (!user) {
    return (
      <div className="min-h-screen">
        <AuthModal
          isOpen={true}
          onClose={() => { }} // Cannot close when not logged in
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24">
      <MeshBackground />
      <AnimatePresence mode="wait">
        {currentView === 'analytics' ? (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <AnalyticsDashboard 
              lang={lang} 
              user={user} 
              refreshTrigger={refreshTrigger}
              onBack={() => setCurrentView('home')}
              onSelectBook={handleBookSelect}
            />
          </motion.div>
        ) : currentView === 'authors' ? (
          <motion.div
            key="authors"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <AuthorsView
              lang={lang}
              onBack={() => setCurrentView('home')}
              onSelectAuthor={(id, name) => {
                setFilter({ type: 'authors', value: id, label: name });
                setCurrentView('home');
              }}
            />
          </motion.div>
        ) : currentView === 'categories' ? (
          <motion.div
            key="categories"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <CategoriesView
              lang={lang}
              onBack={() => setCurrentView('home')}
              onSelectCategory={(id, name) => {
                setFilter({ type: 'categories', value: id, label: name });
                setCurrentView('home');
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Navbar
              onOpenSidebar={() => setSidebarOpen(true)}
              onOpenProfile={() => setProfileOpen(true)}
              onOpenAuth={() => setAuthOpen(true)}
              onLogoClick={handleLogoClick}
              onSelectBook={handleBookSelect}
              onOpenSearch={() => setSearchOpen(true)}
              currentView={currentView}
              setCurrentView={setCurrentView}
            />

            <HeroCarousel lang={lang} />
            <main className="max-w-7xl mx-auto px-4 pt-16">
              {isCold && (
                <OnboardingBanner lang={lang} username={user?.username || 'Guest'} />
              )}

              {!isCold && recs.length > 0 && (
                <TopPicksCarousel recs={recs} lang={lang} onSelectBook={handleBookSelect} reason={recsReason} />
              )}
            </main>
            
            <CategoryRow lang={lang} onSelect={(id, name) => setFilter({ type: 'categories', value: id, label: name })} />

            <main className="max-w-7xl mx-auto px-4 pb-16">
              <section className="pt-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-px w-8 bg-brand-500 rounded-full" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-600">
                        {lang === 'bn' ? 'বুকওয়াইজ লাইব্রেরি' : 'BookWise Library'}
                      </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-black text-primary tracking-tight">
                      {filter.label ? (lang === 'bn' ? `${filter.label} এর বই` : `${filter.label} Collection`) : (lang === 'bn' ? 'সেরা সকল বই' : 'Featured Books')}
                    </h2>
                  </div>

                  <div className="flex items-center bg-surface-alt/50 p-1.5 rounded-2xl border border-border shadow-inner backdrop-blur-md">
                    {[
                      { id: 'top', label: lang === 'bn' ? 'সেরা রেটিং' : 'Top Rated', icon: Star },
                      { id: 'new', label: lang === 'bn' ? 'নতুন বই' : 'New Arrivals', icon: Clock },
                      { id: 'popular', label: lang === 'bn' ? 'জনপ্রিয়' : 'Popular', icon: TrendingUp }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setFeaturedMode(mode.id)}
                        className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${featuredMode === mode.id ? 'text-white' : 'text-secondary hover:text-primary'}`}
                      >
                        {featuredMode === mode.id && (
                          <motion.div
                            layoutId="featured-bg"
                            className="absolute inset-0 premium-gradient rounded-xl shadow-lg shadow-brand-500/20"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <mode.icon className={`w-3.5 h-3.5 relative z-10 ${featuredMode === mode.id ? 'text-white' : 'text-brand-500'}`} />
                        <span className="relative z-10">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="flex flex-col gap-4">
                        <Skeleton className="aspect-[3/4] rounded-xl" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                    {featured.map(book => (
                      <BookCard key={book.book_id} book={book} lang={lang} onClick={() => handleBookSelect(book.book_id)} />
                    ))}
                  </div>
                )}
              </section>
            </main>

            <footer className="bg-surface/30 backdrop-blur-md border-t border-border py-16 text-center mt-20">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-8 premium-gradient rounded-lg flex items-center justify-center">
                  <span className="text-lg">📚</span>
                </div>
                <h1 className="text-xl font-black text-primary tracking-tighter">
                  REC<span className="text-brand-600 font-serif font-light italic">Book</span>
                </h1>
              </div>
              <p className="text-sm text-secondary font-medium tracking-widest uppercase">
                {lang === 'bn' ? 'বইমেলা ২০২৬ - এর একটি ক্ষুদ্র উপহার' : 'A small gift for Boimela 2026'}
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared Modals & Global UI */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />

      <BookModal
        bookId={selectedBook}
        isOpen={!!selectedBook}
        onClose={() => handleBookSelect(null)}
        lang={lang}
        onInteraction={fetchRecs}
      />

      <DiscoveryModal
        type={discoveryType}
        isOpen={!!discoveryType}
        onClose={() => setDiscoveryType(null)}
        lang={lang}
        onSelect={handleDiscoverySelect}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        lang={lang}
        onSelectBook={handleBookSelect}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        lang={lang}
        onSelectItem={(key) => {
          if (key === 'authors') {
            setCurrentView('authors');
          } else if (key === 'categories') {
            setCurrentView('categories');
          } else if (['publishers'].includes(key)) {
            setDiscoveryType(key);
          } else if (key === 'home') {
            clearFilter();
            setCurrentView('home');
          }
        }}
      />

      <ProfileDrawer
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        lang={lang}
        user={user}
        onSelectBook={handleBookSelect}
        onExpand={() => {
          setCurrentView('analytics');
          setProfileOpen(false);
        }}
      />
    </div>
  );
}
