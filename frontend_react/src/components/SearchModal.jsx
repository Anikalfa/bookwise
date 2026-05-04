import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function SearchModal({ isOpen, onClose, lang, onSelectBook }) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const bn = lang === 'bn';

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSuggestions([]);
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.get(`/books/search?q=${encodeURIComponent(query)}`);
                setSuggestions(res.data.slice(0, 8));
                setSelectedIndex(0);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const highlightMatch = (text, term) => {
        if (!term.trim()) return text;
        const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === term.toLowerCase()
                        ? <span key={i} className="text-red-600 font-bold">{part}</span>
                        : part
                )}
            </span>
        );
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            setSelectedIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' && suggestions[selectedIndex]) {
            onSelectBook(suggestions[selectedIndex].book_id);
            onClose();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-start justify-center pt-20 px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: -20 }}
                        className="relative w-full max-w-2xl bg-surface rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-border"
                    >
                        {/* Search Input Area */}
                        <div className="p-6 border-b border-border">
                            <h2 className="text-center font-bold text-primary mb-6 text-xl">
                                {bn ? 'আপনার পছন্দসই পণ্য অনুসন্ধান করুন' : 'Search for your favorite books'}
                            </h2>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-brand-500 transition-colors" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder={bn ? 'খুঁজুন...' : "Search..."}
                                    className="w-full pl-12 pr-12 py-4 bg-surface-alt border-2 border-border rounded-xl text-lg text-primary outline-none focus:border-brand-500/50 transition-all shadow-sm placeholder:text-secondary"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <button
                                    onClick={onClose}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[300px]">
                            {loading && (
                                <div className="p-12 flex justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                                </div>
                            )}
                            {!loading && suggestions.length === 0 && query && (
                                <div className="p-12 text-center text-secondary italic">
                                    {bn ? 'কিছু পাওয়া যায়নি' : 'No results found'}
                                </div>
                            )}
                            {!loading && suggestions.map((book, idx) => (
                                <button
                                    key={book.book_id}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    onClick={() => {
                                        onSelectBook(book.book_id);
                                        onClose();
                                    }}
                                    className={`w-full text-left px-4 py-2 transition-all flex items-center group ${selectedIndex === idx ? 'bg-primary/10' : ''
                                        }`}
                                >
                                    <span className={`text-[15px] font-medium transition-colors ${selectedIndex === idx ? 'text-brand-600' : 'text-primary'}`}>
                                        {highlightMatch(book.title, query)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
