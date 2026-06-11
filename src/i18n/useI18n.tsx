import { createContext, useContext, useState, type ReactNode } from 'react';
import { de, type TranslationKey } from './de';
import { en } from './en';

type Locale = 'de' | 'en';

const translations: Record<Locale, Record<TranslationKey, string>> = { de, en };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectLocale(): Locale {
  const saved = localStorage.getItem('locale') as Locale | null;
  if (saved && translations[saved]) return saved;

  const browserLang = navigator.language.slice(0, 2);
  if (browserLang === 'de') return 'de';
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: TranslationKey): string => {
    return translations[locale][key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
