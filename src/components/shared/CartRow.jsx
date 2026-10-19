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
      <div className="cart-row-unit-price">${item.unitPrice.toFixed(2)} gp</div>
      <div className="cart-row-price">${item.price.toFixed(2)} gp</div>
      
        <div className="cart-row-actions">
          <button className="edit-btn" onClick={() => onEdit(item)}><img src="img/pencil-solid.png" alt="Edit" height="20px" width="20px" /></button>
          <button className="delete-btn" onClick={() => onDelete(item.id)}><img src="img/trash-solid.png" alt="Delete" height="20px" width="20px" /></button>
        </div>
   
    </div>
  );
}

export default CartRow;
