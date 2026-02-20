import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, Lang } from '@/types';
import * as DB from '@/lib/db';
import { getLang, setLang as storeLang, t as translate } from '@/lib/i18n';

interface AppContextValue {
    user: Session | null;
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (path: string) => string;
    ready: boolean;
}

const AppContext = createContext<AppContextValue>({
    user: null, lang: 'en',
    setLang: () => { }, t: (p) => p, ready: false,
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

    const t = useCallback((path: string) => translate(lang, path), [lang]);

    return (
        <AppContext.Provider value={{ user, lang, setLang, t, ready }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
