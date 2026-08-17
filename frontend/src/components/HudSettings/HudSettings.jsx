import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import './HudSettings.css';

export default function HudSettings() {
  const { themeMode, toggleThemeMode, palette, setPalette, PALETTES } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  // Close panel on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="hud-wrapper" ref={panelRef}>
      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`hud-fab ${isOpen ? 'active' : ''}`}
        aria-label="Settings HUD"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="hud-fab-icon">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>

      {/* Settings HUD Panel */}
      {isOpen && (
        <div className="hud-panel glass-panel animate-scale">
          <h3 className="hud-title">{t('hudTitle')}</h3>
          
          {/* Palette Picker */}
          <div className="hud-section">
            <span className="hud-section-label">{t('hudPaletteLabel')}</span>
            <div className="palette-grid">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPalette(p.id)}
                  className={`palette-button ${palette === p.id ? 'active' : ''}`}
                  style={{ '--btn-primary': p.primary, '--btn-accent': p.accent }}
                  title={p.name}
                  aria-label={`Select ${p.name} palette`}
                >
                  <span className="palette-dot-primary" />
                  <span className="palette-dot-accent" />
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selector */}
          <div className="hud-section">
            <span className="hud-section-label">{t('hudThemeLabel')}</span>
            <div className="hud-toggle-container">
              <button 
                onClick={() => toggleThemeMode()} 
                className="hud-toggle-btn"
              >
                {themeMode === 'dark' ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    {t('hudThemeDark')}
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    {t('hudThemeLight')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Currency Selector */}
          <div className="hud-section" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
            <span className="hud-section-label">Divisa / Moneda</span>
            <div className="hud-toggle-container">
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  background: 'rgba(255,255,255,0.05)', 
                  color: 'var(--text-main)', 
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-main)'
                }}
              >
                <option value="USD">Dólar (USD $)</option>
                <option value="EUR">Euro (EUR €)</option>
                <option value="GBP">Libra (GBP £)</option>
                <option value="JPY">Yen (JPY ¥)</option>
              </select>
            </div>
          </div>

          {/* Language Selector */}
          <div className="hud-section">
            <span className="hud-section-label">{t('hudLangLabel')}</span>
            <div className="lang-switcher">
              <button 
                onClick={() => setLang('es')} 
                className={`lang-btn ${lang === 'es' ? 'active' : ''}`}
              >
                <span className="flag-icon">🇪🇸</span> Español
              </button>
              <button 
                onClick={() => setLang('en')} 
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              >
                <span className="flag-icon">🇬🇧</span> English
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
