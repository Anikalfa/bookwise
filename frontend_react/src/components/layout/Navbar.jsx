import React, { useState, useEffect } from 'react';
import { Menu, Search, User, LogOut, Globe, Moon, Sun, Home, BarChart2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui';
import { motion } from 'framer-motion';

export default function Navbar({ onOpenSidebar, onOpenProfile, onOpenAuth, onLogoClick, onOpenSearch, currentView, setCurrentView }) {
    const { user, logout, lang, setLang, darkMode, toggleDarkMode } = useApp();
    const [isScrolled, setIsScrolled] = useState(false);
    const bn = lang === 'bn';

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-6 inset-x-4 z-50 max-w-6xl mx-auto transition-all duration-700 rounded-[2rem] ${isScrolled
            ? 'bg-surface-alt/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]'
            : 'bg-surface/5 backdrop-blur-xl'
            } border border-border overflow-hidden ring-1 ring-white/10 shadow-xl`}>
            {/* Ambient Inner Glow */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent z-0" />

            <div className="relative px-8 h-20 flex items-center justify-between gap-8 z-10">
                {/* Logo Section */}
                <div className="flex items-center gap-6 shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onOpenSidebar}
                        className="p-3 text-primary hover:bg-white/10 rounded-2xl transition-all active:scale-95"
                    >
                        <Menu className="w-6 h-6" />
                    </Button>

                    <div onClick={onLogoClick} className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shadow-2xl shadow-brand-500/30 transition-all group-hover:scale-110 group-hover:rotate-6">
                            <span className="text-lg">📚</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-primary hidden sm:block">
                            REC<span className="text-brand-600 font-serif font-light italic">Book</span>
                        </h1>
                    </div>
                </div>

                {/* Central Navigation */}
                <div className="hidden lg:flex items-center gap-8 shrink-0 relative px-2">
                    <button
                        onClick={() => setCurrentView('home')}
                        className={`relative flex items-center gap-2.5 py-2.5 transition-all duration-500 group`}
                    >
                        <Home className={`w-4.5 h-4.5 transition-colors duration-500 ${currentView === 'home' ? 'text-brand-500' : 'text-slate-400 group-hover:text-primary'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${currentView === 'home' ? 'text-primary' : 'text-secondary group-hover:text-primary'}`}>
                            {bn ? 'হোম' : 'Home'}
                        </span>
                        {currentView === 'home' && (
                            <motion.div
                                layoutId="nav-underglow"
                                className="absolute -bottom-1 left-0 right-0 h-[3px] bg-brand-500 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.8)]"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                    </button>

                    <button
                        onClick={() => setCurrentView('analytics')}
                        className={`relative flex items-center gap-2.5 py-2.5 transition-all duration-500 group`}
                    >
                        <BarChart2 className={`w-4.5 h-4.5 transition-colors duration-500 ${currentView === 'analytics' ? 'text-brand-500' : 'text-slate-400 group-hover:text-primary'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${currentView === 'analytics' ? 'text-primary' : 'text-secondary group-hover:text-primary'}`}>
                            {bn ? 'অ্যানালিটিক্স' : 'Analytics'}
                        </span>
                        {currentView === 'analytics' && (
                            <motion.div
                                layoutId="nav-underglow"
                                className="absolute -bottom-1 left-0 right-0 h-[3px] bg-brand-500 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.8)]"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                    </button>
                </div>

                {/* Modernized Search Bar Trigger */}
                <div className="flex-1 max-w-md relative group p-1" onClick={onOpenSearch}>
                    <div className="relative">
                        <div
                            className={`w-full pl-12 pr-12 py-3 rounded-[1.25rem] text-sm transition-all duration-500 cursor-text flex items-center h-12 shadow-sm bg-surface-alt/60 text-secondary ring-1 ring-border border-border`}
                        >
                            {bn ? "খুঁজুন..." : "Find your next adventure..."}
                        </div>
                        <Search className={`absolute left-4.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-500 text-secondary group-hover:text-brand-500`} />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center">
                            <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-500/20 text-secondary bg-slate-500/5`}>
                                {bn ? 'সার্চ' : 'Search'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleDarkMode}
                        className="p-3 text-primary hover:bg-white/10 rounded-[1.25rem] hidden sm:flex transition-all active:scale-95"
                    >
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 shadow-sm" />}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={setLang}
                        className="hidden lg:flex items-center gap-2.5 text-primary hover:bg-white/10 rounded-[1.25rem] transition-all px-4 h-12"
                    >
                        <Globe className="w-4 h-4 text-brand-500" />
                        <span className="text-[11px] font-black tracking-[0.2em]">{lang === 'bn' ? 'EN' : 'বাং'}</span>
                    </Button>

                    {user ? (
                        <div className="flex items-center gap-2 ml-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={onOpenProfile}
                                className="w-12 h-12 rounded-[1.25rem] !px-0 flex items-center justify-center bg-brand-600 shadow-2xl shadow-brand-500/40 hover:scale-105 active:scale-95 transition-all ring-2 ring-white/10"
                            >
                                <User className="w-5 h-5 text-white" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={logout}
                                className="w-12 h-12 rounded-[1.25rem] !px-0 flex items-center justify-center text-primary hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95"
                                title={bn ? 'সাইন আউট' : 'Sign Out'}
                            >
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={onOpenAuth}
                            className="rounded-[1.25rem] px-8 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] bg-brand-600 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-500/20 h-12"
                        >
                            {bn ? 'সাইন ইন' : 'Sign In'}
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    );
}
