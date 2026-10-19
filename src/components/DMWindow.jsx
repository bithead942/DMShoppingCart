import React, { useState, useEffect } from 'react';
const { ipcRenderer } = window.require('electron');
import DMTopSection from './DMTopSection';
import DMBottomSection from './DMBottomSection';
import './DMWindow.css';

function DMWindow() {
  const [pricingMode, setPricingMode] = useState('Sale');
  const [locale, setLocale] = useState('Rural');
  const [discount, setDiscount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    // Send cart updates to player window
    ipcRenderer.send('cart-update', {
      items: cartItems,
      discount,
      pricingMode
    });
  }, [cartItems, discount, pricingMode]);

  const handleAddToCart = (item) => {
    setCartItems([...cartItems, item]);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
  };

  const handleUpdateItem = (updatedItem) => {
    setCartItems(cartItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setEditingItem(null);
  };

  const handleLoadCart = (items, mode, loadedDiscount) => {
    setCartItems(items);
    setPricingMode(mode);
    if (loadedDiscount !== undefined && loadedDiscount !== null) {
      console.log('Setting discount to:', loadedDiscount);
      setDiscount(loadedDiscount);
    }
  };

  return (
    <div className="dm-window">
      <DMTopSection
        pricingMode={pricingMode}
        setPricingMode={setPricingMode}
        locale={locale}
        setLocale={setLocale}
        discount={discount}
        setDiscount={setDiscount}
      />
      <DMBottomSection
        cartItems={cartItems}
        discount={discount}
        pricingMode={pricingMode}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        onClearCart={handleClearCart}
        onLoadCart={handleLoadCart}
        onAddToCart={handleAddToCart}
        editingItem={editingItem}
        onUpdateItem={handleUpdateItem}
        locale={locale}
      />
    </div>
  );
}

export default DMWindow;
