import React, { createContext, useContext, useState } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('nmn_lang') || 'es';
  });

  const setLang = (newLang) => {
    if (translations[newLang]) {
      setLangState(newLang);
      localStorage.setItem('nmn_lang', newLang);
    }
  };

  const t = (key, params = {}) => {
    const dict = translations[lang] || translations['es'];
    let str = dict[key] || translations['es'][key] || key;
    
    Object.keys(params).forEach(paramKey => {
      str = str.replace(new RegExp(`{${paramKey}}`, 'g'), params[paramKey]);
    });
    
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
