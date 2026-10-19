import React, { useState, useEffect } from 'react';
const { ipcRenderer, dialog } = window.require('electron');
import { filterInventory, getCategories } from '../utils/csvParser';
import CartRow from './shared/CartRow';
import './DMBottomSection.css';

function DMBottomSection({
  cartItems,
  discount,
  pricingMode,
  onEditItem,
  onDeleteItem,
  onClearCart,
  onLoadCart,
  onAddToCart,
  editingItem,
  onUpdateItem,
  locale
}) {
  // DMMiddleSection state
  const [searchTerm, setSearchTerm] = useState('');
  const [magicFilter, setMagicFilter] = useState('');
  const [consumableFilter, setConsumableFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [priceOverride, setPriceOverride] = useState('');
  const [categoryValue, setCategoryValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // DMBottomSection calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  // DMMiddleSection useEffect hooks
  useEffect(() => {
    // Request inventory data from main process
    ipcRenderer.send('get-inventory');

    // Listen for inventory data response
    const handleInventoryData = (event, items) => {
      setInventory(items);
      const cats = getCategories(items);
      setCategories(cats);
      setFilteredItems([]);
    };

    ipcRenderer.on('inventory-data', handleInventoryData);

    // Cleanup listener
    return () => {
      ipcRenderer.removeListener('inventory-data', handleInventoryData);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoryDropdown && !event.target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false);
      }
      if (showItemDropdown && !event.target.closest('.item-dropdown')) {
        setShowItemDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown, showItemDropdown]);

  useEffect(() => {
    // Only apply search term filter if 3 or more characters are typed
    const effectiveSearchTerm = searchTerm.length >= 3 ? searchTerm : '';
    const filtered = filterInventory(inventory, {
      searchTerm: effectiveSearchTerm,
      magicFilter,
      consumableFilter,
      categoryFilter,
      locale
    });
    setFilteredItems(filtered);
  }, [searchTerm, magicFilter, consumableFilter, categoryFilter, locale, inventory]);

  useEffect(() => {
    if (editingItem) {
      setQuantity(editingItem.quantity);
      setPriceOverride(editingItem.unitPrice.toString());
      setCategoryValue(editingItem.category || '');
      setDescriptionValue('');
      setSelectedItem(null);
    }
  }, [editingItem]);

  // DMMiddleSection functions
  const handleCategoryToggle = (category) => {
    if (categoryFilter.includes(category)) {
      setCategoryFilter(categoryFilter.filter(c => c !== category));
    } else {
      setCategoryFilter([...categoryFilter, category]);
    }
  };

  const getCategoryDisplayText = () => {
    if (categoryFilter.length === 0) return 'All Categories';
    if (categoryFilter.length === 1) return categoryFilter[0];
    return `${categoryFilter.length} categories selected`;
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    const priceColumn = pricingMode === 'Sale' ? 'Retail Price' : 'Resale Price';
    setPriceOverride(item[priceColumn] || '');
    setQuantity(1);
    setCategoryValue(item['Category'] || '');
    setDescriptionValue(item['Description'] || '');
    setSearchTerm(item['Item'] || '');
    setShowItemDropdown(false);
  };

  const handleAddToCart = () => {
    // Validate all fields have values (description is optional as it's read-only)
    if (!categoryValue || !searchTerm || !quantity || !priceOverride) {
      return;
    }

    const finalPrice = parseFloat(priceOverride);
    const description = searchTerm;
    const itemDescription = descriptionValue || '';
    const qty = parseInt(quantity);

    const cartItem = {
      id: editingItem ? editingItem.id : Date.now(),
      description: description,
      itemDescription: itemDescription,
      quantity: qty,
      unitPrice: finalPrice,
      price: finalPrice * qty,
      category: categoryValue,
      isCustom: !selectedItem
    };

    if (editingItem) {
      onUpdateItem(cartItem);
    } else {
      onAddToCart(cartItem);
    }

    // Reset form
    setSelectedItem(null);
    setQuantity(1);
    setPriceOverride('');
    setCategoryValue('');
    setDescriptionValue('');
    setSearchTerm('');
  };

  const handleSaveCart = () => {
    console.log('Save cart button clicked');
    ipcRenderer.send('show-save-dialog', {
      title: 'Save Cart',
      defaultPath: 'C:\\Users\\gregs\\OneDrive\\Documents\\D&D\\DMShoppingCart\\',
      filters: [
        { name: 'CSV Files', extensions: ['csv'] }
      ]
    });
  };

  const handleLoadCart = () => {
    console.log('Load cart button clicked');
    ipcRenderer.send('show-open-dialog', {
      properties: ['openFile'],
      defaultPath: 'C:\\Users\\gregs\\OneDrive\\Documents\\D&D\\DMShoppingCart\\',
      filters: [
        { name: 'CSV Files', extensions: ['csv'] }
      ]
    });
  };

  // Listen for load cart response
  useEffect(() => {
    const handleLoadCartPath = (event, filePath) => {
      // Send load request with the file path
      ipcRenderer.send('load-cart', filePath);
    };

    const handleSaveCartPath = (event, filePath) => {
      // Send save request with cart data and file path
      ipcRenderer.send('save-cart', {
        cartItems,
        discount,
        pricingMode,
        filePath
      });
    };

    const handleLoadCartResponse = (event, result) => {
      if (result.success) {
        onLoadCart(result.cartItems, result.pricingMode);
        dialog.showMessageBox({
          type: 'info',
          title: 'Cart Loaded',
          message: 'Cart loaded successfully'
        });
      } else {
        dialog.showMessageBox({
          type: 'error',
          title: 'Error',
          message: `Failed to load cart: ${result.error}`
        });
      }
    };

    const handleSaveCartResponse = (event, result) => {
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

    ipcRenderer.on('save-cart-path', handleSaveCartPath);
    ipcRenderer.on('load-cart-path', handleLoadCartPath);
    ipcRenderer.on('cart-loaded', handleLoadCartResponse);
    ipcRenderer.on('cart-saved', handleSaveCartResponse);

    return () => {
      ipcRenderer.removeListener('save-cart-path', handleSaveCartPath);
      ipcRenderer.removeListener('load-cart-path', handleLoadCartPath);
      ipcRenderer.removeListener('cart-loaded', handleLoadCartResponse);
      ipcRenderer.removeListener('cart-saved', handleSaveCartResponse);
    };
  }, [onLoadCart, cartItems, discount, pricingMode]);

  return (
    <div className="dm-bottom-section">
      {/* DMMiddleSection content */}
        <div className="dm-middle-top">
          <div className="filter-row">
            <label>Magic:</label>
            <select value={magicFilter} onChange={(e) => setMagicFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="filter-row">
            <label>Consumable:</label>
            <select value={consumableFilter} onChange={(e) => setConsumableFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="filter-row">
            <label>Categories:</label>
            <div className="category-dropdown">
              <button
                className="dropdown-toggle"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                {getCategoryDisplayText()}
                <span className="dropdown-arrow">▼</span>
              </button>
              {showCategoryDropdown && (
                <div className="dropdown-menu">
                  {categories.map(cat => (
                    <label key={cat} className="dropdown-item">
                      <input
                        type="checkbox"
                        checked={categoryFilter.includes(cat)}
                        onChange={() => handleCategoryToggle(cat)}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

          <div className="item-actions">
            <div className="action-row-single">
              <div className="category-input">
                <label>Category:</label>
                <input
                  type="text"
                  readOnly
                  placeholder=""
                  value={categoryValue}
                />
              </div>
              <div className="selected-item-display">
                <label>Item:</label>
                <div className="item-dropdown">
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (e.target.value.length >= 3) {
                        setShowItemDropdown(true);
                      } else {
                        setShowItemDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      if (searchTerm.length >= 3) {
                        setShowItemDropdown(true);
                      }
                    }}
                  />
                  {showItemDropdown && searchTerm.length >= 3 && (
                    <div className="item-dropdown-menu">
                      {filteredItems.slice(0, 20).map((item, index) => (
                        <div
                          key={index}
                          className="item-dropdown-item"
                          onClick={() => handleSelectItem(item)}
                        >
                          <span>{item['Item']}</span>
                        </div>
                      ))}
                      {filteredItems.length === 0 && (
                        <div className="item-dropdown-item no-results">
                          No items found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="quantity-input">
                <label>Qty:</label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="price-input">
                <label>Price:</label>
                <input
                  type="number"
                  step="1.00"
                  placeholder=""
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                />
                <span className="gp-label">gp</span>
              </div>
            </div>

            <div className="description-row">
              <div className="description-input">
                <label>Description:</label>
                <input
                  type="text"
                  readOnly
                  value={descriptionValue}
                  placeholder=""
                />
              </div>
              <button
                className="add-to-cart-btn-small"
                onClick={handleAddToCart}
                disabled={!categoryValue || !searchTerm || !quantity || !priceOverride}
              >
                {editingItem ? 'Update' : 'Add'}
              </button>
            </div>
          </div>

      {/* DMBottomSection content */}
      <div className="dm-cart-header">
        <h2>Shopping Cart</h2>
      </div>

      <div className="dm-cart-table-header">
        <div className="cart-row-icon"></div>
        <div className="cart-row-description">Item</div>
        <div className="cart-row-quantity">Qty</div>
        <div className="cart-row-unit-price">Unit Price</div>
        <div className="cart-row-price">Price</div>
        <div className="cart-row-actions"></div>
      </div>

      <div className="dm-cart-items">
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

<div className="cart-footer">
      <div className="cart-actions-bottom">
        <button onClick={handleSaveCart} disabled={cartItems.length === 0}>Save Cart</button>
        <button onClick={handleLoadCart}>Load Cart</button>
        <button onClick={onClearCart} disabled={cartItems.length === 0}>Clear Cart</button>
      </div>
      
      <div className="dm-cart-summary">
        {discount > 0 && (
          <div className="dm-summary-row">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)} gp</span>
          </div>
        )}
        {discount > 0 && (
          <div className="dm-summary-row discount">
            <span>Discount ({discount}%):</span>
            <span>-${discountAmount.toFixed(2)} gp</span>
          </div>
        )}
        <div className="dm-summary-row total">
          <span>Total:</span>
          <span>${total.toFixed(2)} gp</span>
        </div>
      </div>
    </div>
  </div>
  );
}

export default DMBottomSection;
