import React, { createContext, useState, useContext, useEffect } from 'react';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('nmn_currency') || 'USD';
  });

  const [symbol, setSymbol] = useState('$');

  useEffect(() => {
    switch (currency) {
      case 'USD': setSymbol('$'); break;
      case 'EUR': setSymbol('€'); break;
      case 'GBP': setSymbol('£'); break;
      case 'JPY': setSymbol('¥'); break;
      default: setSymbol('$'); break;
    }
    localStorage.setItem('nmn_currency', currency);
  }, [currency]);

  // Función de ayuda para formatear números con la moneda seleccionada
  const formatCurrency = (amount) => {
    const val = parseFloat(amount) || 0;
    
    // Configurar locale y opciones según moneda
    let locale = 'en-US';
    let options = { style: 'currency', currency: currency, minimumFractionDigits: 2 };
    
    if (currency === 'EUR') locale = 'es-ES';
    if (currency === 'GBP') locale = 'en-GB';
    if (currency === 'JPY') {
      locale = 'ja-JP';
      options.minimumFractionDigits = 0; // El Yen no suele llevar decimales
    }
    
    return new Intl.NumberFormat(locale, options).format(val);
  };

  // Función más sencilla si solo queremos el símbolo y formatear el número nosotros
  const formatNumber = (amount) => {
    const val = parseFloat(amount) || 0;
    const decimals = currency === 'JPY' ? 0 : 2;
    return val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol, formatCurrency, formatNumber }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
