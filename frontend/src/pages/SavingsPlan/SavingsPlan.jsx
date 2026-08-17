import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import './SavingsPlan.css';

export default function SavingsPlan({ authFetch, showToast, isClosed, setIsClosed }) {
  const { t } = useLanguage();
  const { symbol, formatNumber } = useCurrency();
  const [loadingClosure, setLoadingClosure] = useState(false);
  const [stats, setStats] = useState(null);

  // Goal type selection: RESERVE | BILLING_GROWTH | QUARTERLY_SALES | CHRISTMAS_CAMPAIGN
  const [goalType, setGoalType] = useState('RESERVE'); 
  
  // Dynamic Inputs
  const [goalAmount, setGoalAmount] = useState(50000); // for RESERVE
  const [billingGrowthPct, setBillingGrowthPct] = useState(20); // for BILLING_GROWTH
  const [quarterlySalesAmount, setQuarterlySalesAmount] = useState(100000); // for QUARTERLY_SALES
  const [christmasSalesAmount, setChristmasSalesAmount] = useState(40000); // for CHRISTMAS_CAMPAIGN
  const [expenseReductionPct, setExpenseReductionPct] = useState(15); // for CHRISTMAS_CAMPAIGN

  const [timeframe, setTimeframe] = useState(12); // months

  const [strategies, setStrategies] = useState({
    cutLeaks: false,
    increaseTicket: false,
    expandTeam: false,
    optimizeMarketing: false
  });

  const fetchStats = async () => {
    try {
      const res = await authFetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [authFetch]);

  // Adjust timeframe defaults based on selected goal type
  useEffect(() => {
    if (goalType === 'RESERVE') {
      setTimeframe(12);
    } else if (goalType === 'BILLING_GROWTH') {
      setTimeframe(6);
    } else if (goalType === 'QUARTERLY_SALES') {
      setTimeframe(3);
    } else if (goalType === 'CHRISTMAS_CAMPAIGN') {
      setTimeframe(2);
    }
  }, [goalType]);

  // Base metrics from database (transactions seeded represent ~3 months)
  const baseMonthlyRevenue = stats ? stats.totalIncome / 3 : 25000;
  const baseMonthlyExpenses = stats ? stats.totalExpense / 3 : 20000;
  const baseMonthlyProfit = baseMonthlyRevenue - baseMonthlyExpenses;
  
  // Strategy impacts:
  // - cutLeaks: saves 1,150/mo
  // - increaseTicket: increases sales by 3,800/mo
  // - expandTeam: costs 2,500/mo but generates 7,500/mo (net profit +5,000/mo)
  // - optimizeMarketing: saves 1,200/mo

  // Simulated metrics
  const simulatedRevenue = baseMonthlyRevenue 
    + (strategies.increaseTicket ? 3800 : 0) 
    + (strategies.expandTeam ? 7500 : 0);

  const simulatedExpenses = baseMonthlyExpenses 
    - (strategies.cutLeaks ? 1150 : 0) 
    - (strategies.optimizeMarketing ? 1200 : 0)
    + (strategies.expandTeam ? 2500 : 0);

  const simulatedMonthlyProfit = simulatedRevenue - simulatedExpenses;

  // Evaluation logic per goal type
  let isGoalOnTrack = false;
  let monthsCurrent = 0;
  let monthsSimulated = 0;
  
  let targetValStr = '';
  let currentValStr = '';
  let simulatedValStr = '';

  if (goalType === 'RESERVE') {
    monthsCurrent = Math.ceil(goalAmount / Math.max(1, baseMonthlyProfit));
    monthsSimulated = Math.ceil(goalAmount / Math.max(1, simulatedMonthlyProfit));
    isGoalOnTrack = monthsSimulated <= timeframe;

    targetValStr = `${symbol}${formatNumber(goalAmount)}`;
    currentValStr = `${symbol}${formatNumber(Math.round(baseMonthlyProfit))}/mes`;
    simulatedValStr = `${symbol}${formatNumber(Math.round(simulatedMonthlyProfit))}/mes`;

  } else if (goalType === 'BILLING_GROWTH') {
    const requiredRevenueIncrease = baseMonthlyRevenue * (billingGrowthPct / 100);
    const simulatedRevenueIncrease = (strategies.increaseTicket ? 3800 : 0) + (strategies.expandTeam ? 7500 : 0);
    
    isGoalOnTrack = simulatedRevenueIncrease >= requiredRevenueIncrease;
    monthsCurrent = requiredRevenueIncrease > 0 ? 99 : 0; // infinite without levers
    monthsSimulated = isGoalOnTrack ? 1 : Math.ceil(requiredRevenueIncrease / Math.max(1, simulatedRevenueIncrease));

    targetValStr = `+${billingGrowthPct}% (+${symbol}${formatNumber(Math.round(requiredRevenueIncrease))}/mes)`;
    currentValStr = `${symbol}${formatNumber(Math.round(baseMonthlyRevenue))}/mes`;
    simulatedValStr = `${symbol}${formatNumber(Math.round(simulatedRevenue))}/mes`;

  } else if (goalType === 'QUARTERLY_SALES') {
    // 3 months sales target
    const currentQuarterlySales = baseMonthlyRevenue * 3;
    const simulatedQuarterlySales = simulatedRevenue * 3;

    isGoalOnTrack = simulatedQuarterlySales >= quarterlySalesAmount;
    monthsCurrent = currentQuarterlySales >= quarterlySalesAmount ? 1 : 99;
    monthsSimulated = isGoalOnTrack ? 1 : 99;

    targetValStr = `${symbol}${formatNumber(quarterlySalesAmount)}`;
    currentValStr = `${symbol}${formatNumber(Math.round(currentQuarterlySales))}/trimestre`;
    simulatedValStr = `${symbol}${formatNumber(Math.round(simulatedQuarterlySales))}/trimestre`;

  } else if (goalType === 'CHRISTMAS_CAMPAIGN') {
    // 2 months sales target and expense reduction target
    const targetExpensesCut = baseMonthlyExpenses * (expenseReductionPct / 100);
    const simulatedExpensesCut = (strategies.cutLeaks ? 1150 : 0) + (strategies.optimizeMarketing ? 1200 : 0);
    const simulatedCampaignSales = simulatedRevenue * 2;

    const salesMet = simulatedCampaignSales >= christmasSalesAmount;
    const expensesMet = simulatedExpensesCut >= targetExpensesCut;

    isGoalOnTrack = salesMet && expensesMet;
    monthsCurrent = 99;
    monthsSimulated = isGoalOnTrack ? 1 : 99;

    targetValStr = `${symbol}${formatNumber(christmasSalesAmount)} Ventas & -${expenseReductionPct}% Gastos`;
    currentValStr = `${symbol}${formatNumber(Math.round(baseMonthlyRevenue * 2))} Ventas`;
    simulatedValStr = `${symbol}${formatNumber(Math.round(simulatedCampaignSales))} Ventas & -${symbol}${formatNumber(Math.round(simulatedExpensesCut))}/mes Ahorro`;
  }

  const handleStrategyToggle = (key) => {
    if (isClosed) return;
    setStrategies(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDownloadCsv = (reportType) => {
    const url = `/api/reports/download?type=${reportType}`;
    const link = document.createElement('a');
    authFetch(url)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.blob();
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        link.href = blobUrl;
        const todayStr = new Date().toISOString().split('T')[0];
        link.download = `informe_${reportType.toLowerCase()}_${todayStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        showToast(t('alertSuccess'), 'success');
      })
      .catch(() => {
        showToast(t('genericConnError'), 'error');
      });
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(9, 10, 15);
      doc.text("PLAN ESTRATEGICO PERSONALIZADO - NMN", 14, 22);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(134, 134, 139);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text("Generado por: NMN Finance Goals & Strategy Simulator", 14, 35);
      
      doc.setDrawColor(220, 220, 224);
      doc.line(14, 40, 196, 40);

      // Section 1: Goal Details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(0, 122, 255);
      doc.text("1. METAS FINANCIERAS CONFIGURADAS", 14, 52);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 85);
      
      let typeLabel = "";
      if (goalType === 'RESERVE') typeLabel = t('goalTypeReserve');
      else if (goalType === 'BILLING_GROWTH') typeLabel = t('goalTypeBilling');
      else if (goalType === 'QUARTERLY_SALES') typeLabel = t('goalTypeQuarterly');
      else if (goalType === 'CHRISTMAS_CAMPAIGN') typeLabel = t('goalTypeChristmas');

      doc.text(`Tipo de Planificación: ${typeLabel}`, 14, 62);
      doc.text(`Objetivo Clave: ${targetValStr}`, 14, 68);
      doc.text(`Plazo de Tiempo Establecido: ${timeframe} meses`, 14, 74);

      // Section 2: Projections
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 122, 255);
      doc.text("2. COMPARATIVA DE RENDIMIENTO Y ESCENARIOS", 14, 88);

      doc.setFont("helvetica", "normal");
      doc.text(`Estado Base: ${currentValStr}`, 14, 98);
      doc.text(`Simulación Estratégica: ${simulatedValStr}`, 14, 104);

      if (goalType === 'RESERVE') {
        doc.text(`Tiempo estimado con ritmo actual: ${monthsCurrent} meses`, 14, 112);
        doc.setFont("helvetica", "bold");
        doc.text(`Tiempo estimado con simulación: ${monthsSimulated} meses`, 14, 118);
      } else {
        doc.text(`¿Objetivo viable con ritmo actual?: ${monthsCurrent <= timeframe && monthsCurrent !== 99 ? "SÍ" : "NO"}`, 14, 112);
        doc.setFont("helvetica", "bold");
        doc.text(`¿Objetivo viable con simulación?: ${isGoalOnTrack ? "SÍ" : "NO"}`, 14, 118);
      }

      // Section 3: Active Levers
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 122, 255);
      doc.text("3. PALANCAS ESTRATEGICAS APLICADAS", 14, 132);

      let y = 142;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      if (strategies.cutLeaks) {
        doc.text(`- Recortar Fugas de Capital: Desactivación de suscripciones redundantes e ineficiencias (+${symbol}1,150/mes)`, 14, y);
        y += 8;
      }
      if (strategies.increaseTicket) {
        doc.text(`- Aumentar Ticket Medio: Incremento de precios de productos/servicios en 15% (+${symbol}3,800/mes)`, 14, y);
        y += 8;
      }
      if (strategies.expandTeam) {
        doc.text(`- Aumentar Equipo: Incorporación de comerciales para captar contratos (+${symbol}5,000/mes netos)`, 14, y);
        y += 8;
      }
      if (strategies.optimizeMarketing) {
        doc.text(`- Optimizar Marketing: Recorte de presupuestos de campañas con ROI negativo (+${symbol}1,200/mes)`, 14, y);
        y += 8;
      }
      if (!strategies.cutLeaks && !strategies.increaseTicket && !strategies.expandTeam && !strategies.optimizeMarketing) {
        doc.text("Ninguna palanca estratégica activa seleccionada. Plan de crecimiento conservador.", 14, y);
        y += 8;
      }

      // Conclusion box
      y += 12;
      doc.setDrawColor(230, 230, 235);
      if (isGoalOnTrack) {
        doc.setFillColor(235, 247, 239);
        doc.rect(14, y, 182, 24, "FD");
        doc.setFont("helvetica", "bold");
        doc.setTextColor(34, 139, 34);
        doc.text("ESTADO DEL PLAN: COMPORTAMIENTO VIABLE", 18, y + 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.text("Las estrategias activas garantizan cumplir los objetivos financieros dentro del plazo establecido.", 18, y + 17);
      } else {
        doc.setFillColor(254, 243, 233);
        doc.rect(14, y, 182, 24, "FD");
        doc.setFont("helvetica", "bold");
        doc.setTextColor(218, 112, 21);
        doc.text("ESTADO DEL PLAN: COMPORTAMIENTO RETRASADO o INSUFICIENTE", 18, y + 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.text("Se recomienda activar palancas adicionales de ventas o recorte de gastos para asegurar la viabilidad.", 18, y + 17);
      }

      doc.save(`plan_estrategico_nmn_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast("Plan estratégico en formato PDF descargado con éxito.", "success");
    } catch (err) {
      console.error(err);
      showToast("Error al generar el PDF del reporte.", "error");
    }
  };

  const handleDailyClosure = async () => {
    if (isClosed) return;
    setLoadingClosure(true);

    try {
      const res = await authFetch('/api/reports/closure', {
        method: 'POST'
      });

      if (res.ok) {
        const blob = await res.blob();
        
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        const todayStr = new Date().toISOString().split('T')[0];
        link.download = `cierre_financiero_${todayStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        setIsClosed(true);
        localStorage.setItem('nmn_is_closed', 'true');
        showToast(t('dailyClosureDone'), 'success');
      } else {
        showToast(t('alertError'), 'error');
      }
    } catch (err) {
      showToast(t('genericConnError'), 'error');
    } finally {
      setLoadingClosure(false);
    }
  };

  return (
    <div className="savings-container">
      
      {/* Page Header */}
      <div className="savings-header-bar">
        <div>
          <h1 className="page-title">{t('savingsTitle')}</h1>
          <p className="page-subtitle">{t('savingsSubtitle')}</p>
        </div>
      </div>

      {isClosed && (
        <div className="closure-banner" style={{ marginBottom: '20px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>{t('closureLockedMsg')}</span>
        </div>
      )}

      <div className="savings-layout-grid">
        
        {/* Left Column: Simulator Inputs */}
        <div className="simulator-config flex-1">
          <div className="glass-panel config-panel">
            <h3 className="panel-title">1. Ajustes de la Meta Financiera</h3>
            
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">{t('goalTypeLabel')}</label>
              <select 
                className="nmn-select"
                value={goalType}
                onChange={(e) => setGoalType(e.target.value)}
                disabled={isClosed}
              >
                <option value="RESERVE">{t('goalTypeReserve')}</option>
                <option value="BILLING_GROWTH">{t('goalTypeBilling')}</option>
                <option value="QUARTERLY_SALES">{t('goalTypeQuarterly')}</option>
                <option value="CHRISTMAS_CAMPAIGN">{t('goalTypeChristmas')}</option>
              </select>
            </div>

            {/* Render dynamic inputs based on goalType */}
            {goalType === 'RESERVE' && (
              <div className="form-group">
                <label className="form-label">{t('goalLabel')}</label>
                <input 
                  type="number"
                  step="5000"
                  className="nmn-input"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(Math.max(1000, parseInt(e.target.value) || 0))}
                  disabled={isClosed}
                />
              </div>
            )}

            {goalType === 'BILLING_GROWTH' && (
              <div className="form-group">
                <label className="form-label">{t('goalPctLabel')}</label>
                <input 
                  type="number"
                  step="5"
                  className="nmn-input"
                  value={billingGrowthPct}
                  onChange={(e) => setBillingGrowthPct(Math.max(1, parseInt(e.target.value) || 0))}
                  disabled={isClosed}
                />
              </div>
            )}

            {goalType === 'QUARTERLY_SALES' && (
              <div className="form-group">
                <label className="form-label">{t('quarterlySalesLabel')}</label>
                <input 
                  type="number"
                  step="10000"
                  className="nmn-input"
                  value={quarterlySalesAmount}
                  onChange={(e) => setQuarterlySalesAmount(Math.max(1000, parseInt(e.target.value) || 0))}
                  disabled={isClosed}
                />
              </div>
            )}

            {goalType === 'CHRISTMAS_CAMPAIGN' && (
              <div className="form-group-row">
                <div className="form-group flex-1">
                  <label className="form-label">{t('christmasSalesLabel')}</label>
                  <input 
                    type="number"
                    step="5000"
                    className="nmn-input"
                    value={christmasSalesAmount}
                    onChange={(e) => setChristmasSalesAmount(Math.max(1000, parseInt(e.target.value) || 0))}
                    disabled={isClosed}
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">{t('expenseCutLabel')}</label>
                  <input 
                    type="number"
                    step="5"
                    className="nmn-input"
                    value={expenseReductionPct}
                    onChange={(e) => setExpenseReductionPct(Math.max(0, parseInt(e.target.value) || 0))}
                    disabled={isClosed}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t('timeframeLabel')}</label>
              {goalType === 'RESERVE' && (
                <select 
                  className="nmn-select"
                  value={timeframe}
                  onChange={(e) => setTimeframe(parseInt(e.target.value))}
                  disabled={isClosed}
                >
                  <option value={6}>{t('timeframe6m')}</option>
                  <option value={12}>{t('timeframe12m')}</option>
                  <option value={24}>{t('timeframe24m')}</option>
                </select>
              )}
              {goalType === 'BILLING_GROWTH' && (
                <select 
                  className="nmn-select"
                  value={timeframe}
                  onChange={(e) => setTimeframe(parseInt(e.target.value))}
                  disabled={isClosed}
                >
                  <option value={3}>3 Meses</option>
                  <option value={6}>6 Meses</option>
                  <option value={12}>12 Meses</option>
                </select>
              )}
              {goalType === 'QUARTERLY_SALES' && (
                <select 
                  className="nmn-select"
                  value={timeframe}
                  onChange={(e) => setTimeframe(parseInt(e.target.value))}
                  disabled={isClosed}
                >
                  <option value={3}>{t('timeframeQuarter')}</option>
                  <option value={6}>{t('timeframeNextQuarter')}</option>
                </select>
              )}
              {goalType === 'CHRISTMAS_CAMPAIGN' && (
                <select 
                  className="nmn-select"
                  value={timeframe}
                  onChange={(e) => setTimeframe(parseInt(e.target.value))}
                  disabled={isClosed}
                >
                  <option value={2}>{t('timeframeCampaign')}</option>
                </select>
              )}
            </div>

            <h3 className="panel-title" style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              {t('strategiesTitle')}
            </h3>

            <div className="strategies-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              
              <div 
                className={`strategy-item glass-panel ${strategies.cutLeaks ? 'active' : ''}`}
                onClick={() => handleStrategyToggle('cutLeaks')}
                style={{ cursor: isClosed ? 'default' : 'pointer' }}
              >
                <div className="strategy-header">
                  <input 
                    type="checkbox" 
                    checked={strategies.cutLeaks}
                    onChange={() => {}}
                    disabled={isClosed}
                  />
                  <span className="strategy-name">{t('strategyLeaks')}</span>
                </div>
                <p className="strategy-desc">{t('strategyLeaksDesc')}</p>
              </div>

              <div 
                className={`strategy-item glass-panel ${strategies.increaseTicket ? 'active' : ''}`}
                onClick={() => handleStrategyToggle('increaseTicket')}
                style={{ cursor: isClosed ? 'default' : 'pointer' }}
              >
                <div className="strategy-header">
                  <input 
                    type="checkbox" 
                    checked={strategies.increaseTicket}
                    onChange={() => {}}
                    disabled={isClosed}
                  />
                  <span className="strategy-name">{t('strategyTicket')}</span>
                </div>
                <p className="strategy-desc">{t('strategyTicketDesc')}</p>
              </div>

              <div 
                className={`strategy-item glass-panel ${strategies.expandTeam ? 'active' : ''}`}
                onClick={() => handleStrategyToggle('expandTeam')}
                style={{ cursor: isClosed ? 'default' : 'pointer' }}
              >
                <div className="strategy-header">
                  <input 
                    type="checkbox" 
                    checked={strategies.expandTeam}
                    onChange={() => {}}
                    disabled={isClosed}
                  />
                  <span className="strategy-name">{t('strategySales')}</span>
                </div>
                <p className="strategy-desc">{t('strategySalesDesc')}</p>
              </div>

              <div 
                className={`strategy-item glass-panel ${strategies.optimizeMarketing ? 'active' : ''}`}
                onClick={() => handleStrategyToggle('optimizeMarketing')}
                style={{ cursor: isClosed ? 'default' : 'pointer' }}
              >
                <div className="strategy-header">
                  <input 
                    type="checkbox" 
                    checked={strategies.optimizeMarketing}
                    onChange={() => {}}
                    disabled={isClosed}
                  />
                  <span className="strategy-name">{t('strategyContracts')}</span>
                </div>
                <p className="strategy-desc">{t('strategyContractsDesc')}</p>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Outcomes and Projections */}
        <div className="tools-panel" style={{ width: '420px' }}>
          
          <div className="glass-panel projection-panel">
            <h3 className="panel-title">{t('projectionTitle')}</h3>
            
            <div className="projection-stats-row" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              
              <div className="proj-metric-card">
                <span className="proj-label">{t('targetLabel')}</span>
                <span className="proj-val text-light" style={{ fontSize: '1.25rem' }}>{targetValStr}</span>
              </div>

              <div className="proj-metric-card">
                <span className="proj-label">{t('currentMonthlyProfit')}</span>
                <span className="proj-val text-muted" style={{ fontSize: '1.25rem' }}>{currentValStr}</span>
              </div>

              <div className="proj-metric-card" style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '12px' }}>
                <span className="proj-label">{t('simulatedProgressLabel')}</span>
                <span className="proj-val text-primary" style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                  {simulatedValStr}
                </span>
              </div>
            </div>

            <div className="months-needed-box glass-panel" style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
              {goalType === 'RESERVE' ? (
                <>
                  <div className="months-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="form-label">{t('monthsToGoal')}</span>
                    <span className="proj-val text-light" style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                      {monthsSimulated} Meses
                    </span>
                  </div>
                  
                  <div className="progress-bar-container" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${Math.min(100, (timeframe / monthsSimulated) * 100)}%`,
                        background: isGoalOnTrack ? 'var(--color-success)' : 'var(--color-warning)'
                      }}
                    ></div>
                  </div>
                </>
              ) : (
                <div className="months-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="form-label">Estado de la Viabilidad</span>
                </div>
              )}
              
              <div className="projection-conclusion" style={{ marginTop: '12px', fontSize: '0.85rem' }}>
                {isGoalOnTrack ? (
                  <span className="text-success" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {t('goalOnTrack')}
                  </span>
                ) : (
                  <span className="text-warning" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    </svg>
                    {t('goalDelayed')}
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button 
                onClick={handleDownloadPdf} 
                className="nmn-btn nmn-btn-primary btn-full-width"
                style={{ background: 'var(--text-main)', color: 'var(--bg-primary)' }}
              >
                {t('exportReportPdf')}
              </button>
            </div>
          </div>

          {/* Exports and CSV lists */}
          <div className="glass-panel">
            <h3 className="panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Descargar Informes Consolidados
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => handleDownloadCsv('DAILY')} className="nmn-btn nmn-btn-secondary btn-full-width">
                {t('exportDaily')}
              </button>
              <button onClick={() => handleDownloadCsv('WEEKLY')} className="nmn-btn nmn-btn-secondary btn-full-width">
                {t('exportWeekly')}
              </button>
              <button onClick={() => handleDownloadCsv('MONTHLY')} className="nmn-btn nmn-btn-secondary btn-full-width">
                {t('exportMonthly')}
              </button>
            </div>
          </div>

          {/* Daily Closure Sequence */}
          <div className="glass-panel" style={{ border: isClosed ? '1px solid var(--color-success)' : '1px solid var(--border-color)' }}>
            <h3 className="panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Cierre de Jornada Diaria
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '12px 0 16px 0', lineHeight: '1.4' }}>
              Realizar el cierre diario congela todas las transacciones de ingresos y facturación del día para auditar el balance. Se descargará el informe consolidado.
            </p>

            {isClosed ? (
              <div 
                className="nmn-badge badge-income" 
                style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.88rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '6px' }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {t('dailyClosureDone')}
              </div>
            ) : (
              <button 
                onClick={handleDailyClosure} 
                className="nmn-btn nmn-btn-primary btn-full-width"
                style={{ background: 'var(--color-danger)', boxShadow: '0 4px 12px var(--color-danger-glow)' }}
                disabled={loadingClosure}
              >
                {loadingClosure ? t('loading') : t('dailyClosureBtn')}
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
