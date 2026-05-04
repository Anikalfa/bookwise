import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [lang, setLang] = useState(localStorage.getItem('bw_lang') || 'bn');
    const [userId, setUserId] = useState(localStorage.getItem('bw_uid'));
    const [token, setToken] = useState(localStorage.getItem('bw_token'));
    const [darkMode, setDarkMode] = useState(localStorage.getItem('bw_theme') === 'dark');

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('bw_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('bw_theme', 'light');
        }
    }, [darkMode]);

    useEffect(() => {
        // Clean up stale guest sessions from old system
        const storedUid = localStorage.getItem('bw_uid');
        if (storedUid && storedUid.startsWith('guest_')) {
            localStorage.removeItem('bw_uid');
            localStorage.removeItem('bw_token');
            localStorage.removeItem('bw_user');
            setUserId(null);
            setToken(null);
            return;
        }

        if (token && userId) {
            setUser({ user_id: userId, username: localStorage.getItem('bw_user') });
        }
    }, [token, userId]);

    const login = (userData) => {
        localStorage.setItem('bw_token', userData.token);
        localStorage.setItem('bw_uid', userData.user_id);
        localStorage.setItem('bw_user', userData.username);
        setToken(userData.token);
        setUserId(userData.user_id);
        setUser({ user_id: userData.user_id, username: userData.username });
    };

    const logout = () => {
        // Explicitly remove all keys to avoid clearing non-BookWise data if shared
        const keys = ['bw_token', 'bw_uid', 'bw_user', 'bw_lang'];
        keys.forEach(k => localStorage.removeItem(k));
        
        setToken(null);
        setUserId(null);
        setUser(null);
        // Force a window reload to ensure all memory-resident states are wiped for security
        window.location.reload();
    };

    const toggleLang = () => {
        const newLang = lang === 'bn' ? 'en' : 'bn';
        setLang(newLang);
        localStorage.setItem('bw_lang', newLang);
    };

    return (
        <AppContext.Provider value={{
            user,
            lang,
            setLang: toggleLang,
            login,
            logout,
            userId,
            darkMode,
            toggleDarkMode: () => setDarkMode(prev => !prev)
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
