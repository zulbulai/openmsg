/**
 * Window Manager for Desktop Application
 * Controls the main dashboard window and UI lifecycle
 */

const { BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1050,
    minHeight: 700,
    backgroundColor: '#090d16',
    icon: path.join(__dirname, '../../build/icon.png'),
    show: false,
    title: 'OpenMsg - WhatsApp Marketing & Automation Desktop',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload-ui.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function getMainWindow() {
  return mainWindow;
}

module.exports = {
  createMainWindow,
  getMainWindow
};
