const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let dmWindow;
let playerWindow;

function createDMWindow() {
  dmWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'DM Shopping Cart',
  });

  dmWindow.loadFile('index.html');

  dmWindow.on('closed', () => {
    dmWindow = null;
    if (playerWindow) {
      playerWindow.close();
    }
  });
}

function createPlayerWindow() {
  playerWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'Player View',
    fullscreen: true,
  });

  playerWindow.loadFile('player.html');

  playerWindow.on('closed', () => {
    playerWindow = null;
    if (dmWindow) {
      dmWindow.close();
    }
  });
}

app.whenReady().then(() => {
  createDMWindow();
  createPlayerWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createDMWindow();
      createPlayerWindow();
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
