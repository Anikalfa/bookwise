import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote } from 'lucide-react';
import tagoreImg from '../../assets/images/tagore.png';
import humayunImg from '../../assets/images/humayun.png';
import sunilImg from '../../assets/images/sunil.png';
import saratImg from '../../assets/images/sarat.png';

const QUOTES = [
    {
        author: { bn: 'হুমায়ূন আহমেদ', en: 'Humayun Ahmed' },
        text: {
            bn: 'জোছনা দেখতে দেখতে, আমার হঠাৎ মনে হলো, প্রকৃতির কাছে কিছু চাইতে নেই, কারণ প্রকৃতি মানুষের কোনো ইচ্ছাই অপূর্ণ রাখে না।',
            en: 'Gazing at the moonlight, I suddenly felt that one should not ask anything from nature, because nature leaves no wish of man unfulfilled.'
        },
        image: humayunImg
    },
    {
        author: { bn: 'সুনীল গঙ্গোপাধ্যায়', en: 'Sunil Gangopadhyay' },
        text: {
            bn: 'অন্ধকার শশ্বানে ভীরু ভয় পায়, সাধক সেখানে সিদ্ধি লাভ করে।',
            en: 'The coward fears the dark cemetery, but the seeker attains enlightenment there.'
        },
        image: sunilImg
    },
    {
        author: { bn: 'শরৎচন্দ্র চট্টোপাধ্যায়', en: 'Sarat Chandra Chattopadhyay' },
        text: {
            bn: 'মড়ার কি জাত থাকে রে? (শ্রীকান্ত-১)',
            en: 'Does a corpse have a caste? (Shrikanta-1)'
        },
        image: saratImg
    },
    {
        author: { bn: 'সুনীল গঙ্গোপাধ্যায়', en: 'Sunil Gangopadhyay' },
        text: {
            bn: 'কৃতজ্ঞতা একটা বিষম বোঝা। অনেকেই সারাজীবন এ বোঝা বহনে অক্ষম। তাই এই বোঝা ঝেড়ে ফেলে উপকারী ব্যক্তির শত্রুতা করে তারা স্বস্তি বোধ করে।',
            en: 'Gratitude is a terrible burden. Many are unable to carry this burden for life. So they find relief by throwing off this burden and being hostile to their benefactor.'
        },
        image: sunilImg
    },
    {
        author: { bn: 'শরৎচন্দ্র চট্টোপাধ্যায়', en: 'Sarat Chandra Chattopadhyay' },
        text: {
            bn: 'কোন আনন্দেরই স্থায়িত্ব নেই। আছে তার শুধু ক্ষণস্থায়ী দিনগুলি। সেই ত মানব জীবনের চরম সঞ্চয়। তাকে বাঁধতে গেলেই মরে।',
            en: 'No happiness is permanent. There are only its fleeting days. That is the ultimate treasure of human life. It dies if you try to bind it.'
        },
        image: saratImg
    },
    {
        author: { bn: 'রবীন্দ্রনাথ ঠাকুর', en: 'Rabindranath Tagore' },
        text: {
            bn: 'মেঘেরা আমার জীবনে ভেসে আসে, বৃষ্টি বা ঝড়ের জন্য নয়, বরং আমার সূর্যাস্তের আকাশে রঙ যোগ করার জন্য।',
            en: 'Clouds come floating into my life, no longer to carry rain or usher storm, but to add color to my sunset sky.'
        },
        image: tagoreImg
    },
    {
        author: { bn: 'হুমায়ূন আহমেদ', en: 'Humayun Ahmed' },
        text: {
            bn: 'পৃথিবীতে আসার সময় প্রতিটি মানুষই একটি করে আলাদিনের প্রদীপ নিয়ে আসে... কিন্তু খুব কম মানুষই সেই প্রদীপ থেকে দৈত্যকে বের করতে পারে।',
            en: 'Every person brings an Aladdin\'s lamp into the world... but very few can bring the genie out of it.'
        },
        image: humayunImg
    },
    {
        author: { bn: 'রবীন্দ্রনাথ ঠাকুর', en: 'Rabindranath Tagore' },
        text: {
            bn: 'প্রজাপতি মাসগুলি নয় বরং মুহূর্তগুলি গণনা করে, এবং তার পর্যাপ্ত সময় থাকে।',
            en: 'The butterfly counts not months but moments, and has time enough.'
        },
        image: tagoreImg
    },
    {
        author: { bn: 'হুমায়ূন আহমেদ', en: 'Humayun Ahmed' },
        text: {
            bn: 'মানুষের জন্ম হয় একা, মৃত্যুও হয় একা। মাঝখানের সময়টুকুতে মানুষ সঙ্গ খুঁজে বেড়ায়।',
            en: 'Man is born alone and dies alone. In between, he searches for companion.'
        },
        image: humayunImg
    },
    {
        author: { bn: 'রবীন্দ্রনাথ ঠাকুর', en: 'Rabindranath Tagore' },
        text: {
            bn: 'বিশ্বাস হলো সেই পাখি যা ভোরের অন্ধকার থাকতেই আলোর গান গায়।',
            en: 'Faith is the bird that feels the light when the dawn is still dark.'
        },
        image: tagoreImg
    },
    {
        author: { bn: 'হুমায়ূন আহমেদ', en: 'Humayun Ahmed' },
        text: {
            bn: 'ভালোবাসা এবং ঘৃণা আসলে একই মুদ্রার এপিঠ-ওপিঠ।',
            en: 'Love and hate are actually two sides of the same coin.'
        },
        image: humayunImg
    },
    {
        author: { bn: 'রবীন্দ্রনাথ ঠাকুর', en: 'Rabindranath Tagore' },
        text: {
            bn: 'জীবনকে সময়ের প্রান্তে শিশির বিন্দুর মতো হালকা ভাবে নাচতে দাও।',
            en: 'Let your life lightly dance on the edges of Time like dew on the tip of a leaf.'
        },
        image: tagoreImg
    },
    {
        author: { bn: 'হুমায়ূন আহমেদ', en: 'Humayun Ahmed' },
        text: {
            bn: 'সবাইকে ভালোবাসলে কোনো একজনকে ভালোবাসা হয় না।',
            en: 'If you love everyone, you don\'t truly love anyone.'
        },
        image: humayunImg
    },
    {
        author: { bn: 'রবীন্দ্রনাথ ঠাকুর', en: 'Rabindranath Tagore' },
        text: {
            bn: 'যেটি আমাদের প্রাপ্য, তা আমরা পাই যদি আমাদের ভেতরে সেটি গ্রহণ করার ক্ষমতা থাকে।',
            en: 'Everything comes to us that belongs to us if we create the capacity to receive it.'
        },
        image: tagoreImg
    },
    {
        author: { bn: 'হুমায়ূন আহমেদ', en: 'Humayun Ahmed' },
        text: {
            bn: 'মানুষের কষ্ট দেখাও কষ্টের কাজ। আবার মানুষের আনন্দ দেখাও কষ্টের কাজ।',
            en: 'Watching people suffer is painful. Watching them rejoice can also be painful.'
        },
        image: humayunImg
    },
    {
        author: { bn: 'রবীন্দ্রনাথ ঠাকুর', en: 'Rabindranath Tagore' },
        text: {
            bn: 'কেবল জলের দিকে তাকিয়ে তুমি সমুদ্র পার হতে পারবে না।',
            en: 'You cannot cross the sea merely by standing and staring at the water.'
        },
        image: tagoreImg
    },
    {
        author: { bn: 'হুমায়ূন আহমেদ', en: 'Humayun Ahmed' },
        text: {
            bn: 'কিছু কিছু মানুষ অতি মাত্রায় আবেগপ্রবণ হয়। তারা সামান্য কারণেই কেঁদে ফেলে, আবার সামান্য কারণেই অত্যধিক হাসে।',
            en: 'Some people are overly emotional. They cry easily, and they laugh uncontrollably.'
        },
        image: humayunImg
    },
    {
        author: { bn: 'রবীন্দ্রনাথ ঠাকুর', en: 'Rabindranath Tagore' },
        text: {
            bn: 'প্রেমই একমাত্র বাস্তবতা এবং এটি কেবল একটি আবেগ নয়। এটি চূড়ান্ত সত্য যা সৃষ্টির হৃদয়ে থাকে।',
            en: 'Love is the only reality and it is not a mere sentiment. It is the ultimate truth at the heart of creation.'
        },
        image: tagoreImg
    },
    {
        author: { bn: 'হুমায়ূন আহমেদ', en: 'Humayun Ahmed' },
        text: {
            bn: 'চাঁদের আলোর নিজস্ব কোনো রঙ নেই, কিন্তু সেই আলোতে পৃথিবীটা কি অপূর্বই না দেখায়!',
            en: 'Moonlight has no color of its own, yet how beautiful it makes the world look!'
        },
        image: humayunImg
    },
    {
        author: { bn: 'রবীন্দ্রনাথ ঠাকুর', en: 'Rabindranath Tagore' },
        text: {
            bn: 'বিপদ থেকে রক্ষা পাওয়ার জন্য প্রার্থনা নয়, বরং বিপদের মুখোমুখি হওয়ার ভয়হীনতা চাই।',
            en: 'Let us not pray to be sheltered from dangers, but to be fearless when facing them.'
        },
        image: tagoreImg
    },
    {
        author: { bn: 'হুমায়ূন আহমেদ', en: 'Humayun Ahmed' },
        text: {
            bn: 'মানুষের মন বড় বিচিত্র, একই সঙ্গে সে হাসতে পারে আবার কাঁদতে পারে।',
            en: 'The human mind is strange; it can laugh and cry at the same time.'
        },
        image: humayunImg
    },
    {
        author: { bn: 'রবীন্দ্রনাথ ঠাকুর', en: 'Rabindranath Tagore' },
        text: {
            bn: 'যেখানে হৃদয় ছোট, সেখানে বিচার বেশি।',
            en: 'Where the heart is small, judgment is great.'
        },
        image: tagoreImg
    },
    {
        author: { bn: 'হুমায়ূন আহমেদ', en: 'Humayun Ahmed' },
        text: {
            bn: 'মানুষ যখন অপরাধী হয়ে যায়, তখন সে ক্ষমা চাইতে ভয় পায়।',
            en: 'When a man becomes a criminal, he fears asking for forgiveness.'
        },
        image: humayunImg
    },
    {
        author: { bn: 'রবীন্দ্রনাথ ঠাকুর', en: 'Rabindranath Tagore' },
        text: {
            bn: 'বড় জ্ঞান সমুদ্রের জলের মতো: অন্ধকার, রহস্যময়, দুর্ভেদ্য।',
            en: 'Great wisdom is like the water in the sea: dark, mysterious, impenetrable.'
        },
        image: tagoreImg
    }
];

export default function QuoteWidget({ lang }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % QUOTES.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const quote = QUOTES[index];

    return (
        <div className="relative w-full max-w-sm lg:max-w-md">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 1.1, x: -20 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="glass rounded-[2rem] p-8 border border-border shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Quote className="w-24 h-24 text-primary" />
                    </div>

                    <div className="flex flex-col gap-6 relative z-10">
                        {/* Author Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-brand-500/30 p-1 bg-surface-alt/20 shadow-lg">
                                <img src={quote.image} alt={quote.author[lang]} className="w-full h-full object-cover rounded-xl" />
                            </div>
                            <div>
                                <h4 className="text-primary font-serif font-bold text-lg">{quote.author[lang]}</h4>
                                <p className="text-brand-500 text-[10px] uppercase tracking-widest font-black">Daily Inspiration</p>
                            </div>
                        </div>

                        {/* Quote Text */}
                        <div className="space-y-4">
                            <p className="text-primary text-lg md:text-xl font-serif leading-relaxed italic">
                                "{quote.text[lang]}"
                            </p>
                            <div className="h-1 w-12 bg-brand-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="flex justify-center mt-6 gap-1.5 opacity-40">
                {QUOTES.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-500 ${index === i ? 'w-4 bg-brand-500' : 'w-1 bg-white'}`}
                    />
                ))}
            </div>
        </div>
    );
}
