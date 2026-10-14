import React from 'react';
const { remote } = window.require('electron');
import './DMTopSection.css';

function DMTopSection({ pricingMode, setPricingMode, locale, setLocale, discount, setDiscount }) {
  const handleClose = () => {
    const { BrowserWindow } = remote;
    const window = BrowserWindow.getFocusedWindow();
    window.close();
  };

  return (
    <div className="dm-top-section">
      <div className="dm-top-option">
        <label>Pricing Mode:</label>
        <select value={pricingMode} onChange={(e) => setPricingMode(e.target.value)}>
          <option value="Sale">Sale (Selling to Player)</option>
          <option value="Resale">Resale (Buying from Player)</option>
        </select>
      </div>

      <div className="dm-top-option">
        <label>Locale:</label>
        <select value={locale} onChange={(e) => setLocale(e.target.value)}>
          <option value="Rural">Rural</option>
          <option value="Urban">Urban</option>
          <option value="Premium">Premium</option>
        </select>
      </div>

      <div className="dm-top-option">
        <label>Discount:</label>
        <select value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value))}>
          <option value="0">0%</option>
          <option value="5">5%</option>
          <option value="10">10%</option>
          <option value="15">15%</option>
          <option value="25">25%</option>
          <option value="50">50%</option>
        </select>
      </div>

      <button className="close-button" onClick={handleClose}>✕</button>
    </div>
  );
}

export default DMTopSection;
