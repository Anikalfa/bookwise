import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from './index';

export function Drawer({ isOpen, onClose, side = 'right', title, children, width = 'max-w-md' }) {
    const isRight = side === 'right';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ x: isRight ? '100%' : '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: isRight ? '100%' : '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={cn(
                            "fixed inset-y-0 z-[70] w-full bg-surface shadow-2xl flex flex-col",
                            width,
                            isRight ? "right-0" : "left-0"
                        )}
                    >
                        <div className="p-6 flex items-center justify-between border-b border-border">
                            <h2 className="text-xl font-serif font-bold text-primary">{title}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-surface-alt rounded-full transition-colors text-secondary hover:text-primary"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
