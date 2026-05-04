import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, BookOpen, Feather, Landmark, Sparkles, Smile, ArrowUpRight } from 'lucide-react';

const CATEGORIES = [
    {
        id: '1260',
        name: { bn: 'উপন্যাস', en: 'Novel' },
        icon: BookOpen,
        gradient: 'from-violet-900 via-purple-800 to-violet-900',
        accent: 'bg-violet-400',
        badge: '#1',
        desc: { en: 'Stories that take you away', bn: 'গল্পের জগতে স্বাগতম' }
    },
    {
        id: '1301',
        name: { bn: 'কবিতা', en: 'Poetry' },
        icon: Feather,
        gradient: 'from-amber-800 via-yellow-700 to-amber-900',
        accent: 'bg-amber-400',
        badge: '#2',
        desc: { en: 'Words that move the soul', bn: 'শব্দের অনুভূতি' }
    },
    {
        id: '1037',
        name: { bn: 'ইতিহাস', en: 'History' },
        icon: Landmark,
        gradient: 'from-rose-900 via-red-800 to-rose-900',
        accent: 'bg-rose-400',
        badge: '#3',
        desc: { en: 'The world as it was', bn: 'অতীতের আলোয়' }
    },
    {
        id: '1079',
        name: { bn: 'ধর্মীয়', en: 'Religion' },
        icon: Sparkles,
        gradient: 'from-emerald-900 via-teal-800 to-emerald-900',
        accent: 'bg-emerald-400',
        badge: '#4',
        desc: { en: 'Wisdom & spirituality', bn: 'আধ্যাত্মিক জ্ঞান' }
    },
    {
        id: '11',
        name: { bn: 'শিশু-কিশোর', en: 'Children' },
        icon: Smile,
        gradient: 'from-cyan-800 via-sky-700 to-cyan-900',
        accent: 'bg-cyan-400',
        badge: '#5',
        desc: { en: 'Adventures for young minds', bn: 'শিশুদের জন্য গল্প' }
    },
];

export default function CategoryRow({ lang, onSelect }) {
    const bn = lang === 'bn';

    return (
        <div className="py-24 relative overflow-hidden">
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-surface/0 via-surface-alt/30 to-surface/0 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 relative">
                {/* Section Header */}
                <div className="flex items-end justify-between mb-14">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-brand-500 mb-3">
                            {bn ? 'বিষয় অনুসারে খুঁজুন' : 'Browse by Genre'}
                        </p>
                        <h3 className="text-4xl md:text-5xl font-serif font-black text-primary tracking-tight">
                            {bn ? 'জনপ্রিয় বিভাগ' : 'Featured Categories'}
                        </h3>
                    </div>
                    <button className="group hidden md:flex items-center gap-2 text-sm font-bold text-secondary hover:text-brand-600 transition-colors">
                        <span className="uppercase tracking-widest text-xs">{bn ? 'সব দেখুন' : 'View All'}</span>
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </div>

                {/* Category Cards — dark magazine style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                    {CATEGORIES.map((cat, i) => (
                        <motion.button
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            whileHover={{ y: -6, scale: 1.02 }}
                            onClick={() => onSelect(cat.id, bn ? cat.name.bn : cat.name.en)}
                            className={`group relative bg-gradient-to-br ${cat.gradient} text-left rounded-[2rem] p-7 overflow-hidden shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 min-h-[220px] flex flex-col justify-between`}
                        >
                            {/* Rank Badge */}
                            <div className="absolute top-5 right-5 text-[10px] font-black text-white/20 tracking-[0.2em] uppercase">
                                {cat.badge}
                            </div>

                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-2xl ${cat.accent} bg-opacity-20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <cat.icon className="w-7 h-7 text-white" />
                            </div>

                            {/* Text */}
                            <div>
                                <h4 className="text-2xl font-serif font-black text-white mb-1.5 leading-tight tracking-tight">
                                    {cat.name[lang]}
                                </h4>
                                <p className="text-[11px] text-white/50 font-medium tracking-wide leading-relaxed">
                                    {cat.desc[lang]}
                                </p>
                            </div>

                            {/* Hover arrow */}
                            <ChevronRight className="absolute bottom-5 right-5 w-5 h-5 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />

                            {/* Glow overlay */}
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.04] transition-opacity rounded-[2rem]" />
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
