
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { translations } from '../i18n/translations';
import { User } from '../types';

type Language = 'English' | 'German';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode; user: User | null }> = ({ children, user }) => {
  const [language, setLanguage] = useState<Language>('English');

  useEffect(() => {
    // Set language from user profile if it exists, otherwise default to English
    if (user?.language) {
      setLanguage(user.language);
    }
  }, [user]);

  const t = (key: string, options?: { [key: string]: string | number }): string => {
    // Attempt to find translation in current language, fallback to English, then to the key itself.
    let text = translations[language]?.[key] || translations['English']?.[key] || key;
    if (options) {
      Object.keys(options).forEach(placeholder => {
        text = text.replace(`{{${placeholder}}}`, String(options[placeholder]));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
