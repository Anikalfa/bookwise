import React from 'react';
import { Drawer } from '../ui/Drawer';
import { Home, BookOpen, Users, Building, Info, Mail } from 'lucide-react';

const MENU_ITEMS = [
    { icon: Home, label: { bn: 'হোম', en: 'Home' }, key: 'home', active: true },
    { icon: Users, label: { bn: 'লেখক', en: 'Authors' }, key: 'authors' },
    { icon: BookOpen, label: { bn: 'বিষয়', en: 'Categories' }, key: 'categories' },
    { icon: Building, label: { bn: 'প্রকাশনী', en: 'Publishers' }, key: 'publishers' },
    { icon: Info, label: { bn: 'আমাদের সম্পর্কে', en: 'About' }, key: 'about' },
    { icon: Mail, label: { bn: 'যোগাযোগ', en: 'Contact' }, key: 'contact' },
];

export default function Sidebar({ isOpen, onClose, lang, onSelectItem }) {
    return (
        <Drawer isOpen={isOpen} onClose={onClose} side="left" title={lang === 'bn' ? 'মেনু' : 'Menu'}>
            <div className="py-4">
                {MENU_ITEMS.map((item, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => {
                            onSelectItem(item.key);
                            if (item.key !== 'home') {
                                setTimeout(() => onClose(), 100);
                            }
                        }}
                        className={`w-full flex items-center gap-4 px-6 py-4 transition-colors ${item.active
                            ? 'bg-brand-50 text-brand-700 border-r-4 border-brand-600'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${item.active ? 'text-brand-600' : 'text-slate-400'}`} />
                        <span className="font-bold text-sm tracking-wide">{item.label[lang]}</span>
                    </button>
                ))}
            </div>
        </Drawer>
    );
}
