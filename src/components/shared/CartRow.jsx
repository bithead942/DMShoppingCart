import React from 'react';
import CategoryIcon from './CategoryIcon';
import './CartRow.css';

function CartRow({ item, onEdit, onDelete, isReadOnly = false }) {
  return (
    <div className="cart-row">
      <div className="cart-row-icon">
        <CategoryIcon category={item.category} />
      </div>
      <div className="cart-row-description">{item.description}</div>
      <div className="cart-row-quantity">{item.quantity}</div>
      <div className="cart-row-unit-price">${item.unitPrice.toFixed(2)}</div>
      <div className="cart-row-price">${item.price.toFixed(2)}</div>
      {!isReadOnly && (
        <div className="cart-row-actions">
          <button onClick={() => onEdit(item)}>Edit</button>
          <button onClick={() => onDelete(item.id)}>Delete</button>
        </div>
      )}
    </div>
  );
}

export default CartRow;
