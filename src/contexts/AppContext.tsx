import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, Lang } from '@/types';
import * as DB from '@/lib/db';
import * as Auth from '@/lib/auth';
import { getLang, setLang as storeLang, t as translate } from '@/lib/i18n';

interface AppContextValue {
    user: Session | null;
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (path: string) => string;
    ready: boolean;
    login: (email: string, password: string) => { success: boolean; error?: string };
    logout: () => void;
}

const AppContext = createContext<AppContextValue>({
    user: null, lang: 'en',
    setLang: () => { }, t: (p) => p, ready: false,
    login: () => ({ success: false }),
    logout: () => { },
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Session | null>(null);
    const [lang, setLangState] = useState<Lang>('en');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        DB.initDB();
        setUser(DB.getSession());
        setLangState(getLang());
        setReady(true);
    }, []);

    const setLang = useCallback((l: Lang) => {
        storeLang(l); setLangState(l);
    }, []);

    const login = useCallback((email: string, password: string) => {
        const result = Auth.login(email, password);
        if (result.success) {
            setUser(DB.getSession()); // immediately update context state
        }
        return result;
    }, []);

    const logout = useCallback(() => {
        Auth.logout();
        setUser(null);
    }, []);

    const t = useCallback((path: string) => translate(lang, path), [lang]);

    return (
        <AppContext.Provider value={{ user, lang, setLang, t, ready, login, logout }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
