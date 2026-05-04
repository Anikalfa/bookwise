import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, Loader2, Bookmark, Heart } from 'lucide-react';
import { Button, Badge } from './ui';
import api from '../services/api';

export default function BookModal({ bookId, isOpen, onClose, lang, onInteraction }) {
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [inBookshelf, setInBookshelf] = useState(false);
    const [togglingBookshelf, setTogglingBookshelf] = useState(false);
    const [isRated, setIsRated] = useState(false);
    const bn = lang === 'bn';

    const GRADIENTS = [
        'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
        'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500',
        'bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500',
        'bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600',
        'bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600',
    ];

    const getStableGradient = (id) => {
        const hash = id.toString().split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
    };

    const [imageError, setImageError] = useState(false);
    const gradientClass = book ? getStableGradient(book.book_id || book.title) : '';

    useEffect(() => {
        if (isOpen && bookId) {
            setLoading(true);
            setBook(null);
            setRating(0);
            setReview('');
            setIsRated(false);
            setInBookshelf(false);

            api.get(`/books/${bookId}`).then(res => {
                setBook(res.data);
                setLoading(false);
                // Record click
                api.post(`/books/${bookId}/click`).then(() => onInteraction());

                // Fetch my rating
                api.get(`/books/${bookId}/my-rating`).then(rRes => {
                    if (rRes.data && rRes.data.rating > 0) {
                        setRating(rRes.data.rating);
                        setReview(rRes.data.review || '');
                        setIsRated(true);
                    }
                });

                // Fetch bookshelf status separately
                api.get('/books/bookshelf').then(bsRes => {
                    const isSaved = bsRes.data.some(b => b.book_id === bookId);
                    setInBookshelf(isSaved);
                }).catch(err => console.error('Bookshelf fetch error:', err));
            }).catch(err => {
                console.error('Book fetch error:', err);
                setLoading(false);
            });
        }
    }, [isOpen, bookId]);

    const handleToggleBookshelf = async () => {
        if (togglingBookshelf) return;
        setTogglingBookshelf(true);
        try {
            const res = await api.post('/books/toggle-bookshelf', { book_id: bookId });
            setInBookshelf(res.data.status === 'added');
            onInteraction();
        } catch (err) {
            console.error(err);
        } finally {
            setTogglingBookshelf(false);
        }
    };

    const handleRate = async () => {
        if (rating === 0) return;
        setSubmitting(true);
        try {
            await api.post('/books/rate', { book_id: bookId, rating, review });
            onInteraction();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUnrate = async () => {
        setSubmitting(true);
        try {
            await api.post('/books/unrate', { book_id: bookId });
            setRating(0);
            setReview('');
            setIsRated(false);
            onInteraction();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative glass w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] flex flex-col md:flex-row max-h-[90vh] border border-border"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-20 p-2 bg-surface-alt/80 backdrop-blur-md hover:bg-surface-alt rounded-full transition-colors text-secondary hover:text-brand-600 shadow-sm"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {loading ? (
                            <div className="flex-1 h-[400px] flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                            </div>
                        ) : book ? (
                            <>
                                <div className={`md:w-2/5 relative group overflow-hidden flex items-center justify-center ${!book.cover_url || imageError ? gradientClass : 'bg-surface-alt'}`}>
                                    {book.cover_url && !imageError ? (
                                        <img
                                            src={book.cover_url}
                                            alt={book.title}
                                            className="w-full h-full object-cover"
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center text-white">
                                            <span className="text-6xl mb-6 opacity-40">📖</span>
                                            <h5 className="font-serif font-black text-xl leading-tight uppercase tracking-[0.2em] opacity-90">
                                                {book.title}
                                            </h5>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Badge variant="brand">{book.categories?.[0] || 'Uncategorized'}</Badge>
                                        <button
                                            onClick={handleToggleBookshelf}
                                            disabled={togglingBookshelf}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${inBookshelf
                                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                                                : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                                                }`}
                                        >
                                            {togglingBookshelf ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : inBookshelf ? (
                                                <Heart className="w-3 h-3 fill-current" />
                                            ) : (
                                                <Bookmark className="w-3 h-3" />
                                            )}
                                            {inBookshelf ? (bn ? 'বুকশেলফে আছে' : 'Saved') : (bn ? 'বুকশেলফে রাখুন' : 'Save to Bookshelf')}
                                        </button>
                                        <div className="flex items-center gap-1 text-amber-500 ml-auto">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="font-bold text-primary">{book.avg_rating?.toFixed(1)}</span>
                                            <span className="text-xs text-secondary font-medium">({book.rating_count})</span>
                                        </div>
                                    </div>

                                    <h2 className="text-4xl font-serif font-black text-primary mb-2 leading-tight">
                                        {book.title}
                                    </h2>
                                    <p className="text-lg font-bold text-brand-600 uppercase tracking-widest mb-6">
                                        {book.author}
                                    </p>

                                    <div className="prose prose-slate max-w-none mb-10 text-justify">
                                        <p className="text-secondary leading-relaxed italic">
                                            {bn ? 'বইয়ের বিবরণ এখানে যোগ করা হবে...' : 'Detailed description and synopsis of the book would appear here, providing insights into the narrative and literary themes...'}
                                        </p>
                                    </div>

                                    <div className="space-y-6 pt-6 border-t border-border-color">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-secondary">
                                                    {bn ? 'রেটিং দিন' : 'Rate this book'}
                                                </h4>
                                                {isRated && (
                                                    <button
                                                        onClick={handleUnrate}
                                                        className="text-[10px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-colors"
                                                    >
                                                        {bn ? 'রেটিং মুছুন' : 'Clear Rating'}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <button
                                                        key={s}
                                                        onMouseEnter={() => setHoverRating(s)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        onClick={() => setRating(s)}
                                                        className="p-1 transition-transform active:scale-90"
                                                    >
                                                        <Star
                                                            className={`w-8 h-8 transition-colors ${((hoverRating || rating) >= s) ? 'fill-amber-400 text-amber-400' : 'text-secondary/20'
                                                                }`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <textarea
                                                placeholder={bn ? 'আপনার মতামত লিখুন...' : 'Write your review...'}
                                                className="w-full bg-surface-alt border-none rounded-2xl p-6 text-sm text-primary focus:ring-2 focus:ring-brand-500 min-h-[120px] placeholder:text-secondary/50"
                                                value={review}
                                                onChange={(e) => setReview(e.target.value)}
                                            />
                                            <Button
                                                onClick={handleRate}
                                                disabled={submitting || rating === 0}
                                                className="rounded-full py-4 font-bold"
                                            >
                                                {submitting ? (bn ? 'লোড হচ্ছে...' : 'Submitting...') : (
                                                    isRated
                                                        ? (bn ? 'রেটিং আপডেট করুন' : 'Update Rating')
                                                        : (bn ? 'রেটিং সেভ করুন' : 'Submit Rating')
                                                )}
                                                <Send className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
