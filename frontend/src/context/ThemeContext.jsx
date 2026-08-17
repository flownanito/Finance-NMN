import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const PALETTES = [
  { id: 'oceanic', name: 'Oceánica', primary: '#3B6FE0', accent: '#4A8CFF' },
  { id: 'emerald', name: 'Esmeralda', primary: '#00c853', accent: '#1de9b6' },
  { id: 'sunset', name: 'Atardecer', primary: '#ff6d00', accent: '#ff3d00' },
  { id: 'lavender', name: 'Lavanda', primary: '#7c4dff', accent: '#e040fb' },
  { id: 'ruby', name: 'Rubí', primary: '#e91e63', accent: '#ff1744' },
  { id: 'platinum', name: 'Platino', primary: '#48484a', accent: '#aeaeb2' }
];

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('nmn_theme_mode') || 'dark';
  });

  const [palette, setPalette] = useState(() => {
    return localStorage.getItem('nmn_palette') || 'oceanic';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply light theme class
    if (themeMode === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
    
    localStorage.setItem('nmn_theme_mode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-palette', palette);
    localStorage.setItem('nmn_palette', palette);
  }, [palette]);

  const toggleThemeMode = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, toggleThemeMode, palette, setPalette, PALETTES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
