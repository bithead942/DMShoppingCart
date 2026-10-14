import React, { useState, useEffect } from 'react';
const { ipcRenderer } = window.require('electron');
import CategoryIcon from './shared/CategoryIcon';
import './PlayerWindow.css';

function PlayerWindow() {
  const [cartData, setCartData] = useState({
    items: [],
    discount: 0,
    pricingMode: 'Sale'
  });

  useEffect(() => {
    // Listen for cart updates from DM window
    ipcRenderer.on('cart-update', (event, data) => {
      setCartData(data);
    });

    return () => {
      ipcRenderer.removeAllListeners('cart-update');
    };
  }, []);

  const { items, discount, pricingMode } = cartData;
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  return (
    <div className="player-window">
      <div className="cart-container">
        <div className="cart-table-header">
          <div className="cart-row-icon">Icon</div>
          <div className="cart-row-description">Item</div>
          <div className="cart-row-quantity">Qty</div>
          <div className="cart-row-unit-price">Unit Price</div>
          <div className="cart-row-price">Price</div>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-cart">Cart is empty</div>
          ) : (
            items.map(item => (
              <div key={item.id} className="cart-row">
                <div className="cart-row-icon">
                  <CategoryIcon category={item.category} />
                </div>
                <div className="cart-row-description">{item.description}</div>
                <div className="cart-row-quantity">{item.quantity}</div>
                <div className="cart-row-unit-price">${item.unitPrice.toFixed(2)}</div>
                <div className="cart-row-price">${item.price.toFixed(2)}</div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="summary-row discount">
              <span>Discount ({discount}%):</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerWindow;
