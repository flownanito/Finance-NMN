import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import '../Dashboard/Dashboard.css';

export default function RecurringExpenses({ authFetch, showToast }) {
  const { t } = useLanguage();
  const { symbol, formatNumber } = useCurrency();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Suscripciones',
    department: 'General',
    frequency: 'MONTHLY',
    executionDay: 1,
    isActive: true
  });

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/recurring-expenses');
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [authFetch]);

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: '',
      category: 'Suscripciones',
      department: 'General',
      frequency: 'MONTHLY',
      executionDay: 1,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      department: expense.department,
      frequency: expense.frequency,
      executionDay: expense.executionDay,
      isActive: expense.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este gasto recurrente?")) return;
    try {
      const res = await authFetch(`/api/recurring-expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Gasto recurrente eliminado', 'success');
        fetchExpenses();
      } else {
        showToast('Error al eliminar', 'error');
      }
    } catch (err) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...formData, amount: parseFloat(formData.amount) };

    const url = editingExpense ? `/api/recurring-expenses/${editingExpense.id}` : '/api/recurring-expenses';
    const method = editingExpense ? 'PUT' : 'POST';

    try {
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingExpense ? 'Gasto actualizado' : 'Gasto recurrente creado', 'success');
        setIsModalOpen(false);
        fetchExpenses();
      } else {
        showToast('Error al guardar el gasto', 'error');
      }
    } catch (err) {
      showToast('Error de conexión', 'error');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-title-bar">
        <div>
          <h1 className="dashboard-title">Gastos Recurrentes</h1>
          <p className="dashboard-subtitle">Automatización de pagos fijos y suscripciones</p>
        </div>
        <button className="nmn-btn nmn-btn-primary" onClick={handleOpenAddModal}>
          + Añadir Recurrente
        </button>
      </div>

      <div className="glass-panel" style={{ marginTop: '24px' }}>
        {isLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos...</div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay gastos recurrentes configurados. ¡Crea el primero!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Descripción</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Frecuencia</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Día / Siguiente Cobro</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Monto</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Estado</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{expense.description}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{expense.category} - {expense.department}</div>
                  </td>
                  <td style={{ padding: '16px' }}>{expense.frequency === 'MONTHLY' ? 'Mensual' : expense.frequency === 'WEEKLY' ? 'Semanal' : 'Anual'}</td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    Día {expense.executionDay} <br/>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>({expense.nextExecutionDate || 'Pendiente'})</span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-danger)' }}>
                    -{symbol}{formatNumber(expense.amount)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {expense.isActive ? (
                      <span style={{ background: 'rgba(52, 199, 89, 0.15)', color: 'var(--color-success)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Activo</span>
                    ) : (
                      <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Pausado</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button className="nmn-btn" style={{ padding: '6px 12px', fontSize: '0.8rem', marginRight: '8px' }} onClick={() => handleOpenEditModal(expense)}>Editar</button>
                    <button className="nmn-btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255,59,48,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(255,59,48,0.3)' }} onClick={() => handleDelete(expense.id)}>Borrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content glass-panel" style={{ width: '450px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
              {editingExpense ? 'Editar Gasto Recurrente' : 'Añadir Gasto Recurrente'}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group">
                <label>Descripción</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required className="nmn-input" />
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Monto ({symbol})</label>
                  <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required className="nmn-input" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Frecuencia</label>
                  <select value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})} className="nmn-input">
                    <option value="MONTHLY">Mensual</option>
                    <option value="WEEKLY">Semanal</option>
                    <option value="YEARLY">Anual</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Día de Ejecución</label>
                  <input type="number" min="1" max="31" value={formData.executionDay} onChange={e => setFormData({...formData, executionDay: parseInt(e.target.value)})} required className="nmn-input" title="Día del mes (1-31), día de la semana (1-7), o día del año (1-365)" />
                </div>
                <div className="form-group" style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                    Activo
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Categoría</label>
                  <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required className="nmn-input" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Departamento</label>
                  <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required className="nmn-input" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="nmn-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="nmn-btn nmn-btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
