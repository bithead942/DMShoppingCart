import React from 'react';
const { ipcRenderer, dialog } = window.require('electron');
import { exportCartToCSV } from '../utils/cartExporter';
import { importCartFromCSV } from '../utils/cartImporter';
import CartRow from './shared/CartRow';
import './DMBottomSection.css';

function DMBottomSection({
  cartItems,
  discount,
  pricingMode,
  onEditItem,
  onDeleteItem,
  onClearCart,
  onLoadCart
}) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  const handleSaveCart = () => {
    const result = exportCartToCSV(cartItems, discount, pricingMode);
    if (result.success) {
      dialog.showMessageBox({
        type: 'info',
        title: 'Cart Saved',
        message: `Cart saved to: ${result.filepath}`
      });
    } else {
      dialog.showMessageBox({
        type: 'error',
        title: 'Error',
        message: `Failed to save cart: ${result.error}`
      });
    }
  };

  const handleLoadCart = () => {
    dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'CSV Files', extensions: ['csv'] }
      ]
    }).then(result => {
      if (!result.canceled && result.filePaths.length > 0) {
        const importResult = importCartFromCSV(result.filePaths[0]);
        if (importResult.success) {
          onLoadCart(importResult.cartItems, importResult.pricingMode);
          dialog.showMessageBox({
            type: 'info',
            title: 'Cart Loaded',
            message: 'Cart loaded successfully'
          });
        } else {
          dialog.showMessageBox({
            type: 'error',
            title: 'Error',
            message: `Failed to load cart: ${importResult.error}`
          });
        }
      }
    });
  };

  return (
    <div className="dm-bottom-section">
      <div className="cart-header">
        <h3>Shopping Cart</h3>
        <div className="cart-actions">
          <button onClick={handleSaveCart}>Save Cart</button>
          <button onClick={handleLoadCart}>Load Cart</button>
          <button onClick={onClearCart}>Clear Cart</button>
        </div>
      </div>

      <div className="cart-table-header">
        <div className="cart-row-icon">Icon</div>
        <div className="cart-row-description">Item</div>
        <div className="cart-row-quantity">Qty</div>
        <div className="cart-row-unit-price">Unit Price</div>
        <div className="cart-row-price">Price</div>
        <div className="cart-row-actions">Actions</div>
      </div>

      <div className="cart-items">
        {cartItems.length === 0 ? (
          <div className="empty-cart">Cart is empty</div>
        ) : (
          cartItems.map(item => (
            <CartRow
              key={item.id}
              item={item}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              isReadOnly={false}
            />
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
  );
}

export default DMBottomSection;
