import React, { useState, useEffect } from 'react';
import { Drawer } from '../ui/Drawer';
import { LayoutDashboard, Star, History, Info, TrendingUp, BookCheck, StarHalf, Loader2, ChevronRight, Maximize2, LogOut } from 'lucide-react';
import { Badge, Button } from '../ui';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';

export default function ProfileDrawer({ isOpen, onClose, lang, user, onExpand, onSelectBook }) {
    const { logout } = useApp();
    const [tab, setTab] = useState('dash');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const bn = lang === 'bn';

    useEffect(() => {
        if (isOpen && user) {
            setLoading(true);
            setError(null);
            api.get('/me/dashboard')
                .then(res => {
                    if (res.data?.stats) {
                        setData(res.data);
                    } else {
                        setError('DATA_INCOMPLETE');
                    }
                })
                .catch(err => {
                    console.error(err);
                    setError(err.response?.data?.detail || 'FETCH_FAILED');
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, user]);

    if (!user) return null;

    const TABS = [
        { id: 'dash', icon: LayoutDashboard, label: bn ? 'ড্যাশবোর্ড' : 'Dashboard' },
        { id: 'ratings', icon: Star, label: bn ? 'রেটিং' : 'Ratings' },
        { id: 'history', icon: History, label: bn ? 'ইতিহাস' : 'History' },
    ];

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            side="right"
            width="max-w-2xl"
            title={bn ? 'প্রোফাইল ও ড্যাশবোর্ড' : 'Profile & Dashboard'}
        >
            <div className="bg-surface-alt p-10 flex flex-col md:flex-row items-center gap-8 border-b border-border">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl premium-gradient flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-500/20">
                        {user.username?.[0].toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-3xl font-serif font-black text-primary mb-1">{user.username}</h3>
                        <div className="flex items-center gap-2">
                            <Badge variant="ghost" className="text-[10px] text-secondary">{user.user_id?.slice(0, 8)}</Badge>
                            {data?.rec_explanation?.neural_status === 'trained' && (
                                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                                    <Sparkles className="w-2 h-2" /> Neural
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex border-b border-border sticky top-0 bg-surface z-10">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 flex flex-col items-center gap-2 py-5 border-b-2 transition-all ${tab === t.id ? 'border-brand-600 text-brand-700 bg-brand-500/10' : 'border-transparent text-secondary hover:text-primary'
                            }`}
                    >
                        <t.icon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <p className="text-sm font-bold uppercase tracking-widest">{bn ? 'তথ্য লোড হচ্ছে...' : 'Analyzing Activity...'}</p>
                    </div>
                ) : error ? (
                    <div className="h-full flex flex-col items-center justify-center gap-6 p-8 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                            <Info className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-primary font-bold mb-2">{bn ? 'তথ্য লোড করা সম্ভব হয়নি' : 'Sync Connection Failed'}</p>
                            <p className="text-xs text-secondary leading-relaxed">{bn ? 'অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন' : 'Your activity profile is temporarily unavailable.'}</p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => {
                            setLoading(true);
                            setError(null);
                            api.get('/me/dashboard')
                                .then(res => setData(res.data))
                                .catch(err => setError('RETRY_FAILED'))
                                .finally(() => setLoading(false));
                        }}>
                            {bn ? 'আবার চেষ্টা করুন' : 'Retry Sync'}
                        </Button>
                    </div>
                ) : data ? (
                    <div className="p-8 space-y-10">
                        {tab === 'dash' && (
                            <>
                                <button
                                    onClick={onExpand}
                                    className="w-full relative overflow-hidden rounded-2xl py-5 px-8 text-white flex items-center justify-between group shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-300"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7, #6366f1)', backgroundSize: '300% 300%', animation: 'gradientShift 4s ease infinite' }}
                                >
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute -top-1 -right-1 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                                    <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/10 rounded-full blur-lg" />
                                    <div className="relative flex items-center gap-4">
                                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                                            <Maximize2 className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                {bn ? 'বিস্তারিত পরিসংখ্যান' : 'Explore My Journey'}
                                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                                            </div>
                                            <div className="text-[10px] opacity-70 font-medium mt-0.5">{bn ? 'আপনার অভিরুচির পূর্ণাঙ্গ চিত্র' : 'View full-page analytics & trends'}</div>
                                        </div>
                                    </div>
                                    <div className="relative flex items-center gap-1">
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-surface-alt border border-border rounded-[1.5rem] p-6 shadow-sm">
                                        <TrendingUp className="w-5 h-5 text-emerald-500 mb-3" />
                                        <div className="text-4xl font-black text-primary">{data.stats.total_clicks}</div>
                                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1">
                                            {bn ? 'বই পছন্দ' : 'Views'}
                                        </div>
                                    </div>
                                    <div className="bg-surface-alt border border-border rounded-[1.5rem] p-6 shadow-sm">
                                        <BookCheck className="w-5 h-5 text-amber-500 mb-3" />
                                        <div className="text-4xl font-black text-primary">{data.stats.total_ratings}</div>
                                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1">
                                            {bn ? 'রেটিং' : 'Ratings'}
                                        </div>
                                    </div>
                                    <div className="bg-surface-alt border border-border rounded-[1.5rem] p-6 shadow-sm">
                                        <Star className="w-5 h-5 text-brand-500 mb-3" />
                                        <div className="text-4xl font-black text-primary">{data.stats.avg_rating_given || '0.0'}</div>
                                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1">
                                            {bn ? 'গড় রেটিং' : 'Avg Rating'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                                        <TrendingUp className="w-3 h-3" />
                                        {bn ? 'আপনার পছন্দের বিষয়বস্তু' : 'Category Preference Model'}
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {data.category_preferences.map((pref, i) => (
                                            <div key={i} className="group relative">
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="text-sm font-bold text-primary">{pref.name}</span>
                                                    <span className="text-[10px] font-black text-brand-600">{pref.pct}%</span>
                                                </div>
                                                <div className="h-3 bg-surface-alt rounded-full overflow-hidden border border-border">
                                                    <div
                                                        className="h-full premium-gradient transition-all duration-1000 ease-out"
                                                        style={{ width: `${pref.pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {data.category_preferences?.length === 0 && (
                                            <div className="bg-surface-alt/50 border-2 border-dashed border-border rounded-2xl p-8 text-center">
                                                <p className="text-sm text-secondary italic opacity-80">
                                                    {bn ? 'ব্যবহারকারীর কোনো ডাটা পাওয়া যায়নি। বই দেখা শুরু করুন!' : 'Not enough interaction data yet to build your preference model.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-brand-950 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-brand-900/30">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                                    <div className="relative z-10">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-400 mb-1">{bn ? 'সুপারিশ ইঞ্জিন' : 'Recommendation Engine'}</p>
                                                <h4 className="font-serif text-2xl font-bold">{data.rec_explanation.algorithm}</h4>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right hidden md:block">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{bn ? 'মোট ইন্টারঅ্যাকশন' : 'Total Activity'}</p>
                                                    <p className="font-black text-white">{data.rec_explanation.total_interactions}</p>
                                                </div>
                                                <div className={`px-4 py-2 rounded-full border ${data.rec_explanation.neural_status === 'trained' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-brand-500/10 border-brand-500/20 text-brand-300'} text-[10px] font-black uppercase tracking-widest flex items-center gap-2`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${data.rec_explanation.neural_status === 'trained' ? 'bg-emerald-500' : 'bg-brand-500'}`} />
                                                    {data.rec_explanation.neural_status === 'trained' ? (bn ? 'নিউরাল প্রোফাইল সক্রিয়' : 'Neural Profile Active') : (bn ? 'ডাইনামিক এনগ্রাম' : 'Dynamic Profile')}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed opacity-90 font-medium italic border-l-2 border-brand-500/50 pl-4">
                                            {data.rec_explanation.message}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {tab === 'ratings' && (
                            <div className="space-y-6">
                                {data.rated_books?.map((b, i) => (
                                    <div key={i} onClick={() => onSelectBook(b.book_id)} className="flex items-center gap-4 group p-4 hover:bg-surface-alt rounded-2xl transition-all border border-transparent hover:border-border cursor-pointer">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-1 text-amber-400 mb-1">
                                                {[...Array(5)].map((_, s) => (
                                                    <Star key={s} className={`w-3 h-3 ${s < b.rating_given ? 'fill-current' : 'text-secondary/20'}`} />
                                                ))}
                                            </div>
                                            <h5 className="font-bold text-primary group-hover:text-brand-600 transition-colors">{b.title}</h5>
                                            <p className="text-xs text-secondary font-semibold uppercase tracking-wider">{b.author}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-secondary/50 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                    </div>
                                ))}
                                {data.rated_books?.length === 0 && (
                                    <div className="py-20 text-center opacity-70">
                                        <p className="font-bold uppercase tracking-widest text-secondary">{bn ? 'কোনো রেটিং নেই' : 'No ratings yet'}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === 'history' && (
                            <div className="space-y-6">
                                {data.recent_clicks?.map((b, i) => (
                                    <div key={i} onClick={() => onSelectBook(b.book_id)} className="flex items-center gap-4 group p-4 hover:bg-surface-alt rounded-2xl transition-all border border-transparent hover:border-border cursor-pointer">
                                        <div className="flex-1">
                                            <Badge variant="ghost" className="mb-2 text-[8px] tracking-tight">{new Date(b.created_at).toLocaleDateString()}</Badge>
                                            <h5 className="font-bold text-primary group-hover:text-brand-600 transition-colors">{b.title}</h5>
                                            <p className="text-xs text-secondary font-semibold uppercase tracking-wider">{b.author}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                    </div>
                                ))}
                                {data.recent_clicks?.length === 0 && (
                                    <div className="py-20 text-center opacity-70">
                                        <p className="font-bold uppercase tracking-widest text-secondary">{bn ? 'কোনো ইতিহাস নেই' : 'No history yet'}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            <div className="p-6 border-t border-border bg-surface-alt/50">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                        onClose();
                        logout();
                    }}
                    className="w-full flex items-center justify-center gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-2xl py-4 transition-all active:scale-[0.98] font-black uppercase tracking-[0.2em] text-xs"
                >
                    <LogOut className="w-5 h-5" />
                    {bn ? 'সাইন আউট করুন' : 'Sign Out'}
                </Button>
            </div>
        </Drawer>
    );
}
