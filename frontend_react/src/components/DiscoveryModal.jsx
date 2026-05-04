import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight, Loader2, Users, BookOpen, Building } from 'lucide-react';
import { Button, Badge } from './ui';
import api from '../services/api';

export default function DiscoveryModal({ type, isOpen, onClose, lang, onSelect }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const bn = lang === 'bn';

    const ICONS = {
        authors: Users,
        categories: BookOpen,
        publishers: Building
    };

    const TITLES = {
        authors: { bn: 'লেখক তালিকা', en: 'Authors List' },
        categories: { bn: 'বিষয় তালিকা', en: 'Categories List' },
        publishers: { bn: 'প্রকাশনী তালিকা', en: 'Publishers List' }
    };

    useEffect(() => {
        if (isOpen && type) {
            setLoading(true);
            setSearch('');
            api.get(`/meta/${type}`)
                .then(res => {
                    setItems(Array.isArray(res.data) ? res.data : []);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [isOpen, type]);

    const filteredItems = items.filter(item => {
        const name = (item.name || item.category_name || item.author_name || '').toLowerCase();
        const bnName = (item.bn_name || item.category_name_bn || '').toLowerCase();
        return name.includes(search.toLowerCase()) || bnName.includes(search.toLowerCase());
    });

    const Icon = ICONS[type] || BookOpen;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative glass w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px,rgba(0,0,0,0.3)] flex flex-col max-h-[85vh] border-white/40"
                    >
                        <div className="premium-gradient p-8 text-white relative shrink-0">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-serif font-bold">{TITLES[type]?.[lang]}</h2>
                                    <p className="text-white/60 text-xs font-medium tracking-widest uppercase">
                                        Browse and discover your next favorite
                                    </p>
                                </div>
                            </div>

                            <div className="relative mt-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder={bn ? 'খুঁজুন...' : 'Search...'}
                                    className="w-full pl-11 pr-4 py-3 bg-white/10 border-none rounded-xl text-sm placeholder:text-white/30 focus:ring-2 focus:ring-amber-400 text-white transition-all"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-primary">
                            {loading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-4 text-secondary">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <span className="text-xs font-black uppercase tracking-widest italic">{bn ? 'খুঁজছি...' : 'Loading labels...'}</span>
                                </div>
                            ) : filteredItems.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2">
                                    {filteredItems.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onSelect(type, item)}
                                            className="flex items-center justify-between p-4 bg-secondary border border-border-color rounded-2xl hover:border-brand-300 hover:shadow-md hover:shadow-brand-900/5 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-brand-600 font-bold text-xs group-hover:bg-brand-50 transition-colors">
                                                    {idx + 1}
                                                </div>
                                                <span className="font-bold text-primary group-hover:text-brand-700 transition-colors">
                                                    {bn ? (item.bn_name || item.category_name_bn || item.name || item.category_name || item.author_name) : (item.name || item.category_name || item.author_name)}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-secondary opacity-50 italic">
                                    <Search className="w-12 h-12 mb-4" />
                                    <p>{bn ? 'কিছু পাওয়া যায়নি' : 'No matches found'}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
