'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Locale, t as translate } from '@/i18n';

type Theme = 'dark' | 'light';

interface AppContextType {
  theme: Theme;
  locale: Locale;
  setTheme: (t: Theme) => void;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType>({
  theme: 'dark',
  locale: 'ru',
  setTheme: () => {},
  setLocale: () => {},
  t: (k) => k,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [locale, setLocaleState] = useState<Locale>('ru');

  useEffect(() => {
    const savedTheme = localStorage.getItem('eb_theme') as Theme;
    const savedLocale = localStorage.getItem('eb_locale') as Locale;
    if (savedTheme) setThemeState(savedTheme);
    if (savedLocale) setLocaleState(savedLocale);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('eb_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('eb_locale', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setTheme = (t: Theme) => setThemeState(t);
  const setLocale = (l: Locale) => setLocaleState(l);
  const t = (key: string) => translate(locale, key);

  return (
    <AppContext.Provider value={{ theme, locale, setTheme, setLocale, t }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
