import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import VideoDemo from '../../components/VideoDemo/VideoDemo';
import './Dashboard.css';

export default function Dashboard({ authFetch, showToast }) {
  const { t } = useLanguage();
  const { symbol, formatNumber } = useCurrency();
  const [stats, setStats] = useState({
    lossesAvoided: '+$12.5K',
    netMargin: '34.0%',
    operatingMargin: '+28.0%',
    activeMembers: 18,
    milestoneProgress: 94,
    totalIncome: 150000.00,
    totalExpense: 99000.00,
    departmentExpenses: { IT: 24000.0, Marketing: 32000.0, Sales: 10000.0, Operations: 18000.0, HR: 15000.0 },
    criticalAlerts: []
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [bankBalance, setBankBalance] = useState(0.0);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [newBalance, setNewBalance] = useState('');

  const fetchDashboardData = async () => {
    try {
      const statsRes = await authFetch('/api/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const txsRes = await authFetch('/api/transactions');
      if (txsRes.ok) {
        const txsData = await txsRes.json();
        // Sort by date desc, get last 5
        const sorted = [...txsData].sort((a, b) => b.date.localeCompare(a.date));
        setRecentTransactions(sorted.slice(0, 5));
      }

      const bankRes = await authFetch('/api/bank-account');
      if (bankRes.ok) {
        const bankData = await bankRes.json();
        setBankBalance(bankData.balance);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [authFetch]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await authFetch('/api/finance/sync', { method: 'POST' });
      if (res.ok) {
        showToast(t('syncSuccess'), 'success');
        fetchDashboardData();
      } else {
        showToast(t('alertError'), 'error');
      }
    } catch (err) {
      showToast(t('genericConnError'), 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveBankBalance = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/bank-account', {
        method: 'PUT',
        body: JSON.stringify({ balance: parseFloat(newBalance) || 0 })
      });
      if (res.ok) {
        const data = await res.json();
        setBankBalance(data.balance);
        setIsBankModalOpen(false);
        showToast('Saldo actualizado correctamente', 'success');
      } else {
        showToast('Error al actualizar saldo', 'error');
      }
    } catch (e) {
      showToast('Error de conexión', 'error');
    }
  };

  const monthlyFlow = stats.monthlyFlow || [];

  return (
    <div className="dashboard-container">
      
      {/* Title Bar */}
      <div className="dashboard-title-bar">
        <div>
          <h1 className="dashboard-title">{t('appName')}</h1>
          <p className="dashboard-subtitle">Control financiero total y detección proactiva de fugas</p>
        </div>
        <button 
          onClick={handleSync} 
          className="nmn-btn nmn-btn-primary"
          disabled={syncing}
        >
          {syncing ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin-slow" style={{ marginRight: '6px' }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
              {t('loading')}
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
              {t('syncBtn')}
            </>
          )}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        {/* Bank Balance */}
        <div className="stat-card glass-panel animate-scale" style={{ cursor: 'pointer', border: '1px solid var(--color-primary)' }} onClick={() => { setNewBalance(bankBalance); setIsBankModalOpen(true); }}>
          <span className="stat-label">Saldo en Cuenta</span>
          <span className="stat-value">{symbol}{formatNumber(bankBalance)}</span>
          <span className="stat-trend trend-positive" style={{ color: 'var(--color-primary)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 20V10M18 20V4M6 20v-4"/>
            </svg>
            Toca para ajustar
          </span>
        </div>

        {/* Active Leaks Sum */}
        <div className="stat-card glass-panel animate-scale">
          <span className="stat-label">Fugas Detectadas</span>
          <span className="stat-value">{symbol}{formatNumber(stats.lossesAvoided || 0)}</span>
          <span className="stat-trend trend-neutral">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            En riesgo
          </span>
        </div>

        {/* Net Margin */}
        <div className="stat-card glass-panel animate-scale" style={{ animationDelay: '0.1s' }}>
          <span className="stat-label">{t('statsNetMargin')}</span>
          <span className="stat-value">{stats.netMargin > 0 ? '+' : ''}{Number(stats.netMargin || 0).toFixed(1)}%</span>
          <span className="stat-trend trend-positive">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            Global
          </span>
        </div>

        {/* Operating Margin */}
        <div className="stat-card glass-panel animate-scale" style={{ animationDelay: '0.2s' }}>
          <span className="stat-label">{t('statsOperatingMargin')}</span>
          <span className="stat-value">{stats.operatingMargin > 0 ? '+' : ''}{Number(stats.operatingMargin || 0).toFixed(1)}%</span>
          <span className="stat-trend trend-positive">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            Operativo
          </span>
        </div>

        {/* Active Members -> Fugas Activas */}
        <div className="stat-card glass-panel animate-scale" style={{ animationDelay: '0.3s' }}>
          <span className="stat-label">Cantidad de Fugas</span>
          <span className="stat-value">{stats.activeMembers || 0}</span>
          <span className="stat-trend trend-neutral">
            Requiere acción
          </span>
        </div>
      </div>

      {/* Main Dashboard Layout Section */}
      <div className="dashboard-grid-sections">
        
        {/* Left Column: Flow Chart and Demo */}
        <div className="dashboard-left-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Cash Flow SVG Chart */}
          <div className="glass-panel">
            <h3 className="panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Evolución Flujo de Caja
            </h3>
            
            <div className="chart-wrapper">
              {monthlyFlow.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Sin datos recientes</div>}
              {monthlyFlow.map((f, index) => {
                const maxVal = Math.max(1, ...monthlyFlow.map(m => Math.max(m.income, m.expense)));
                const incPct = (f.income / maxVal) * 100;
                const expPct = (f.expense / maxVal) * 100;

                return (
                  <div key={index} className="chart-bar-group">
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100%' }}>
                      <div className="chart-bar-container" style={{ height: '100%' }} title={`Ingresos: ${symbol}${formatNumber(f.income)}`}>
                        <div className="chart-bar-fill" style={{ height: `${incPct}%`, background: 'var(--color-primary)' }}></div>
                      </div>
                      <div className="chart-bar-container" style={{ height: '100%' }} title={`Gastos: ${symbol}${formatNumber(f.expense)}`}>
                        <div className="chart-bar-fill" style={{ height: `${expPct}%`, background: 'var(--color-danger)' }}></div>
                      </div>
                    </div>
                    <span className="chart-bar-label">{f.month}</span>
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: 'var(--color-primary)', borderRadius: '2px' }}></div>
                <span style={{ color: 'var(--text-light)' }}>Ingresos</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: 'var(--color-danger)', borderRadius: '2px' }}></div>
                <span style={{ color: 'var(--text-light)' }}>Gastos</span>
              </div>
            </div>
          </div>

          {/* CRM milestone & Demo video */}
          <div className="glass-panel">
            <h3 className="panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {t('milestoneCRM')}
            </h3>
            
            <div className="milestone-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                <span>{t('milestoneCRMSub', { progress: stats.milestoneProgress })}</span>
                <span style={{ fontWeight: '700' }}>{stats.milestoneProgress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill-animate" style={{ width: `${stats.milestoneProgress}%` }}></div>
              </div>
            </div>

            <VideoDemo />
          </div>

        </div>

        {/* Right Column: Alerts and Department breakdown */}
        <div className="dashboard-right-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* AI Alerts */}
          {stats.criticalAlerts && stats.criticalAlerts.length > 0 && (
            <div className="glass-panel" style={{ border: '1px solid rgba(255,69,58,0.2)' }}>
              <h3 className="panel-title" style={{ color: 'var(--color-danger)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                {t('aiWarningsTitle')}
              </h3>
              
              <div className="alerts-list">
                {stats.criticalAlerts.map((alert, idx) => (
                  <div key={idx} className="alert-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="alert-icon">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span className="alert-text">{alert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department breakdown */}
          <div className="glass-panel">
            <h3 className="panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Gasto por Departamento
            </h3>
            
            <div className="dept-list">
              {Object.keys(stats.departmentExpenses).map((dept, index) => {
                const spent = stats.departmentExpenses[dept];
                // Find max to scale appropriately
                const maxSpent = Math.max(...Object.values(stats.departmentExpenses));
                const pct = maxSpent > 0 ? (spent / maxSpent) * 100 : 0;

                return (
                  <div key={index} className="dept-item">
                    <div className="dept-header">
                      <span className="dept-name">{dept}</span>
                      <span className="dept-spent">{symbol}{formatNumber(spent)}</span>
                    </div>
                    <div className="dept-progress-track">
                      <div className="dept-progress-fill" style={{ width: `${pct}%`, background: spent > 30000 ? 'var(--color-danger)' : 'var(--color-primary)' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How it works info */}
          <div className="glass-panel">
            <h3 className="panel-title">{t('howItWorksTitle')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '4px' }}>{t('howItWorks1Title')}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{t('howItWorks1Desc')}</p>
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '4px' }}>{t('howItWorks2Title')}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{t('howItWorks2Desc')}</p>
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '4px' }}>{t('howItWorks3Title')}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{t('howItWorks3Desc')}</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Table: Recent Movements */}
      <div className="glass-panel" style={{ width: '100%' }}>
        <h3 className="panel-title">{t('recentMovements')}</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="nmn-table">
            <thead>
              <tr>
                <th>{t('dateCol')}</th>
                <th>{t('descCol')}</th>
                <th>{t('catCol')}</th>
                <th>{t('deptCol')}</th>
                <th>{t('typeCol')}</th>
                <th>{t('amountCol')}</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.date}</td>
                  <td>{tx.description}</td>
                  <td>{tx.category}</td>
                  <td>{tx.department}</td>
                  <td>
                    <span className={`nmn-badge ${tx.type === 'INCOME' ? 'badge-income' : 'badge-expense'}`}>
                      {tx.type === 'INCOME' ? t('incomeType') : t('expenseType')}
                    </span>
                    {tx.isFuga && <span className="nmn-badge badge-leak" style={{ marginLeft: '6px' }}>Leak</span>}
                  </td>
                  <td style={{ fontWeight: '700', color: tx.type === 'INCOME' ? 'var(--color-success)' : 'var(--text-main)' }}>
                    {tx.type === 'INCOME' ? '+' : '-'}{symbol}{formatNumber(tx.amount)}
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay transacciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Balance Modal */}
      {isBankModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBankModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Ajustar Saldo Bancario</h2>
            <form onSubmit={handleSaveBankBalance}>
              <div className="form-group">
                <label>Saldo Actual ({symbol})</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="nmn-btn" onClick={() => setIsBankModalOpen(false)}>Cancelar</button>
                <button type="submit" className="nmn-btn nmn-btn-primary">Guardar Saldo</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
