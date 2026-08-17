import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import './VideoDemo.css';

export default function VideoDemo() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('idle'); // idle -> scanning -> findings -> completed
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (isOpen && step === 'scanning') {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStep('findings');
            return 100;
          }
          return prev + 2;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isOpen, step]);

  const handleStartDemo = () => {
    setIsOpen(true);
    setStep('scanning');
    setProgress(0);
  };

  const handleCloseDemo = () => {
    setIsOpen(false);
    setStep('idle');
    setProgress(0);
  };

  return (
    <div className="video-card-container">
      {/* Video Cover */}
      <div className="video-cover" onClick={handleStartDemo}>
        <div className="video-cover-bg" style={{ backgroundImage: 'radial-gradient(circle, var(--color-primary-radial) 10%, transparent 80%)' }}></div>
        <div className="play-button-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="play-icon">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </div>
        <span className="video-cover-text">{t('playDemo')}</span>
      </div>

      {/* Interactive Simulation Modal */}
      {isOpen && createPortal(
        <div className="video-modal-overlay animate-fade" onClick={handleCloseDemo}>
          <div className="video-modal-content" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="video-modal-header">
              <span className="video-modal-title">{t('videoTitle')}</span>
              <button onClick={handleCloseDemo} className="video-close-btn" aria-label="Close demo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Video / Simulation Body */}
            <div className="video-simulation-body">
              
              {/* SCANNING STATE */}
              {step === 'scanning' && (
                <div className="simulation-scanning-hud">
                  <div className="simulation-radar">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      <path d="M2 12h20"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="finding-title" style={{ fontSize: '1.1rem' }}>Sincronizando cuentas y auditando fugas...</h4>
                    <p className="finding-desc" style={{ marginTop: '4px' }}>Analizando patrones de gasto con IA en tiempo real</p>
                  </div>
                  <div className="simulation-scan-bar">
                    <div className="simulation-scan-progress" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>{progress}% COMPLETO</span>
                </div>
              )}

              {/* FINDINGS STATE */}
              {step === 'findings' && (
                <div className="simulation-findings">
                  <h4 className="finding-title" style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '10px' }}>
                    ¡Auditoría de IA Finalizada!
                  </h4>
                  
                  <div className="simulation-finding-item animate-scale">
                    <div className="finding-icon-warning">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    </div>
                    <div>
                      <div className="finding-title">AWS Cloud Nodes: Pérdida activa</div>
                      <div className="finding-desc">Se detectó una instancia EC2 inactiva desde hace 45 días. Costo: $450/mes sin uso.</div>
                    </div>
                  </div>

                  <div className="simulation-finding-item animate-scale" style={{ animationDelay: '0.2s' }}>
                    <div className="finding-icon-warning">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                      </svg>
                    </div>
                    <div>
                      <div className="finding-title">Licencia Zoom Enterprise: Duplicada</div>
                      <div className="finding-desc">Cuentas redundantes creadas en el departamento de IT y Ventas de forma independiente.</div>
                    </div>
                  </div>

                  <div className="simulation-finding-item animate-scale" style={{ animationDelay: '0.4s' }}>
                    <div className="finding-icon-success">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div>
                      <div className="finding-title">Ahorro Anual Estimado</div>
                      <div className="finding-desc" style={{ color: 'var(--color-success)', fontWeight: '600' }}>
                        +$7,200/año aplicando las recomendaciones sugeridas.
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setStep('completed')} 
                    className="nmn-btn nmn-btn-primary"
                    style={{ alignSelf: 'center', marginTop: '16px' }}
                  >
                    Generar plan de ahorro estratégico
                  </button>
                </div>
              )}

              {/* COMPLETED STATE */}
              {step === 'completed' && (
                <div className="simulation-findings" style={{ textAlign: 'center', alignItems: 'center' }}>
                  <div className="finding-icon-success" style={{ width: '64px', height: '64px', background: 'rgba(52,199,89,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <h4 className="finding-title" style={{ fontSize: '1.25rem' }}>Plan Aplicado Exitosamente</h4>
                  <p className="finding-desc" style={{ maxWidth: '450px', marginTop: '8px', lineHeight: '1.5' }}>
                    El plan de ahorro se ha inyectado en el ERP financiero. Las suscripciones duplicadas han sido reportadas al administrador y se han configurado alertas proactivas.
                  </p>
                  <button 
                    onClick={handleCloseDemo} 
                    className="nmn-btn nmn-btn-secondary"
                    style={{ marginTop: '20px' }}
                  >
                    Salir de la demostración
                  </button>
                </div>
              )}

              {/* Simulated progress controls at bottom */}
              <div className="simulation-player-controls">
                <button className="player-btn" onClick={() => setStep(step === 'scanning' ? 'findings' : 'scanning')}>
                  {step === 'scanning' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="4" y="4" width="16" height="16"></rect>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  )}
                </button>
                <div className="player-progress-bar">
                  <div className="player-progress-fill" style={{ width: step === 'scanning' ? `${progress}%` : step === 'findings' ? '75%' : '100%' }}></div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {step === 'scanning' ? `00:${String(Math.floor(progress/10)).padStart(2, '0')}` : step === 'findings' ? '00:45' : '01:00'} / 01:00
                </span>
              </div>

            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
