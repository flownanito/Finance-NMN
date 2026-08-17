import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import './NotFound.css';

export default function NotFound() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="nf-container">
      <div className="nf-card glass-panel animate-scale">
        <div className="nf-icon-wrapper">
          <div className="nf-ellipse"></div>
          <span className="nf-money-icon">💸</span>
        </div>
        <h1 className="nf-title">{t('nfTitle')}</h1>
        <p className="nf-desc">{t('nfDesc')}</p>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="nmn-btn nmn-btn-primary"
        >
          {t('nfBtn')}
        </button>
      </div>
    </div>
  );
}
