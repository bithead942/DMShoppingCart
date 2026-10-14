const fs = require('fs');

export function importCartFromCSV(filepath) {
  try {
    const data = fs.readFileSync(filepath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return { success: false, error: 'Invalid CSV file' };
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const cartItems = [];
    let pricingMode = 'Sale';

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      // Skip summary rows
      if (values[0] === 'Subtotal' || values[0] === 'Discount' || values[0] === 'Total') {
        continue;
      }

      if (values.length === headers.length) {
        const item = {
          id: Date.now() + i,
          description: values[0],
          quantity: parseFloat(values[1]) || 1,
          unitPrice: parseFloat(values[2]) || 0,
          price: parseFloat(values[3]) || 0,
          category: values[4],
          isCustom: true
        };
        cartItems.push(item);
        
        if (values[5]) {
          pricingMode = values[5];
        }
      }
    }

    return { success: true, cartItems, pricingMode };
  } catch (error) {
    console.error('Error importing cart:', error);
    return { success: false, error: error.message };
  }
}
