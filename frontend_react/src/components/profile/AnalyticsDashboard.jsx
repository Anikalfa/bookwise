import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft, RefreshCw, Activity, Search, Clock,
    Eye, BookOpen, BarChart3, Sparkles, Heart, Award,
    Building2, Users, FolderOpen, Hash, TrendingUp, Bookmark,
    Navigation, History, Map
} from 'lucide-react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';
import { Button, Badge } from '../ui';
import api from '../../services/api';

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.08 } });

export default function AnalyticsDashboard({ lang, user, onBack, onSelectBook, refreshTrigger }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const bn = lang === 'bn';

    useEffect(() => { 
        setData(null); 
        fetchAnalytics(); 
    }, [user?.user_id, refreshTrigger]);

    const fetchAnalytics = async () => {
        setLoading(true); setError(null);
        try {
            const res = await api.get('/me/analytics');
            setData(res.data);
        } catch (err) {
            setError(err.message || 'Failed');
        } finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-brand-600 animate-spin" />
                        <Sparkles className="w-6 h-6 text-brand-600 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.25em] text-secondary">
                        {bn ? 'গভীর বিশ্লেষণ চলছে...' : 'ANALYZING YOUR JOURNEY...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-10 text-center">
                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
                    <Activity className="w-10 h-10 text-rose-500" />
                </div>
                <h2 className="text-2xl font-serif font-black text-primary mb-2">Something Went Wrong</h2>
                <p className="text-secondary max-w-md mx-auto mb-8 font-medium">Please try again in a few moments.</p>
                <div className="flex gap-4">
                    <Button onClick={onBack} variant="ghost">Go Back</Button>
                    <Button onClick={fetchAnalytics} className="premium-gradient text-white border-none">Retry</Button>
                </div>
            </div>
        );
    }

    const s = data.stats;
    const daysSince = Math.max(1, Math.ceil((Date.now() - new Date(data.member_since).getTime()) / 86400000));

    return (
        <div className="min-h-screen bg-surface pb-20">
            {/* ── Sticky Header ── */}
            <div className="bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2.5 hover:bg-surface-alt rounded-xl transition-colors group">
                            <ArrowLeft className="w-5 h-5 text-secondary group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-xl font-serif font-black text-primary">
                                {bn ? 'গভীর বিশ্লেষণ' : 'Deep Analytics'}
                            </h1>
                            <p className="text-[9px] font-bold text-secondary uppercase tracking-[0.2em]">
                                {bn ? 'আপনার পড়ার অভ্যাসের অন্তর্দৃষ্টি' : 'Your complete reading fingerprint'}
                            </p>
                        </div>
                    </div>
                    <Badge variant="brand" className="px-3 py-1.5 bg-brand-50 text-brand-700 border-none font-black text-xs">
                        {user?.username}
                    </Badge>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

                {/* ══════ Row 1: Key Stats Grid ══════ */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatMini icon={Eye} val={s.clicks} label={bn ? 'মোট ভিজিট' : 'Total Visits'} color="text-indigo-600" bg="bg-indigo-50" i={0} />
                    <StatMini icon={BookOpen} val={s.unique_books} label={bn ? 'ইউনিক বই' : 'Unique Books'} color="text-emerald-600" bg="bg-emerald-50" i={1} />
                    <StatMini icon={Bookmark} val={s.bookshelf} label={bn ? 'বুকশেলফ' : 'Bookshelf'} color="text-rose-600" bg="bg-rose-50" i={2} />
                    <StatMini icon={Users} val={s.unique_authors} label={bn ? 'লেখক' : 'Authors'} color="text-violet-600" bg="bg-violet-50" i={3} />
                    <StatMini icon={Building2} val={s.unique_publishers} label={bn ? 'প্রকাশক' : 'Publishers'} color="text-cyan-600" bg="bg-cyan-50" i={4} />
                    <StatMini icon={FolderOpen} val={s.unique_categories} label={bn ? 'বিষয়' : 'Categories'} color="text-amber-600" bg="bg-amber-50" i={5} />
                </div>

                {/* ══════ Row 2: Persona Card ══════ */}
                <motion.div {...fade(1)}
                    className="bg-brand-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-brand-900/30">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-brand-400/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400/30 to-amber-600/10 rounded-2xl flex items-center justify-center shrink-0">
                            <Award className="w-8 h-8 text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-amber-400/80 uppercase tracking-[0.2em] mb-1">{bn ? 'আপনার পাঠক ব্যক্তিত্ব' : 'YOUR READER PERSONA'}</div>
                            <h2 className="text-3xl font-serif font-bold mb-2">{data.personality.name}</h2>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">{data.personality.description}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                            <div className="text-3xl font-black">{daysSince}</div>
                            <div className="text-[9px] font-bold text-brand-400 uppercase tracking-widest">{bn ? 'দিন সদস্য' : 'days active'}</div>
                        </div>
                    </div>
                </motion.div>

                {/* ══════ Row 4: Reading DNA & Authors ══════ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* DNA Radar */}
                    <motion.div {...fade(3)} className="bg-surface-alt rounded-3xl p-8 shadow-sm border border-border">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-base font-serif font-black text-primary flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-brand-600" />
                                {bn ? 'নিউরাল স্টাইল ডিএনএ' : 'Neural Style DNA'}
                            </h3>
                        </div>
                        {data.category_breakdown?.length >= 3 ? (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.category_breakdown.slice(0, 6)}>
                                        <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                        <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                        <Radar name="DNA" dataKey="count" stroke="#4f46e5" strokeWidth={3} fill="#4f46e5" fillOpacity={0.15} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyState icon={BarChart3} text={bn ? 'নিউরাল প্রোফাইল তৈরি করতে আরও বই দেখুন' : 'Explore more genres to generate your Neural Style DNA map'} />
                        )}
                    </motion.div>

                    {/* Categories Progress */}
                    <motion.div {...fade(3.5)} className="bg-surface-alt rounded-3xl p-8 shadow-sm border border-border">
                        <h3 className="text-base font-serif font-black text-primary mb-8 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-brand-600" />
                            {bn ? 'নিউরাল স্টাইল প্রোফাইল' : 'Neural Style Profile'}
                        </h3>
                        <div className="space-y-5">
                            {data.category_breakdown?.slice(0, 6).map((cat, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-end mb-1.5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-primary">{cat.name}</span>
                                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter opacity-50">Neural Affinity Score</span>
                                        </div>
                                        <span className="text-[10px] font-black text-brand-600 transition-all duration-300">
                                            {(cat.pct / 1).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }} animate={{ width: `${cat.pct}%` }}
                                            className="h-full rounded-full bg-brand-500"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ══════ Row 5: Authors & Books You Explored ══════ */}
                <motion.div {...fade(3.8)} className="bg-surface-alt rounded-3xl p-8 shadow-sm border border-border">
                    <h3 className="text-base font-serif font-black text-primary mb-8 flex items-center gap-2">
                        <Users className="w-4 h-4 text-brand-600" />
                        {bn ? 'প্রিয় লেখক ও তাদের বই' : 'Authors & Books You Explored'}
                    </h3>
                    {data.favorite_authors?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {data.favorite_authors.map((author, i) => (
                                <div key={i} className="group">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-[10px] font-black shrink-0">
                                            #{i + 1}
                                        </div>
                                        <h5 className="font-bold text-primary text-sm truncate group-hover:text-brand-600 transition-colors uppercase tracking-tight">{author.name}</h5>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 ml-11">
                                        {author.book_titles?.map((t, j) => (
                                            <span key={j} className="text-[9px] font-bold bg-surface px-2 py-1 rounded-md text-secondary border border-border line-clamp-1 max-w-full">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Users} text="Explore more books to find your favorite authors." />
                    )}
                </motion.div>

                {/* ══════ Row 6: Explore My Journey (The BIG Feature) ══════ */}
                <motion.div {...fade(4)} className="bg-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-brand-950/40">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="mb-12">
                            <h2 className="text-3xl font-serif font-black mb-2 flex items-center gap-3">
                                <Map className="w-8 h-8 text-brand-400" />
                                {bn ? 'আমার যাত্রা অন্বেষণ করুন' : 'Explore My Journey'}
                            </h2>
                            <p className="text-slate-400 text-sm font-medium">Your progress and discoveries through the world of books.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            {/* Search History Journey */}
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.25em] text-brand-400 mb-8 flex items-center gap-2">
                                    <Navigation className="w-4 h-4" />
                                    {bn ? 'অনুসন্ধান ইতিহাস' : 'Discovery Path'}
                                </h3>
                                {data.search_history?.length > 0 ? (
                                    <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
                                        {data.search_history.slice(0, 5).map((s, i) => (
                                            <div key={i} className="pl-8 relative group">
                                                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-border bg-surface group-hover:border-brand-500 transition-colors flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary/30 group-hover:bg-brand-400 transition-colors" />
                                                </div>
                                                <div className="text-base font-bold text-primary group-hover:text-brand-300 transition-colors">"{s.query}"</div>
                                                <div className="text-[10px] text-secondary font-bold uppercase tracking-wider mt-1">{new Date(s.searched_at).toLocaleDateString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState icon={Search} text="Your journey starts with a single search." />
                                )}
                            </div>

                            {/* Bookshelf Showcase */}
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.25em] text-rose-400 mb-8 flex items-center gap-2">
                                    <Heart className="w-4 h-4" />
                                    {bn ? 'বুকশেলফ' : 'Legacy Collection'}
                                </h3>
                                {data.bookshelf_preview?.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {data.bookshelf_preview?.slice(0, 4).map((book) => (
                                            <div
                                                key={book.book_id}
                                                onClick={() => onSelectBook(book.book_id)}
                                                className="group cursor-pointer p-4 bg-surface-alt border border-border rounded-2xl hover:border-rose-500/30 hover:bg-rose-50/5 transition-all"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                                        <BookOpen className="w-4 h-4" />
                                                    </div>
                                                    <h5 className="text-xs font-black text-primary line-clamp-1 group-hover:text-rose-400 transition-colors">{book.title}</h5>
                                                </div>
                                                <p className="text-[9px] font-bold text-secondary uppercase tracking-widest pl-11">{book.author}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState icon={Bookmark} text="Build your legacy by saving books you love." />
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

/* ── Small Stat Card ── */
function StatMini({ icon: Icon, val, label, color, bg, i }) {
    return (
        <motion.div {...fade(i)} className="bg-surface-alt rounded-2xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-primary">{val ?? 0}</div>
            <div className="text-[9px] font-black text-secondary uppercase tracking-widest mt-0.5">{label}</div>
        </motion.div>
    );
}

/* ── Empty State ── */
function EmptyState({ icon: Icon, text }) {
    return (
        <div className="py-10 text-center text-slate-400">
            <Icon className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="italic text-sm">{text}</p>
        </div>
    );
}
