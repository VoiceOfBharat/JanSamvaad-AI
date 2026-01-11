import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../translations/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage && ['en', 'hi', 'mr'].includes(storedLanguage)) {
      setLanguage(storedLanguage);
    }
  }, []);

  // Change language
  const changeLanguage = (newLanguage) => {
    if (['en', 'hi', 'mr'].includes(newLanguage)) {
      setLanguage(newLanguage);
      localStorage.setItem('language', newLanguage);
    }
  };

  // Get translation
  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    ],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};