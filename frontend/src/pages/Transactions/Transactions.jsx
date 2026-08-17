import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import './Transactions.css';

export default function Transactions({ authFetch, showToast, isClosed }) {
  const { t } = useLanguage();
  const { symbol, formatNumber } = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE',
    category: 'Suscripciones',
    department: 'IT',
    date: new Date().toISOString().split('T')[0],
    isFuga: false,
    fugaReason: ''
  });

  const fetchTransactions = async () => {
    try {
      const res = await authFetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [authFetch]);

  useEffect(() => {
    let result = [...transactions];

    if (search) {
      result = result.filter(tx => 
        tx.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedDept) {
      result = result.filter(tx => tx.department === selectedDept);
    }

    if (selectedCat) {
      result = result.filter(tx => tx.category === selectedCat);
    }

    // Sort by date desc
    result.sort((a, b) => b.date.localeCompare(a.date));
    setFilteredTransactions(result);
  }, [transactions, search, selectedDept, selectedCat]);

  const handleOpenAdd = () => {
    if (isClosed) {
      showToast(t('closureLockedMsg'), 'warning');
      return;
    }
    setEditingTx(null);
    setForm({
      description: '',
      amount: '',
      type: 'EXPENSE',
      category: 'Suscripciones',
      department: 'IT',
      date: new Date().toISOString().split('T')[0],
      isFuga: false,
      fugaReason: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (tx) => {
    if (isClosed) {
      showToast(t('closureLockedMsg'), 'warning');
      return;
    }
    setEditingTx(tx);
    setForm({
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      department: tx.department,
      date: tx.date,
      isFuga: tx.isFuga,
      fugaReason: tx.fugaReason || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (isClosed) {
      showToast(t('closureLockedMsg'), 'warning');
      return;
    }
    if (!window.confirm(t('confirmDelete'))) return;

    try {
      const res = await authFetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(t('alertSuccess'), 'success');
        fetchTransactions();
      } else {
        showToast(t('alertError'), 'error');
      }
    } catch (err) {
      showToast(t('genericConnError'), 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.date) return;

    const body = {
      ...form,
      amount: parseFloat(form.amount)
    };

    try {
      const url = editingTx ? `/api/transactions/${editingTx.id}` : '/api/transactions';
      const method = editingTx ? 'PUT' : 'POST';
      
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(body)
      });

      if (res.ok) {
        showToast(t('alertSuccess'), 'success');
        setModalOpen(false);
        fetchTransactions();
      } else {
        const errors = await res.json();
        const firstError = Object.values(errors)[0] || t('alertError');
        showToast(firstError, 'error');
      }
    } catch (err) {
      showToast(t('genericConnError'), 'error');
    }
  };

  // Get unique categories and departments for filter selects
  const departments = [...new Set(transactions.map(t => t.department))];
  const categories = [...new Set(transactions.map(t => t.category))];

  return (
    <div className="tx-container">
      
      {/* Page Header */}
      <div className="tx-header-bar">
        <div>
          <h1 className="dashboard-title">{t('txTitle')}</h1>
          <p className="dashboard-subtitle">{t('txSubtitle')}</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          className="nmn-btn nmn-btn-primary"
          disabled={isClosed}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {t('addTx')}
        </button>
      </div>

      {/* Freeze alert if closed */}
      {isClosed && (
        <div className="login-alert-error" style={{ margin: '0', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>{t('closureLockedMsg')}</span>
        </div>
      )}

      {/* Toolbar Filters */}
      <div className="glass-panel tx-toolbar">
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input 
            type="text" 
            placeholder="Buscar por descripción..." 
            className="nmn-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select 
            className="nmn-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">{t('filterAll')}</option>
            {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <select 
            className="nmn-select"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="">{t('filterCategory')}</option>
            {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Transactions Table Log */}
      <div className="glass-panel" style={{ width: '100%' }}>
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
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.date}</td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{tx.description}</div>
                    {tx.isFuga && <span style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}>{tx.fugaReason}</span>}
                  </td>
                  <td>{tx.category}</td>
                  <td>{tx.department}</td>
                  <td>
                    <span className={`nmn-badge ${tx.type === 'INCOME' ? 'badge-income' : 'badge-expense'}`}>
                      {tx.type === 'INCOME' ? t('incomeType') : t('expenseType')}
                    </span>
                    {tx.isFuga && <span className="nmn-badge badge-leak" style={{ marginLeft: '6px' }}>Fuga</span>}
                  </td>
                  <td style={{ fontWeight: '700', color: tx.type === 'INCOME' ? 'var(--color-success)' : 'var(--text-main)' }}>
                    {tx.type === 'INCOME' ? '+' : '-'}{symbol}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button 
                        onClick={() => handleOpenEdit(tx)} 
                        className="btn-icon" 
                        disabled={isClosed}
                        title={t('editTx')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(tx.id)} 
                        className="btn-icon btn-icon-delete" 
                        disabled={isClosed}
                        title={t('delete')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron transacciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal Form */}
      {modalOpen && (
        <div className="tx-modal-overlay animate-fade">
          <div className="tx-modal-content glass-panel animate-scale">
            <h3 className="tx-modal-title">{editingTx ? t('editTx') : t('addTx')}</h3>
            
            <form onSubmit={handleSubmit} className="tx-form">
              <div className="input-group">
                <label className="input-label">{t('descCol')}</label>
                <input 
                  type="text" 
                  className="nmn-input" 
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  required
                />
              </div>

              <div className="tx-form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="input-label">{t('amountCol')} ({symbol})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    className="nmn-input" 
                    value={form.amount}
                    onChange={(e) => setForm({...form, amount: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('typeCol')}</label>
                  <select 
                    className="nmn-select"
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value})}
                  >
                    <option value="EXPENSE">{t('expenseType')}</option>
                    <option value="INCOME">{t('incomeType')}</option>
                  </select>
                </div>
              </div>

              <div className="tx-form-row">
                <div className="input-group">
                  <label className="input-label">{t('catCol')}</label>
                  <input 
                    type="text" 
                    className="nmn-input" 
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('deptCol')}</label>
                  <input 
                    type="text" 
                    className="nmn-input" 
                    value={form.department}
                    onChange={(e) => setForm({...form, department: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">{t('dateCol')}</label>
                <input 
                  type="date" 
                  className="nmn-input" 
                  value={form.date}
                  onChange={(e) => setForm({...form, date: e.target.value})}
                  required
                />
              </div>

              {/* Fuga attributes */}
              {form.type === 'EXPENSE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  <label className="checkbox-group">
                    <input 
                      type="checkbox" 
                      checked={form.isFuga}
                      onChange={(e) => setForm({...form, isFuga: e.target.checked})}
                    />
                    <span className="checkbox-label">{t('isFugaLabel')}</span>
                  </label>
                  
                  {form.isFuga && (
                    <div className="input-group">
                      <label className="input-label">{t('fugaReasonLabel')}</label>
                      <input 
                        type="text" 
                        className="nmn-input" 
                        value={form.fugaReason}
                        onChange={(e) => setForm({...form, fugaReason: e.target.value})}
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="nmn-btn nmn-btn-secondary">
                  {t('cancel')}
                </button>
                <button type="submit" className="nmn-btn nmn-btn-primary">
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
