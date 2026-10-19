export function filterInventory(items, filters) {
  const {
    searchTerm = '',
    magicFilter = '',
    consumableFilter = '',
    categoryFilter = [],
    locale = 'Rural'
  } = filters;

  console.log('Filtering with:', { searchTerm, magicFilter, consumableFilter, categoryFilter, locale });

  const filtered = items.filter(item => {
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

  console.log('Filtered to', filtered.length, 'items');
  return filtered;
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
