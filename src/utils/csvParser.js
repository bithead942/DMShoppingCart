const fs = require('fs');
const path = require('path');

const INVENTORY_PATH = path.join(__dirname, '../../Item Inventory List.csv');

export function parseInventoryCSV() {
  try {
    const data = fs.readFileSync(INVENTORY_PATH, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return [];
    }

    // Parse CSV handling quoted fields
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length === headers.length) {
        const item = {};
        headers.forEach((header, index) => {
          item[header] = values[index];
        });
        items.push(item);
      }
    }

    return items;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

export function filterInventory(items, filters) {
  const {
    searchTerm = '',
    magicFilter = '',
    consumableFilter = '',
    categoryFilter = [],
    locale = 'Rural'
  } = filters;

  return items.filter(item => {
    // Search term filter (partial match on Item Description)
    if (searchTerm && searchTerm.trim() !== '') {
      const itemText = (item['Item'] || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase().trim();
      if (!itemText.includes(searchLower)) {
        return false;
      }
    }

    // Magic filter
    if (magicFilter === 'Yes' && item['Magic'] !== 'Yes') {
      return false;
    }
    if (magicFilter === 'No' && item['Magic'] === 'Yes') {
      return false;
    }

    // Consumable filter
    if (consumableFilter === 'Yes' && item['Consumable'] !== 'Yes') {
      return false;
    }
    if (consumableFilter === 'No' && item['Consumable'] === 'Yes') {
      return false;
    }

    // Category filter
    if (categoryFilter.length > 0 && !categoryFilter.includes(item['Category'])) {
      return false;
    }

    // Locale filter
    const localeColumn = locale === 'Rural' ? 'Rural Locale' :
                        locale === 'Urban' ? 'Urban Locale' :
                        'Premium Locale';
    
    if (item[localeColumn] !== 'X') {
      return false;
    }

    return true;
  });
}

export function getCategories(items) {
  const categories = new Set();
  items.forEach(item => {
    if (item['Category']) {
      categories.add(item['Category']);
    }
  });
  return Array.from(categories).sort();
}
