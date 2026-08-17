import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import './Invoices.css';

export default function Invoices({ authFetch, showToast, isClosed }) {
  const { t } = useLanguage();
  const { symbol, formatNumber } = useCurrency();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Form States
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('CREATE'); // CREATE or EDIT
  const [editingId, setEditingId] = useState(null);
  
  const [clientName, setClientName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [concept, setConcept] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [department, setDepartment] = useState('Ventas');
  
  // Validation errors
  const [errors, setErrors] = useState({});

  // Uploader & Scanning States
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanningFile, setScanningFile] = useState(null);

  // Stats
  const [totalInvoiced, setTotalInvoiced] = useState(0);
  const [pendingCollection, setPendingCollection] = useState(0);
  const [paidCollection, setPaidCollection] = useState(0);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
        calculateStats(data);
      } else {
        showToast(t('alertError'), 'error');
      }
    } catch (err) {
      showToast(t('genericConnError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    let total = 0;
    let pending = 0;
    let paid = 0;
    data.forEach(inv => {
      total += inv.amount;
      if (inv.status === 'PENDING') {
        pending += inv.amount;
      } else {
        paid += inv.amount;
      }
    });
    setTotalInvoiced(total);
    setPendingCollection(pending);
    setPaidCollection(paid);
  };

  // Form Validations
  const validateForm = () => {
    const tempErrors = {};
    
    // Client Name
    if (!clientName.trim()) {
      tempErrors.clientName = 'El nombre del cliente es obligatorio';
    } else if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,#()\/+\-:]+$/.test(clientName)) {
      tempErrors.clientName = 'El nombre contiene caracteres no permitidos';
    }
    
    // Invoice Number
    if (!invoiceNumber.trim()) {
      tempErrors.invoiceNumber = 'El número de factura es obligatorio';
    } else if (!/^[a-zA-Z0-9-:\s/]+$/.test(invoiceNumber)) {
      tempErrors.invoiceNumber = 'Formato de factura inválido';
    }
    
    // Amount
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      tempErrors.amount = 'El monto debe ser un número superior a 0';
    }
    
    // Date
    if (!date) {
      tempErrors.date = 'La fecha es obligatoria';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      tempErrors.date = 'La fecha debe tener formato YYYY-MM-DD';
    }
    
    // Concept
    if (!concept.trim()) {
      tempErrors.concept = 'El concepto es obligatorio';
    } else if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,#()\/+\-:]+$/.test(concept)) {
      tempErrors.concept = 'El concepto contiene caracteres no permitidos';
    }
    
    // Department
    if (!department) {
      tempErrors.department = 'El departamento es obligatorio';
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleOpenCreateModal = () => {
    if (isClosed) return;
    setFormMode('CREATE');
    setEditingId(null);
    setClientName('');
    setInvoiceNumber(`FAC-2026-${String(Math.floor(Math.random() * 900) + 100)}`);
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setConcept('');
    setStatus('PENDING');
    setDepartment('Ventas');
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (inv) => {
    if (isClosed) return;
    setFormMode('EDIT');
    setEditingId(inv.id);
    setClientName(inv.clientName);
    setInvoiceNumber(inv.invoiceNumber);
    setAmount(String(inv.amount));
    setDate(inv.date);
    setConcept(inv.concept);
    setStatus(inv.status);
    setDepartment(inv.department);
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isClosed) return;
    if (!validateForm()) return;

    const payload = {
      clientName: clientName.trim(),
      invoiceNumber: invoiceNumber.trim(),
      amount: parseFloat(amount),
      date,
      concept: concept.trim(),
      status,
      department
    };

    try {
      const url = formMode === 'CREATE' ? '/api/invoices' : `/api/invoices/${editingId}`;
      const method = formMode === 'CREATE' ? 'POST' : 'PUT';

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast(t('alertSuccess'), 'success');
        setShowModal(false);
        fetchInvoices();
      } else {
        const errData = await response.json();
        setErrors(errData);
        showToast(t('alertError'), 'error');
      }
    } catch (err) {
      showToast(t('genericConnError'), 'error');
    }
  };

  const handleDelete = async (id) => {
    if (isClosed) return;
    if (!window.confirm(t('confirmDelete'))) return;

    try {
      const response = await authFetch(`/api/invoices/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showToast(t('alertSuccess'), 'success');
        fetchInvoices();
      } else {
        showToast(t('alertError'), 'error');
      }
    } catch (err) {
      showToast(t('genericConnError'), 'error');
    }
  };

  // Drag and Drop simulation
  const handleDragOver = (e) => {
    e.preventDefault();
    if (isClosed) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isClosed) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processDroppedFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (isClosed) return;
    const files = e.target.files;
    if (files.length > 0) {
      processDroppedFile(files[0]);
    }
  };

  const processDroppedFile = (file) => {
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');

    if (!isPDF && !isCSV) {
      showToast('Formato no soportado. Por favor sube un archivo PDF o CSV.', 'error');
      return;
    }

    setScanningFile(file);
    setIsScanning(true);
    setScanProgress(0);

    // Simulate scanning/OCR extraction loading progress bar
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            finalizeFileImport(file, isCSV);
          }, 400);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const finalizeFileImport = async (file, isCSV) => {
    // Generate invoice fields based on file metadata or content
    const randomAmount = Math.floor(1000 + Math.random() * 8000) + 0.50;
    const randomInvNum = `FAC-2026-${String(Math.floor(Math.random() * 800) + 100)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    let client = 'Cliente Importado';
    let conceptStr = 'Servicio Tecnológico y Licencias';
    let dept = 'IT';

    // Parse file name to try to extract names
    const nameLower = file.name.toLowerCase();
    if (nameLower.includes('google')) {
      client = 'Google Cloud Spain';
      conceptStr = 'Consumo de Computación e Infraestructura';
      dept = 'IT';
    } else if (nameLower.includes('amazon') || nameLower.includes('aws')) {
      client = 'Amazon Web Services';
      conceptStr = 'Alojamiento Servidores Producción';
      dept = 'IT';
    } else if (nameLower.includes('salesforce') || nameLower.includes('crm')) {
      client = 'Salesforce Iberia S.L.';
      conceptStr = 'Licencias CRM Cloud Corporativo';
      dept = 'Ventas';
    } else if (nameLower.includes('marketing') || nameLower.includes('ads')) {
      client = 'Agencia Leads Global';
      conceptStr = 'Campañas de Publicidad Online';
      dept = 'Marketing';
    } else {
      client = file.name.replace(/\.[^/.]+$/, "").substring(0, 30);
    }

    // If CSV, we can simulate reading columns or just logging it
    if (isCSV) {
      conceptStr = 'Importación Lote Facturación CSV';
    }

    const payload = {
      clientName: client,
      invoiceNumber: randomInvNum,
      amount: randomAmount,
      date: todayStr,
      concept: conceptStr,
      status: 'PAID', // Dropped invoices simulated as already Paid
      department: dept
    };

    try {
      const response = await authFetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast(`Factura ${randomInvNum} de ${client} (${symbol}${randomAmount}) importada con éxito.`, 'success');
        fetchInvoices();
      } else {
        showToast('Error al registrar la factura analizada.', 'error');
      }
    } catch (err) {
      showToast(t('genericConnError'), 'error');
    } finally {
      setIsScanning(false);
      setScanningFile(null);
    }
  };

  // Filter Logic
  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;
    const matchesDept = filterDept === 'ALL' || inv.department === filterDept;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      inv.clientName.toLowerCase().includes(query) ||
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.concept.toLowerCase().includes(query) ||
      inv.department.toLowerCase().includes(query);

    return matchesStatus && matchesDept && matchesSearch;
  });

  return (
    <div className="invoices-container">
      <div className="invoices-header-bar">
        <div>
          <h1 className="page-title">{t('invTitle')}</h1>
          <p className="page-subtitle">{t('invSubtitle')}</p>
        </div>
        <button 
          className="nmn-btn nmn-btn-primary"
          onClick={handleOpenCreateModal}
          disabled={isClosed}
        >
          {t('addInvoice')}
        </button>
      </div>

      {isClosed && (
        <div className="closure-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>{t('closureLockedMsg')}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="invoices-stats">
        <div className="glass-panel inv-stat-card">
          <span className="stat-label">Ingresos Totales Facturados</span>
          <span className="stat-value text-primary">{symbol}{formatNumber(totalInvoiced)}</span>
        </div>
        <div className="glass-panel inv-stat-card">
          <span className="stat-label">{t('statusPaid')}</span>
          <span className="stat-value text-success">{symbol}{formatNumber(paidCollection)}</span>
        </div>
        <div className="glass-panel inv-stat-card">
          <span className="stat-label">Pendiente de Cobro</span>
          <span className="stat-value text-warning">{symbol}{formatNumber(pendingCollection)}</span>
        </div>
      </div>

      {/* File Dropzone */}
      <div className="dropzone-container">
        {isScanning ? (
          <div className="glass-panel invoice-dropzone">
            <div className="dropzone-scanning-hud">
              <div className="scanning-radar">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <span className="scanning-text">{t('dropzoneScanning')}</span>
              <span className="scanning-filename">{scanningFile?.name}</span>
              <div className="progress-bar-container" style={{ width: '280px', marginTop: '10px' }}>
                <div className="progress-bar-fill" style={{ width: `${scanProgress}%` }}></div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className={`glass-panel invoice-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isClosed && fileInputRef.current.click()}
            style={{ opacity: isClosed ? 0.6 : 1, cursor: isClosed ? 'default' : 'pointer' }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".pdf,.csv"
              onChange={handleFileSelect}
              disabled={isClosed}
            />
            <div className="dropzone-icon-box">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <polyline points="9 15 12 12 15 15"></polyline>
              </svg>
            </div>
            <span className="dropzone-title">{t('dropzoneText')}</span>
            <span className="dropzone-sub">Formatos soportados: PDF de Facturas o Listados CSV</span>
          </div>
        )}
      </div>

      {/* Toolbar / Filters */}
      <div className="glass-panel table-card">
        <div className="table-header-toolbar">
          <div className="invoices-toolbar">
            <div className="search-box">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                className="nmn-input" 
                placeholder="Buscar cliente, factura..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select 
              className="nmn-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="ALL">Todos los Estados</option>
              <option value="PAID">{t('statusPaid')}</option>
              <option value="PENDING">{t('statusPending')}</option>
            </select>

            <select 
              className="nmn-select"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="ALL">{t('filterAll')}</option>
              <option value="Ventas">Ventas</option>
              <option value="IT">IT</option>
              <option value="Marketing">Marketing</option>
              <option value="Operaciones">Operaciones</option>
              <option value="RRHH">RRHH</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('loading')}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No se encontraron facturas registradas.
          </div>
        ) : (
          <div className="table-container">
            <table className="nmn-table">
              <thead>
                <tr>
                  <th>{t('invoiceNumCol')}</th>
                  <th>{t('clientNameCol')}</th>
                  <th>{t('conceptCol')}</th>
                  <th>{t('amountCol')}</th>
                  <th>{t('dateCol')}</th>
                  <th>{t('deptCol')}</th>
                  <th>{t('statusCol')}</th>
                  {!isClosed && <th>{t('actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{inv.invoiceNumber}</td>
                    <td>{inv.clientName}</td>
                    <td>{inv.concept}</td>
                    <td style={{ fontWeight: 'bold' }}>{symbol}{formatNumber(inv.amount)}</td>
                    <td>{inv.date}</td>
                    <td>
                      <span className="nmn-badge badge-dept">{inv.department}</span>
                    </td>
                    <td>
                      <span className={`nmn-badge ${inv.status === 'PAID' ? 'badge-paid' : 'badge-pending'}`}>
                        {inv.status === 'PAID' ? t('statusPaid') : t('statusPending')}
                      </span>
                    </td>
                    {!isClosed && (
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="btn-icon"
                            onClick={() => handleOpenEditModal(inv)}
                            title={t('save')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button 
                            className="btn-icon btn-icon-delete"
                            onClick={() => handleDelete(inv.id)}
                            title={t('delete')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual log invoice modal */}
      {showModal && (
        <div className="invoice-modal-overlay">
          <div className="invoice-modal-content glass-panel">
            <h2 className="modal-title">
              {formMode === 'CREATE' ? t('addInvoice') : t('editInvoice')}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('clientNameCol')}</label>
                <input 
                  type="text" 
                  className={`nmn-input ${errors.clientName ? 'error' : ''}`}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
                {errors.clientName && <span className="error-message">{errors.clientName}</span>}
              </div>

              <div className="form-group-row">
                <div className="form-group flex-1">
                  <label className="form-label">{t('invoiceNumCol')}</label>
                  <input 
                    type="text" 
                    className={`nmn-input ${errors.invoiceNumber ? 'error' : ''}`}
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                  {errors.invoiceNumber && <span className="error-message">{errors.invoiceNumber}</span>}
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">{t('amountCol')} ({symbol})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className={`nmn-input ${errors.amount ? 'error' : ''}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {errors.amount && <span className="error-message">{errors.amount}</span>}
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group flex-1">
                  <label className="form-label">{t('dateCol')}</label>
                  <input 
                    type="date" 
                    className={`nmn-input ${errors.date ? 'error' : ''}`}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  {errors.date && <span className="error-message">{errors.date}</span>}
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">{t('deptCol')}</label>
                  <select 
                    className="nmn-select"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="Ventas">Ventas</option>
                    <option value="IT">IT</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="RRHH">RRHH</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('conceptCol')}</label>
                <input 
                  type="text" 
                  className={`nmn-input ${errors.concept ? 'error' : ''}`}
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                />
                {errors.concept && <span className="error-message">{errors.concept}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">{t('statusCol')}</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="status" 
                      value="PAID"
                      checked={status === 'PAID'}
                      onChange={() => setStatus('PAID')}
                    />
                    <span>{t('statusPaid')}</span>
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="status" 
                      value="PENDING"
                      checked={status === 'PENDING'}
                      onChange={() => setStatus('PENDING')}
                    />
                    <span>{t('statusPending')}</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="nmn-btn nmn-btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="nmn-btn nmn-btn-primary"
                >
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
