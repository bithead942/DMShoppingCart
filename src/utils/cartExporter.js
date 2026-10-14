const fs = require('fs');
const path = require('path');

export function exportCartToCSV(cartItems, discount, pricingMode) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `DMShoppingCart_${timestamp}.csv`;
  const filepath = path.join(__dirname, '../../', filename);

  let csvContent = 'Item,Quantity,Unit Price,Price,Category,Pricing Mode\n';

  cartItems.forEach(item => {
    const line = [
      item.description,
      item.quantity,
      item.unitPrice,
      item.price,
      item.category,
      pricingMode
    ].join(',');
    csvContent += line + '\n';
  });

  // Add summary rows
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  csvContent += `\nSubtotal,,${subtotal}\n`;
  csvContent += `Discount (${discount}%),,-${discountAmount}\n`;
  csvContent += `Total,,${total}\n`;

  try {
    fs.writeFileSync(filepath, csvContent, 'utf8');
    return { success: true, filepath };
  } catch (error) {
    console.error('Error exporting cart:', error);
    return { success: false, error: error.message };
  }
}
