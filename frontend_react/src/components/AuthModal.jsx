import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, ArrowRight, Github, Chrome, Facebook } from 'lucide-react';
import api from '../services/api';
import { useApp } from '../context/AppContext';
import authBg from '../assets/images/auth-bg.png';

export default function AuthModal({ isOpen, onClose }) {
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const { login } = useApp();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const { data } = await api.post(endpoint, formData);

            if (isRegister) {
                setSuccessMsg('Account created successfully! Please sign in.');
                setIsRegister(false);
                setFormData({ username: formData.username, password: '', email: '' });
            } else {
                login(data);
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegister(!isRegister);
        setError('');
        setSuccessMsg('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md overflow-hidden"
                        style={{
                            backgroundImage: `url(${authBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[4px]" />
                        <FullBackgroundParticles />
                    </motion.div>

                    {/* Modal Container */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="relative bg-white dark:bg-slate-900 w-full max-w-4xl h-[600px] rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex"
                    >
                        {/* Close Toggle from first pic */}
                        <button
                            onClick={onClose}
                            className="absolute top-8 right-8 z-[120] p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Panels Container */}
                        <div className="relative w-full h-full flex">

                            {/* REGISTER PANEL (Moves right when active) */}
                            <div className={`absolute top-0 left-0 h-full w-1/2 flex items-center justify-center p-12 transition-all duration-700 ease-in-out ${isRegister ? 'translate-x-[100%] opacity-100 z-20' : 'translate-x-[50%] opacity-0 z-10'}`}>
                                <AuthForm
                                    title="Create Account"
                                    subtitle="Join our community of book lovers"
                                    buttonLabel="CREATE MY ACCOUNT"
                                    isRegister={true}
                                    formData={formData}
                                    setFormData={setFormData}
                                    handleSubmit={handleSubmit}
                                    loading={loading}
                                    error={error}
                                    successMsg={successMsg}
                                />
                            </div>

                            {/* LOGIN PANEL (Moves right when inactive) */}
                            <div className={`absolute top-0 left-0 h-full w-1/2 flex items-center justify-center p-12 transition-all duration-700 ease-in-out ${isRegister ? 'translate-x-[0%] opacity-0 z-10' : 'translate-x-0 opacity-100 z-20'}`}>
                                <AuthForm
                                    title="Welcome to RecBook"
                                    subtitle="Sign in to access your personalized picks"
                                    buttonLabel="SIGN IN TO RECBOOK"
                                    isRegister={false}
                                    formData={formData}
                                    setFormData={setFormData}
                                    handleSubmit={handleSubmit}
                                    loading={loading}
                                    error={error}
                                    successMsg={successMsg}
                                />
                            </div>

                            {/* OVERLAY PANEL (Sliding gradient) */}
                            <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-all duration-700 ease-in-out z-[100] ${isRegister ? '-translate-x-full rounded-tr-[4rem] rounded-br-[4rem] rounded-tl-none rounded-bl-none' : 'rounded-tl-[4rem] rounded-bl-[4rem] rounded-tr-none rounded-br-none'}`}>
                                <div className={`absolute top-0 -left-full h-full w-[200%] transition-all duration-700 ease-in-out ${isRegister ? 'translate-x-1/2' : 'translate-x-0'}`}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700/90 to-indigo-950 flex shadow-inner">

                                        {/* Overlay Content - Register Mode (Shown when form is Sign Up) */}
                                        <div className="w-1/2 h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                                            <motion.h2
                                                animate={{ y: isRegister ? 0 : -30, opacity: isRegister ? 1 : 0 }}
                                                className="text-4xl font-serif font-bold text-white leading-tight"
                                            >
                                                Welcome Back!
                                            </motion.h2>
                                            <motion.p
                                                animate={{ y: isRegister ? 0 : -30, opacity: isRegister ? 1 : 0 }}
                                                className="text-brand-100/90 max-w-xs font-serif text-lg leading-relaxed italic"
                                            >
                                                To keep connected with us please login with your personal info
                                            </motion.p>
                                            <motion.button
                                                animate={{ y: isRegister ? 0 : -30, opacity: isRegister ? 1 : 0 }}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={toggleMode}
                                                className="px-12 py-3.5 rounded-full border-2 border-white/40 text-white font-black tracking-[0.2em] uppercase text-[10px] hover:bg-white hover:text-brand-700 transition-all focus:outline-none shadow-xl"
                                            >
                                                Sign In
                                            </motion.button>
                                        </div>

                                        {/* Overlay Content - Login Mode (Shown when form is Sign In) */}
                                        <div className="w-1/2 h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                                            <motion.h2
                                                animate={{ y: isRegister ? 30 : 0, opacity: isRegister ? 0 : 1 }}
                                                className="text-4xl font-serif font-bold text-white leading-tight"
                                            >
                                                Hello, Friend!
                                            </motion.h2>
                                            <motion.p
                                                animate={{ y: isRegister ? 30 : 0, opacity: isRegister ? 0 : 1 }}
                                                className="text-brand-100/90 max-w-xs font-serif text-lg leading-relaxed italic"
                                            >
                                                New to RecBook? Create an account to start your journey.
                                            </motion.p>
                                            <motion.button
                                                animate={{ y: isRegister ? 30 : 0, opacity: isRegister ? 0 : 1 }}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={toggleMode}
                                                className="px-12 py-3.5 rounded-full border-2 border-white/40 text-white font-black tracking-[0.2em] uppercase text-[10px] hover:bg-white hover:text-brand-700 transition-all focus:outline-none shadow-xl"
                                            >
                                                Sign Up
                                            </motion.button>
                                        </div>

                                    </div>
                                    <BackgroundParticles />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function AuthForm({ title, subtitle, buttonLabel, isRegister, formData, setFormData, handleSubmit, loading, error, successMsg }) {
    return (
        <div className="w-full max-w-sm space-y-8">
            <div className="text-center space-y-3">
                <h2 className="text-4xl font-serif font-black text-slate-900 dark:text-white leading-tight">{title}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{subtitle}</p>
                <div className="flex justify-center gap-4 pt-4 pb-2">
                    <SocialIcon icon={<Chrome className="w-5 h-5" />} />
                    <SocialIcon icon={<Facebook className="w-5 h-5" />} />
                    <SocialIcon icon={<Github className="w-5 h-5" />} />
                </div>
                <p className="text-slate-400 text-[9px] uppercase tracking-[0.3em] font-black opacity-60">or use your email password</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[11px] font-bold p-3.5 rounded-2xl border border-red-100 dark:border-red-900/50 italic flex items-start gap-2"
                    >
                        <span className="shrink-0 pt-0.5">⚠️</span>
                        <span>{error}</span>
                    </motion.div>
                )}
                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-2"
                    >
                        <span className="shrink-0 pt-0.5">✅</span>
                        <span>{successMsg}</span>
                    </motion.div>
                )}

                <div className="space-y-4">
                    <InputGroup
                        icon={<UserIcon className="w-5 h-5" />}
                        placeholder="Username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />

                    {isRegister && (
                        <InputGroup
                            icon={<Mail className="w-5 h-5" />}
                            placeholder="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    )}

                    <InputGroup
                        icon={<Lock className="w-5 h-5" />}
                        placeholder="Password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>

                {!isRegister && (
                    <div className="text-center space-y-4">
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-2xl py-4.5 text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-brand-600/30 transition-all flex items-center justify-center gap-2 group relative overflow-hidden active-glow"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {buttonLabel}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                                </>
                            )}
                        </motion.button>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => setIsRegister(true)}
                                className="text-[10px] font-black text-slate-400 hover:text-brand-600 transition-colors uppercase tracking-[0.2em] border-b border-transparent hover:border-brand-600/30 pb-1"
                            >
                                NEW TO RECBOOK? CREATE AN ACCOUNT
                            </button>
                        </div>
                    </div>
                )}

                {isRegister && (
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-2xl py-4.5 text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-brand-600/30 transition-all flex items-center justify-center gap-2 group relative overflow-hidden active-glow"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {buttonLabel}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                            </>
                        )}
                    </motion.button>
                )}
            </form>
        </div>
    );
}

function InputGroup({ icon, placeholder, type = "text", value, onChange, required = false }) {
    return (
        <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none">
                {icon}
            </div>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand-500/20 focus:ring-8 focus:ring-brand-500/5 rounded-[1.25rem] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium transition-all outline-none"
            />
        </div>
    );
}

function SocialIcon({ icon }) {
    return (
        <button type="button" className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-brand-600 transition-all shadow-sm focus:outline-none group">
            <motion.div whileHover={{ rotate: 12 }}>
                {icon}
            </motion.div>
        </button>
    );
}

function BackgroundParticles() {
    const icons = ['📖', '✨', '📚', '🔖', '💡'];
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ x: Math.random() * 400, y: Math.random() * 600, opacity: 0 }}
                    animate={{
                        x: [null, Math.random() * 400, Math.random() * 400],
                        y: [null, Math.random() * 600, Math.random() * 600],
                        opacity: [0, 0.5, 0],
                        rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 25 + Math.random() * 20, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }}
                    className="absolute text-lg select-none"
                    style={{ fontSize: Math.random() * 12 + 8 }}
                >
                    {i % 4 === 0 ? icons[Math.floor(Math.random() * icons.length)] : '•'}
                </motion.div>
            ))}
        </div>
    );
}

function FullBackgroundParticles() {
    const icons = ['📖', '✨', '📚', '🔖', '💡', '🖋️', '🎓'];
    return (
        <div className="fixed inset-0 pointer-events-none opacity-20">
            {[...Array(30)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ x: Math.random() * 100 + 'vw', y: Math.random() * 100 + 'vh', opacity: 0, scale: Math.random() * 0.5 + 0.5 }}
                    animate={{
                        x: [Math.random() * 100 + 'vw', Math.random() * 100 + 'vw', Math.random() * 100 + 'vw'],
                        y: [Math.random() * 100 + 'vh', Math.random() * 100 + 'vh', Math.random() * 100 + 'vh'],
                        opacity: [0, 1, 0.5, 0],
                        rotate: [0, 90, 180, 270, 360]
                    }}
                    transition={{ duration: 50 + Math.random() * 40, repeat: Infinity, ease: "linear", delay: Math.random() * 10 }}
                    className="absolute text-white select-none filter blur-[1px]"
                >
                    {i % 5 === 0 ? icons[Math.floor(Math.random() * icons.length)] : '•'}
                </motion.div>
            ))}
        </div>
    );
}
