import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import './Login.css';

export default function Login({ onLogin }) {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setError(null);
    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error(t('loginError'));
      }

      const data = await response.json();
      onLogin(data.token, data.username);
    } catch (err) {
      setError(err.message || t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel animate-scale">
        <div className="login-logo">
          <span>🪙</span>
          <span>NMN Finance</span>
        </div>
        
        <div className="login-header-group">
          <h2 className="login-heading">{t('loginTitle')}</h2>
          <p className="login-subheading">{t('loginSubtitle')}</p>
        </div>

        {error && <div className="login-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label className="input-label" htmlFor="username">{t('usernameLabel')}</label>
            <input 
              id="username"
              type="text" 
              className="nmn-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              placeholder="e.g. admin"
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">{t('passwordLabel')}</label>
            <input 
              id="password"
              type="password" 
              className="nmn-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="nmn-btn nmn-btn-primary" 
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? t('loading') : t('loginBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}
