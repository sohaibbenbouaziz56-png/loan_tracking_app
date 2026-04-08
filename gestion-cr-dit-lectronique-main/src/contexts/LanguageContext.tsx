import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { translations, TranslationKey } from '@/lib/translations';

type Language = 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr');

  const t = useCallback((key: TranslationKey): string => {
    const val = translations[language][key];
    if (Array.isArray(val)) return val.join(', ');
    return val as string;
  }, [language]);

  const isRTL = language === 'ar';

  React.useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function useMonthNames() {
  const { language } = useLanguage();
  return translations[language].months;
}
