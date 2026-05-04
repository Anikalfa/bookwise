import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../ui';

export default function BookCard({ book, lang, onClick }) {
    const rating = Math.round(book.avg_rating || 0);

    const PLACEHOLDERS = [
        '/placeholders/cover_1.png',
        '/placeholders/cover_2.png',
        '/placeholders/cover_3.png',
        '/placeholders/cover_4.png',
    ];

    const getStablePlaceholder = (id) => {
        const hash = id.toString().split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        return PLACEHOLDERS[Math.abs(hash) % PLACEHOLDERS.length];
    };

    const [imageError, setImageError] = React.useState(false);
    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = React.useState(false);
    const cardRef = React.useRef(null);

    const placeholderUrl = getStablePlaceholder(book.book_id || book.title);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xc = rect.width / 2;
        const yc = rect.height / 2;
        const dx = x - xc;
        const dy = y - yc;

        // Calculate rotation (max 10 degrees)
        const rotateX = (dy / yc) * -10;
        const rotateY = (dx / xc) * 10;

        setMousePos({ x, y, rotateX, rotateY });
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setMousePos({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
            }}
            animate={{
                rotateX: mousePos.rotateX,
                rotateY: mousePos.rotateY,
                scale: isHovered ? 1.05 : 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.5 }}
            style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
            className="h-full"
        >
            <Card
                className="flex flex-col h-full group cursor-pointer border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] transition-all duration-700 bg-white dark:bg-slate-900/50 backdrop-blur-md relative overflow-hidden ring-1 ring-black/[0.05] dark:ring-white/[0.05]"
                onClick={onClick}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Dynamic Shine Layer */}
                {isHovered && (
                    <div
                        className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-500"
                        style={{
                            background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(79,70,229,0.08) 0%, transparent 65%)`,
                        }}
                    />
                )}

                <div
                    className={`relative aspect-[3.2/4] overflow-hidden rounded-t-[2rem] bg-slate-100 dark:bg-slate-800/40`}
                    style={{ transform: "translateZ(30px)" }}
                >
                    {/* Hardcover Crease Effect */}
                    <div className="absolute left-[7%] top-0 bottom-0 w-[1px] bg-black/10 dark:bg-white/5 z-10" />
                    <div className="absolute left-[7.5%] top-0 bottom-0 w-[1px] bg-white/20 dark:bg-black/10 z-10" />
                    <div className="absolute left-0 top-0 bottom-0 w-[7%] bg-gradient-to-r from-black/10 to-transparent z-10 pointer-events-none" />

                    <img
                        src={book.cover_url && !imageError ? book.cover_url : placeholderUrl}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ease-out"
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />

                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-900/40 opacity-0 group-hover:opacity-100 transition-all duration-700 backdrop-blur-[2px]">
                        <div className="bg-white text-brand-900 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                            Open Details
                        </div>
                    </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-3" style={{ transform: "translateZ(40px)" }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-3 h-3 transition-all duration-500 ${isHovered && i < rating ? 'scale-125' : ''} ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] font-black text-slate-400">
                           {book.avg_rating?.toFixed(1) || '0.0'}
                        </span>
                    </div>

                    <h4 className="font-serif font-black text-slate-900 dark:text-slate-100 text-sm leading-tight line-clamp-2 group-hover:text-brand-600 transition-colors duration-300">
                        {book.title}
                    </h4>
                    
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {book.author || 'Unknown Author'}
                    </p>
                </div>
            </Card>
        </motion.div>
    );
}

