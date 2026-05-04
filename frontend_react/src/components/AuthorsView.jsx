import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Hash, BookOpen, Search, Loader2, ChevronRight } from 'lucide-react';
import { Button } from './ui';
import api from '../services/api';

const TOP_AUTHORS = [
    { rank: 1, name: 'Rabindranath Tagore', count: '1,425', id: 1 }, // Adjusted with IDs if known or handle via name
    { rank: 2, name: 'Bibhutibhushan Bandyopadhyay', count: '868', id: null },
    { rank: 3, name: 'Maulana Ashraf Ali Thanvi', count: '619', id: null },
    { rank: 4, name: 'Mufti Muhammad Taqi Usmani', count: '569', id: null },
    { rank: 5, name: 'Rakib Hasan', count: '561', id: null },
    { rank: 6, name: 'Sunil Gangopadhyay', count: '552', id: null },
    { rank: 7, name: 'Humayun Ahmed', count: '506', id: null },
    { rank: 8, name: 'Dale Carnegie', count: '390', id: null },
    { rank: 9, name: 'Anisul Haque', count: '341', id: null },
    { rank: 10, name: 'Sarat Chandra Chattopadhyay', count: '284', id: null },
];

export default function AuthorsView({ lang, onBack, onSelectAuthor }) {
    const bn = lang === 'bn';
    const [search, setSearch] = useState('');
    const [authors, setAuthors] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.get('/meta/authors')
            .then(res => {
                setAuthors(Array.isArray(res.data) ? res.data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const filteredAuthors = authors.filter(a => {
        const name = (a.author_name || a.name || '').toLowerCase();
        return name.includes(search.toLowerCase());
    });

    const handleSelect = (author) => {
        let id = author.author_id || author.id;
        let name = author.author_name || author.name;

        // If id is null (hardcoded top authors), look up the real author_id from fetched list
        if (!id && authors.length > 0) {
            const match = authors.find(a => {
                const aName = (a.author_name || a.name || '').toLowerCase().trim();
                return aName === name.toLowerCase().trim();
            });
            if (match) {
                id = match.author_id || match.id;
                name = match.author_name || match.name;
            }
        }

        onSelectAuthor(id, name);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-20 pb-40">
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
                        <Users className="w-6 h-6 text-white" />
                    </div>
                </div>
            </motion.div>

            {/* Title Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-16"
            >
                <h2 className="text-5xl md:text-6xl font-serif font-black text-primary mb-4 italic">
                    {bn ? 'শীর্ষ লেখকগণ' : 'Top Authors'}
                </h2>
                <div className="h-1.5 w-24 bg-brand-600 mx-auto rounded-full shadow-[0_0_20px_rgba(30,64,175,0.3)]" />

                {/* Search Bar */}
                <div className="relative mt-12 max-w-xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder={bn ? 'লেখক খুঁজুন...' : 'Search for an author...'}
                        className="w-full pl-12 pr-4 py-4 bg-surface-alt/50 backdrop-blur-md border-2 border-border rounded-2xl text-lg text-primary placeholder:text-secondary focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
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
                    className="grid grid-cols-1 gap-3"
                >
                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-xs font-black uppercase tracking-widest">{bn ? 'খুঁজছি...' : 'Searching Authors...'}</span>
                        </div>
                    ) : filteredAuthors.length > 0 ? (
                        filteredAuthors.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelect(item)}
                                className="flex items-center justify-between p-6 bg-surface-alt/40 glass border-2 border-transparent hover:border-brand-500 transition-all rounded-[1.5rem] group text-left"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-serif italic text-sm group-hover:premium-gradient transition-all">
                                        {idx + 1}
                                    </div>
                                    <span className="text-xl font-serif text-primary group-hover:text-brand-950 transition-colors">
                                        {item.author_name || item.name}
                                    </span>
                                </div>
                                <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                            </button>
                        ))
                    ) : (
                        <div className="py-20 text-center text-slate-400 italic">
                            <p>{bn ? 'কিছু পাওয়া যায়নি' : 'No authors matched your search'}</p>
                        </div>
                    )}
                </motion.div>
            ) : (
                /* Top Authors Chart */
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass rounded-[2.5rem] overflow-hidden border-white/40 shadow-2xl relative"
                >
                    {/* Table Header */}
                    <div className="grid grid-cols-[100px_1fr_150px] bg-primary/5 backdrop-blur-md px-8 py-6 border-b border-border">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
                            <Hash className="w-3.5 h-3.5" />
                            {bn ? 'র‍্যাঙ্ক' : 'Rank'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
                            <Users className="w-3.5 h-3.5" />
                            {bn ? 'লেখকের নাম' : 'Author Name'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-secondary justify-end">
                            <BookOpen className="w-3.5 h-3.5" />
                            {bn ? 'বই সংখ্যা' : '# Books'}
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-border bg-surface-alt/40">
                        {TOP_AUTHORS.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.05 }}
                                className="grid grid-cols-[100px_1fr_150px] px-8 py-5 items-center hover:bg-white/60 transition-colors group cursor-pointer"
                                onClick={() => handleSelect({ author_name: item.name, author_id: item.id })}
                            >
                                <span className={`text-lg font-serif italic ${i < 3 ? 'text-brand-600 font-black' : 'text-secondary'}`}>
                                    {item.rank}
                                </span>
                                <span className="font-serif text-xl text-primary transition-all group-hover:translate-x-1 group-hover:text-brand-700">
                                    {item.name}
                                </span>
                                <div className="flex justify-end">
                                    <span className="bg-slate-900 text-white px-4 py-1 rounded-full text-xs font-black tracking-tighter">
                                        {item.count}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-brand-500/5 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />
                </motion.div>
            )}
        </div>
    );
}
