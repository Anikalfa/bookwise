import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../ui';
import QuoteWidget from './QuoteWidget';

const SLIDES = [
    {
        title: { bn: 'বইয়ের জগতে নতুন যাত্রা', en: 'New Journey in Books' },
        sub: { bn: 'আজই আপনার পছন্দের বইটি খুঁজে নিন আমাদের বিশাল সম্ভার থেকে।', en: 'Find your favorite book today from our vast collection.' },
        bg: 'bg-brand-950',
        accent: 'text-brand-400',
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1000'
    },
    {
        title: { bn: 'হুমায়ূন আহমেদ এর সেরা কাজ', en: 'Best of Humayun Ahmed' },
        sub: { bn: 'সবগুলো ক্লাসিক এবং বিরল বই এখন এক জায়গায়।', en: 'All classic and rare books now in one place.' },
        bg: 'bg-emerald-950',
        accent: 'text-emerald-400',
        image: 'https://images.unsplash.com/photo-1491843331069-311ba2481b20?auto=format&fit=crop&q=80&w=1000'
    }
];

export default function HeroCarousel({ lang }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setIndex(prev => (prev + 1) % SLIDES.length), 10000); // Slower carousel for better readability
        return () => clearInterval(timer);
    }, []);

    const slide = SLIDES[index];

    return (
        <div className="relative h-[650px] w-full overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '-100%', opacity: 0 }}
                    transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                    className={`absolute inset-0 ${slide.bg} flex items-center`}
                >
                    <div className="absolute inset-0 z-0 opacity-40">
                        <img src={slide.image} className="w-full h-full object-cover" alt="" />
                        <div className={`absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r ${slide.bg} via-${slide.bg}/80 to-transparent`} />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 w-full relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="max-w-2xl">
                                <motion.span
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className={`inline-block mb-4 text-xs font-black uppercase tracking-[0.2em] ${slide.accent}`}
                                >
                                    Featured Collection
                                </motion.span>
                                <motion.h2
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-6xl md:text-8xl font-serif text-white leading-none mb-6"
                                >
                                    {slide.title[lang]}
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-lg text-slate-300 leading-relaxed mb-10 max-w-md"
                                >
                                    {slide.sub[lang]}
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex items-center gap-4"
                                >
                                    <Button size="lg" className="rounded-full px-8">
                                        {lang === 'bn' ? 'কালেকশন দেখুন' : 'View Collection'}
                                    </Button>
                                    <Button variant="outline" size="lg" className="rounded-full px-8 text-white border-white/20 hover:bg-white/10">
                                        {lang === 'bn' ? 'আরও জানুন' : 'Learn More'}
                                    </Button>
                                </motion.div>
                            </div>

                            <div className="hidden lg:flex justify-end pr-8">
                                <QuoteWidget lang={lang} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {SLIDES.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-10 bg-white' : 'w-2 bg-white/40'}`}
                    />
                ))}
            </div>
        </div>
    );
}
