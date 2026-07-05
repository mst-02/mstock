const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createAdminWindow() {
    const adminWindow = new BrowserWindow({
        title: 'Mstock Admin Dashboard',
        width: 900,
        height: 600,
        icon: path.join(__dirname, '../build/icon.ico'), // Reuse the main icon if needed, or point to parent build folder
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    adminWindow.loadFile('index.html');
    adminWindow.setMenuBarVisibility(false);
    adminWindow.setAutoHideMenuBar(true);
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createAdminWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
