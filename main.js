const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let dmWindow;
let playerWindow;
let inventoryData = [];

function parseInventoryCSV() {
  try {
    // In development, use the CSV from the project root
    // In production, use the CSV from the app directory
    let csvPath;
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
      csvPath = path.join(path.dirname(__dirname), 'Item Inventory List.csv');
    } else {
      csvPath = path.join(path.dirname(app.getAppPath()), 'Item Inventory List.csv');
    }
    
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found at:', csvPath);
      return [];
    }
    
    const data = fs.readFileSync(csvPath, 'utf8');
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

    console.log('Parsed', items.length, 'items from CSV');
    return items;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

function createDMWindow() {
  // Determine icon path
  let iconPath;
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    iconPath = path.join(__dirname, 'Logo.ico');
  } else {
    iconPath = path.join(process.resourcesPath, 'Logo.ico');
  }

  dmWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'DM Shopping Cart',
  });

  // In development, load from project root
  // In production, load from the app's resources
  let indexPath;
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    indexPath = path.join(__dirname, 'index.html');
  } else {
    indexPath = path.join(__dirname, 'index.html');
  }
  
  dmWindow.loadFile(indexPath);

  dmWindow.once('ready-to-show', () => {
    dmWindow.focus();
  });

  dmWindow.on('closed', () => {
    dmWindow = null;
    if (playerWindow) {
      playerWindow.close();
    }
  });
}

function createPlayerWindow() {
  // Determine icon path
  let iconPath;
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    iconPath = path.join(__dirname, 'Logo.ico');
  } else {
    iconPath = path.join(process.resourcesPath, 'Logo.ico');
  }

  playerWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'Player View',
  });

  playerWindow.maximize();
  
  // In development, load from project root
  // In production, load from the app's resources
  let indexPath;
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    indexPath = path.join(__dirname, 'player.html');
  } else {
    indexPath = path.join(__dirname, 'player.html');
  }
  
  playerWindow.loadFile(indexPath);

  // Auto-maximize after move/drag
  playerWindow.on('move', () => {
    setTimeout(() => {
      if (playerWindow && !playerWindow.isMaximized()) {
        playerWindow.maximize();
      }
    }, 100);
  });

  playerWindow.on('closed', () => {
    playerWindow = null;
    if (dmWindow) {
      dmWindow.close();
    }
  });
}

app.whenReady().then(() => {
  // Load inventory data into memory
  inventoryData = parseInventoryCSV();
  console.log('Inventory loaded into memory:', inventoryData.length, 'items');

  createDMWindow();
  createPlayerWindow();

  // Bring DM window to front
  if (dmWindow) {
    dmWindow.focus();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createDMWindow();
      createPlayerWindow();
    } else if (dmWindow) {
      dmWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC for sharing cart state between windows
ipcMain.on('cart-update', (event, cartData) => {
  if (playerWindow) {
    playerWindow.webContents.send('cart-update', cartData);
  }
});

ipcMain.on('get-cart-state', (event) => {
  if (dmWindow) {
    dmWindow.webContents.send('request-cart-state');
  }
});

// IPC for closing the app
ipcMain.on('close-app', () => {
  if (playerWindow) {
    playerWindow.close();
  }
  if (dmWindow) {
    dmWindow.close();
  }
  app.quit();
});

// IPC for getting inventory data
ipcMain.on('get-inventory', (event) => {
  event.reply('inventory-data', inventoryData);
});

// IPC for saving cart
ipcMain.on('save-cart', (event, data) => {
  const { cartItems, discount, pricingMode, filePath } = data;
  const fs = require('fs');

  try {
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

    fs.writeFileSync(filePath, csvContent, 'utf8');
    event.reply('cart-saved', { success: true, filepath: filePath });
  } catch (error) {
    console.error('Error saving cart:', error);
    event.reply('cart-saved', { success: false, error: error.message });
  }
});

// IPC for loading cart
ipcMain.on('load-cart', (event, filePath) => {
  const fs = require('fs');

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      event.reply('cart-loaded', { success: false, error: 'Invalid CSV file' });
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const cartItems = [];
    let pricingMode = 'Sale';
    let discount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());

      // Parse discount from Discount summary row
      if (values[0].startsWith('Discount')) {
        const discountMatch = values[0].match(/\((\d+)%\)/);
        if (discountMatch) {
          discount = parseFloat(discountMatch[1]);
          console.log('Loaded discount:', discount);
        }
        continue;
      }

      // Skip other summary rows
      if (values[0] === 'Subtotal' || values[0] === 'Total') {
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

    event.reply('cart-loaded', { success: true, cartItems, pricingMode, discount });
  } catch (error) {
    console.error('Error loading cart:', error);
    event.reply('cart-loaded', { success: false, error: error.message });
  }
});

// IPC for showing save dialog
ipcMain.on('show-save-dialog', (event, options) => {
  const { dialog } = require('electron');

  // Generate timestamped filename
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timestamp = `${year}${month}${day}-${hours}${minutes}`;
  const defaultPath = `DMShoppingCart_${timestamp}.csv`;
  const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();


  dialog.showSaveDialog(win,{
    ...options,
    defaultPath
  }).then(result => {
    if (!result.canceled && result.filePath) {
      // Send save request with the selected path
      event.sender.send('save-cart-path', result.filePath);
    }
  });
});

// IPC for showing open dialog
ipcMain.on('show-open-dialog', (event, options) => {
  const { dialog } = require('electron');
  const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();

  dialog.showOpenDialog(win, options).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      // Send load request with the selected path
      event.sender.send('load-cart-path', result.filePaths[0]);
    }
  });
});
