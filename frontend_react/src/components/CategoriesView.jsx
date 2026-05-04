import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Star, Search, Loader2, ChevronRight, Hash, Layers } from 'lucide-react';
import { Button } from './ui';
import api from '../services/api';

const POPULAR_CATEGORIES = [
    { rank: 1, name: 'English Grammar and Language Learning', books: 491, reviews: 10905, id: null },
    { rank: 2, name: 'Computer, Internet, Freelancing and Outsourcing', books: 1181, reviews: 9501, id: null },
    { rank: 3, name: 'Self-Help, Motivational and Meditation', books: 1826, reviews: 9560, id: null },
    { rank: 4, name: 'Language & Dictionary', books: 55, reviews: 9474, id: null },
    { rank: 5, name: 'Contemporary Novel', books: 836, reviews: 6819, id: null },
    { rank: 6, name: 'Islamic Ideal', books: 318, reviews: 7476, id: null },
    { rank: 7, name: 'Career Development', books: 642, reviews: 5586, id: null },
    { rank: 8, name: 'Thriller', books: 569, reviews: 4691, id: null },
    { rank: 9, name: 'Sirate Rasul S.A.W', books: 1431, reviews: 5378, id: null },
    { rank: 10, name: 'Novel: Thriller & Adventure', books: 565, reviews: 4291, id: null },
    { rank: 11, name: 'IELTS', books: 184, reviews: 4840, id: null },
    { rank: 12, name: 'Mystery, Detective, Horror, Thriller and Adventure', books: 1117, reviews: 4066, id: null },
    { rank: 13, name: 'Computer Programming', books: 760, reviews: 4917, id: null },
    { rank: 14, name: 'July Triumph!!', books: 1170, reviews: 3397, id: null },
    { rank: 15, name: 'Student Life Development', books: 167, reviews: 3667, id: null },
];

export default function CategoriesView({ lang, onBack, onSelectCategory }) {
    const bn = lang === 'bn';
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.get('/meta/categories')
            .then(res => {
                setCategories(Array.isArray(res.data) ? res.data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const filteredCategories = categories.filter(c => {
        const name = (c.category_name || c.name || '').toLowerCase();
        const bnName = (c.category_name_bn || c.bn_name || '').toLowerCase();
        return name.includes(search.toLowerCase()) || bnName.includes(search.toLowerCase());
    });

    const handleSelect = (category) => {
        let id = category.category_id || category.id;
        let name = category.category_name || category.name;

        // If id is null (hardcoded popular categories), look up real id from fetched list
        if (!id && categories.length > 0) {
            const match = categories.find(c => {
                const cName = (c.category_name || c.name || '').toLowerCase().trim();
                return cName === name.toLowerCase().trim();
            });
            if (match) {
                id = match.category_id || match.id;
                name = bn ? (match.category_name_bn || match.bn_name || match.category_name || match.name) : (match.category_name || match.name);
            }
        } else if (bn) {
            const match = categories.find(c => (c.category_id || c.id) === id);
            if (match) {
                name = (match.category_name_bn || match.bn_name || match.category_name || match.name);
            }
        }

        onSelectCategory(id, name);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-20 pb-40">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-12"
            >
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="group flex items-center gap-2 text-secondary hover:text-brand-600 px-0"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold uppercase tracking-widest text-xs">
                        {bn ? 'ফিরে যান' : 'Back to Home'}
                    </span>
                </Button>

                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 premium-gradient rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                        <Layers className="w-6 h-6 text-white" />
                    </div>
                </div>
            </motion.div>

            {/* Title & Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-20"
            >
                <h2 className="text-5xl md:text-7xl font-serif font-black text-primary mb-6 italic tracking-tight">
                    {bn ? 'বিষয় সমূহ' : 'Explore Categories'}
                </h2>
                <div className="h-1.5 w-32 bg-brand-600 mx-auto rounded-full shadow-[0_0_25px_rgba(2,132,199,0.4)]" />

                <div className="relative mt-16 max-w-2xl mx-auto">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <input
                        type="text"
                        placeholder={bn ? 'পছন্দের বিষয় খুঁজুন...' : 'Search for a category...'}
                        className="w-full pl-14 pr-6 py-5 bg-surface-alt/60 backdrop-blur-xl border-2 border-border rounded-[2rem] text-xl text-primary placeholder:text-secondary focus:ring-8 focus:ring-brand-500/5 focus:border-brand-500 transition-all outline-none shadow-xl shadow-black/5 uppercase font-bold tracking-tight"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </motion.div>

            {search.length > 0 ? (
                /* Search Results */
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {loading ? (
                        <div className="col-span-full py-20 flex flex-col items-center gap-5 text-slate-400">
                            <Loader2 className="w-10 h-10 animate-spin" />
                            <span className="text-xs font-black uppercase tracking-widest italic">{bn ? 'খুঁজছি...' : 'Updating Library...'}</span>
                        </div>
                    ) : filteredCategories.length > 0 ? (
                        filteredCategories.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelect(item)}
                                className="flex items-center justify-between p-6 bg-surface-alt/40 glass border-2 border-transparent hover:border-brand-500 transition-all rounded-[1.5rem] group text-left"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-serif italic text-sm group-hover:premium-gradient transition-all shadow-lg group-hover:shadow-brand-500/20">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <span className="text-xl font-serif text-primary group-hover:text-brand-950 block transition-colors">
                                            {bn ? (item.category_name_bn || item.bn_name || item.category_name || item.name) : (item.category_name || item.name)}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                            </button>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-slate-400 italic">
                            <p>{bn ? 'কিছু পাওয়া যায়নি' : 'No categories found matching your search'}</p>
                        </div>
                    )}
                </motion.div>
            ) : (
                /* Professional Popular Categories Section */
                <section>
                    <div className="flex items-center gap-4 mb-10 overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 whitespace-nowrap">
                            {bn ? 'জনপ্রিয় বিভাগসমূহ' : 'Categories with the Most Reviews'}
                        </span>
                        <div className="h-px w-full bg-border" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {POPULAR_CATEGORIES.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.05 }}
                                onClick={() => handleSelect({ category_name: item.name, category_id: item.id })}
                                className="group relative bg-slate-900 border border-slate-700/50 p-8 rounded-[2.5rem] hover:shadow-2xl hover:shadow-brand-500/20 hover:border-brand-500/30 transition-all cursor-pointer overflow-hidden"
                            >
                                {/* Rank Badge */}
                                <div className="absolute top-0 right-0 w-20 h-20 bg-slate-800 flex items-center justify-center rounded-bl-[2.5rem] group-hover:bg-slate-700 transition-colors">
                                    <span className="text-2xl font-serif italic font-black text-slate-600 group-hover:text-brand-400">
                                        #{item.rank}
                                    </span>
                                </div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-7 h-7" />
                                    </div>

                                    <h3 className="text-2xl font-serif font-black text-white mb-4 leading-tight group-hover:text-brand-200 transition-colors">
                                        {item.name}
                                    </h3>

                                    <div className="mt-auto flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Books</span>
                                            <span className="text-sm font-bold text-slate-300">{item.books.toLocaleString()}</span>
                                        </div>
                                        <div className="w-px h-8 bg-slate-700" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Reviews</span>
                                            <span className="text-sm font-bold text-amber-400">{item.reviews.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/[0.04] transition-colors" />
                            </motion.div>
                        ))}
                    </div>

                    {/* Decorative Elements */}
                    <div className="fixed top-0 right-0 -mr-40 -mt-40 w-[40rem] h-[40rem] bg-brand-500/5 rounded-full blur-[150px] pointer-events-none" />
                    <div className="fixed bottom-0 left-0 -ml-40 -mb-40 w-[30rem] h-[30rem] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
                </section>
            )}
        </div>
    );
}
