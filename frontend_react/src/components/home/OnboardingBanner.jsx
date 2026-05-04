import React from 'react';
import { motion } from 'framer-motion';
import { Search, MousePointer2, Star } from 'lucide-react';
import { Button } from '../ui';

export default function OnboardingBanner({ lang, username }) {
    const bn = lang === 'bn';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-7xl mx-auto px-4 py-12"
        >
            <div className="premium-gradient rounded-[2.5rem] p-12 text-center relative overflow-hidden shadow-2xl shadow-brand-900/40">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 max-w-2xl mx-auto">
                    <span className="text-4xl mb-6 block">✨</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
                        {bn ? `স্বাগতম, ${username}!` : `Welcome, ${username}!`}
                    </h2>
                    <p className="text-slate-300 text-lg mb-10 leading-relaxed">
                        {bn ? 'আপনার জন্য সেরা বইগুলো খুঁজে পেতে আমরা প্রস্তুত। রেকমেন্ডেশন পেতে কিছু বই দেখুন বা আপনার ভালো লাগা শেয়ার করুন।' : 'Ready to discover your next favorite read? Interact with some books below to unlock your personalized recommendations.'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {[
                            { icon: Search, label: bn ? 'বই খুঁজুন' : 'Search' },
                            { icon: MousePointer2, label: bn ? 'ক্লিক করুন' : 'Click' },
                            { icon: Star, label: bn ? 'রেটিং দিন' : 'Rate' }
                        ].map((step, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                    <step.icon className="w-6 h-6 text-brand-300" />
                                </div>
                                <span className="text-sm font-bold text-white/80 uppercase tracking-widest">{step.label}</span>
                            </div>
                        ))}
                    </div>

                    <Button size="lg" variant="outline" className="rounded-full px-12 border-white/20 hover:bg-white text-brand-600">
                        {bn ? 'শুরু করা যাক' : 'Start Exploring'}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
