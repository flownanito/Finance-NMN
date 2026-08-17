import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useLanguage } from './i18n/LanguageContext';
import HudSettings from './components/HudSettings/HudSettings';

// Page imports
import Dashboard from './pages/Dashboard/Dashboard';
import Transactions from './pages/Transactions/Transactions';
import Invoices from './pages/Invoices/Invoices';
import SavingsPlan from './pages/SavingsPlan/SavingsPlan';
import RecurringExpenses from './pages/RecurringExpenses/RecurringExpenses';
import NotFound from './pages/NotFound/NotFound';
import Login from './pages/Login/Login';

import './App.css';

export default function App() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ============ STATE ============
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('nmn_token'));
  const [authUser, setAuthUser] = useState(() => localStorage.getItem('nmn_user'));
  const [toast, setToast] = useState(null);
  const [isClosed, setIsClosed] = useState(() => {
    return localStorage.getItem('nmn_is_closed') === 'true';
  });

  const isAuthenticated = !!authToken;

  // ============ TOAST HELPER ============
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // ============ AUTH ACTIONS ============
  const handleLogin = (token, username) => {
    localStorage.setItem('nmn_token', token);
    localStorage.setItem('nmn_user', username);
    setAuthToken(token);
    setAuthUser(username);
    showToast("Sesión iniciada con éxito.", "success");
    navigate('/dashboard');
  };

  const handleLogout = useCallback((force = false) => {
    if (force !== true && !isClosed) {
      showToast(t('logoutClosureRequired'), 'error');
      return;
    }
    localStorage.removeItem('nmn_token');
    localStorage.removeItem('nmn_user');
    localStorage.removeItem('nmn_is_closed');
    setAuthToken(null);
    setAuthUser(null);
    setIsClosed(false);
    showToast("Sesión cerrada.", "success");
    navigate('/dashboard'); // Will redirect to login since not authenticated
  }, [isClosed, t, showToast, navigate]);

  // ============ AUTHENTICATED FETCH WRAPPER ============
  const authFetch = useCallback(async (url, options = {}) => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const fullUrl = url.startsWith('/api') ? `${baseUrl}${url}` : url;

    const headers = {
      ...options.headers,
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    if (options.body && typeof options.body === 'string') {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const res = await fetch(fullUrl, { ...options, headers });

    // If 401 Unauthorized, session expired → auto-logout
    if (res.status === 401) {
      handleLogout(true);
      showToast(t('sessionExpired'), 'error');
      throw new Error('Unauthorized');
    }

    return res;
  }, [authToken, t, handleLogout, showToast]);

  // Check closure status on initial load
  useEffect(() => {
    if (isAuthenticated) {
      authFetch('/api/reports/closure/status')
        .then(res => {
          if (res.ok) return res.json();
        })
        .then(data => {
          if (data) {
            setIsClosed(data.closed);
            localStorage.setItem('nmn_is_closed', data.closed ? 'true' : 'false');
          }
        })
        .catch(err => {
          console.error("Error updating closure state:", err);
        });
    }
  }, [isAuthenticated, authFetch]);

  // Exit blocking listener when closure is not done
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isAuthenticated && !isClosed) {
        const msg = t('closureUnloadWarning');
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated, isClosed, t]);

  // If not authenticated, render Login only
  if (!isAuthenticated) {
    return (
      <div className="app-viewport">
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
        
        {/* Toast Alert Banner */}
        {toast && (
          <div className={`toast-banner toast-${toast.type} animate-scale`}>
            <span>{toast.message}</span>
          </div>
        )}
        
        <HudSettings />
      </div>
    );
  }

  return (
    <div className="app-layout">
      
      {/* Sidebar Navigation */}
      <aside className="app-sidebar glass-panel">
        <div className="sidebar-logo">
          <span>🪙</span>
          <span>NMN Advisor</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            {t('dashboard')}
          </NavLink>
          
          <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            {t('transactions')}
          </NavLink>

          <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="4"></line>
              <line x1="8" y1="2" x2="8" y2="4"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {t('invoices')}
          </NavLink>

          <NavLink to="/recurring-expenses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              <path d="M12 7v5l3 3"></path>
            </svg>
            Gastos Recurrentes
          </NavLink>

          <NavLink to="/savings-plan" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
              <path d="M12 6v6l4 2"></path>
            </svg>
            {t('savingsPlan')}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">{authUser ? authUser[0].toUpperCase() : 'A'}</div>
            <div className="user-info">
              <span className="user-name">{authUser}</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
          
          <button onClick={() => handleLogout(false)} className="logout-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard authFetch={authFetch} showToast={showToast} />} />
          <Route path="/transactions" element={<Transactions authFetch={authFetch} showToast={showToast} isClosed={isClosed} />} />
          <Route path="/invoices" element={<Invoices authFetch={authFetch} showToast={showToast} isClosed={isClosed} />} />
          <Route path="/recurring-expenses" element={<RecurringExpenses authFetch={authFetch} showToast={showToast} />} />
          <Route path="/savings-plan" element={<SavingsPlan authFetch={authFetch} showToast={showToast} isClosed={isClosed} setIsClosed={setIsClosed} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Settings HUD */}
      <HudSettings />

      {/* Toast Alert Banner */}
      {toast && (
        <div className={`toast-banner toast-${toast.type} animate-scale`}>
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
