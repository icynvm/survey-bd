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
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AppContext = createContext<AppContextValue>({
    user: null, lang: 'en',
    setLang: () => { }, t: (p) => p, ready: false,
    login: async () => ({ success: false }),
    logout: () => { },
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Session | null>(null);
    const [lang, setLangState] = useState<Lang>('en');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const init = async () => {
            await DB.initDB();
            const session = await DB.loadSession();
            setUser(session);
            setLangState(getLang());
            setReady(true);
        };
        init();
    }, []);

    const setLang = useCallback((l: Lang) => {
        storeLang(l); setLangState(l);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const result = await Auth.login(email, password);
        if (result.success && result.user) {
            setUser({ id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role });
        }
        return result;
    }, []);

    const logout = useCallback(async () => {
        await DB.clearSession();
        setUser(null);
        window.location.href = '/';
    }, []);

    const t = useCallback((path: string) => translate(lang, path), [lang]);

    return (
        <AppContext.Provider value={{ user, lang, setLang, t, ready, login, logout }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
