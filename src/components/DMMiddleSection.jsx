import React, { useState, useEffect } from 'react';
import { parseInventoryCSV, filterInventory, getCategories } from '../utils/csvParser';
import CategoryIcon from './shared/CategoryIcon';
import './DMMiddleSection.css';

function DMMiddleSection({
  pricingMode,
  locale,
  onAddToCart,
  editingItem,
  onUpdateItem
}) {
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
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customItem, setCustomItem] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0,
    category: ''
  });

  useEffect(() => {
    const items = parseInventoryCSV();
    setInventory(items);
    const cats = getCategories(items);
    setCategories(cats);
    setFilteredItems(items);
  }, []);

  useEffect(() => {
    const filtered = filterInventory(inventory, {
      searchTerm,
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
      setSelectedItem(null);
    }
  }, [editingItem]);

  const handleCategoryToggle = (category) => {
    if (categoryFilter.includes(category)) {
      setCategoryFilter(categoryFilter.filter(c => c !== category));
    } else {
      setCategoryFilter([...categoryFilter, category]);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    const priceColumn = pricingMode === 'Sale' ? 'Retail Price' : 'Resale Price';
    setPriceOverride(item[priceColumn] || '');
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (selectedItem || editingItem) {
      const item = selectedItem || editingItem;
      const finalPrice = priceOverride ? parseFloat(priceOverride) : 
        (pricingMode === 'Sale' ? parseFloat(item['Retail Price']) : parseFloat(item['Resale Price']));
      
      const cartItem = {
        id: editingItem ? editingItem.id : Date.now(),
        description: item['Item'] || item.description,
        quantity: quantity,
        unitPrice: finalPrice,
        price: finalPrice * quantity,
        category: item['Category'] || item.category,
        isCustom: editingItem ? editingItem.isCustom : false
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
    }
  };

  const handleAddCustomItem = () => {
    const cartItem = {
      id: Date.now(),
      description: customItem.description,
      quantity: customItem.quantity,
      unitPrice: customItem.unitPrice,
      price: customItem.unitPrice * customItem.quantity,
      category: customItem.category,
      isCustom: true
    };

    onAddToCart(cartItem);
    setShowCustomItem(false);
    setCustomItem({
      description: '',
      quantity: 1,
      unitPrice: 0,
      category: ''
    });
  };

  const getPrice = () => {
    if (priceOverride) {
      return parseFloat(priceOverride);
    }
    if (selectedItem) {
      const priceColumn = pricingMode === 'Sale' ? 'Retail Price' : 'Resale Price';
      return parseFloat(selectedItem[priceColumn]) || 0;
    }
    return 0;
  };

  return (
    <div className="dm-middle-section">
      <div className="dm-middle-left">
        <h3>Search & Filter</h3>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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
          <div className="category-checkboxes">
            {categories.map(cat => (
              <label key={cat} className="category-checkbox">
                <input
                  type="checkbox"
                  checked={categoryFilter.includes(cat)}
                  onChange={() => handleCategoryToggle(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div className="item-list">
          {filteredItems.map((item, index) => (
            <div
              key={index}
              className={`item-list-item ${selectedItem === item ? 'selected' : ''}`}
              onClick={() => handleSelectItem(item)}
            >
              <CategoryIcon category={item['Category']} />
              <span>{item['Item']}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dm-middle-right">
        <h3>Item Details</h3>
        
        {selectedItem ? (
          <div className="item-details">
            <div className="detail-row">
              <strong>Item:</strong> {selectedItem['Item']}
            </div>
            <div className="detail-row">
              <strong>Category:</strong> {selectedItem['Category']}
            </div>
            <div className="detail-row">
              <strong>Price ({pricingMode}):</strong> ${getPrice().toFixed(2)}
            </div>
            {selectedItem['Description'] && (
              <div className="detail-row">
                <strong>Notes:</strong> {selectedItem['Description']}
              </div>
            )}
            <div className="detail-row">
              <strong>Magic:</strong> {selectedItem['Magic'] || 'No'}
            </div>
            <div className="detail-row">
              <strong>Consumable:</strong> {selectedItem['Consumable'] || 'No'}
            </div>
          </div>
        ) : editingItem ? (
          <div className="item-details">
            <div className="detail-row">
              <strong>Editing:</strong> {editingItem.description}
            </div>
          </div>
        ) : (
          <div className="item-details">
            <p>Select an item to view details</p>
          </div>
        )}

        <div className="item-actions">
          <div className="action-row">
            <label>Quantity:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="action-row">
            <label>Price Override:</label>
            <input
              type="number"
              step="0.01"
              placeholder="Optional"
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
            />
          </div>

          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={!selectedItem && !editingItem}
          >
            {editingItem ? 'Update Item' : 'Add to Cart'}
          </button>

          <button
            className="custom-item-btn"
            onClick={() => setShowCustomItem(true)}
          >
            Create Custom Item
          </button>
        </div>
      </div>

      {showCustomItem && (
        <div className="custom-item-modal">
          <div className="modal-content">
            <h3>Create Custom Item</h3>
            <div className="form-row">
              <label>Description:</label>
              <input
                type="text"
                value={customItem.description}
                onChange={(e) => setCustomItem({...customItem, description: e.target.value})}
              />
            </div>
            <div className="form-row">
              <label>Quantity:</label>
              <input
                type="number"
                min="1"
                value={customItem.quantity}
                onChange={(e) => setCustomItem({...customItem, quantity: parseInt(e.target.value) || 1})}
              />
            </div>
            <div className="form-row">
              <label>Unit Price:</label>
              <input
                type="number"
                step="0.01"
                value={customItem.unitPrice}
                onChange={(e) => setCustomItem({...customItem, unitPrice: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="form-row">
              <label>Category:</label>
              <select
                value={customItem.category}
                onChange={(e) => setCustomItem({...customItem, category: e.target.value})}
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="modal-buttons">
              <button onClick={handleAddCustomItem}>Add to Cart</button>
              <button onClick={() => setShowCustomItem(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DMMiddleSection;
