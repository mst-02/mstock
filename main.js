const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

function createMainWindow() {
    // إنشاء نافذة البرنامج بمقاس مناسب لشاشات الكاشير
    const mainWindow = new BrowserWindow({
        title: 'Mstock POS',
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'Screenshot 2026-07-02 042824.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // هنا بنقول للنافذة تفتح ملف الـ HTML اللي هنصمم فيه الواجهة
    mainWindow.loadFile('index.html');
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAutoHideMenuBar(true);
    
    // سطر اختياري: بيفتح أدوات المطور (DevTools) عشان لو في أخطاء نصلحها زي المتصفح
    // mainWindow.webContents.openDevTools();
}

// Google OAuth2 - فتح نافذة تسجيل دخول جوجل
ipcMain.handle('open-google-auth', async (event, authUrl) => {
    return new Promise((resolve, reject) => {
        const authWindow = new BrowserWindow({
            width: 500,
            height: 700,
            title: 'تسجيل دخول Google - Mstock POS',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });
        authWindow.setMenuBarVisibility(false);
        authWindow.loadURL(authUrl);

        // مراقبة تغيير الـ URL لالتقاط كود التفعيل
        authWindow.webContents.on('will-redirect', (event, url) => {
            handleAuthCallback(url, authWindow, resolve);
        });
        authWindow.webContents.on('will-navigate', (event, url) => {
            handleAuthCallback(url, authWindow, resolve);
        });

        authWindow.on('closed', () => {
            resolve({ error: 'cancelled' });
        });

        function handleAuthCallback(url, win, res) {
            try {
                const urlObj = new URL(url);
                if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                    const code = urlObj.searchParams.get('code');
                    const error = urlObj.searchParams.get('error');
                    if (code) {
                        res({ code });
                    } else {
                        res({ error: error || 'no_code' });
                    }
                    setTimeout(() => { if (!win.isDestroyed()) win.close(); }, 100);
                }
            } catch(e) { /* not a valid URL yet */ }
        }
    });
});

// تشغيل النافذة أول ما الـ Electron يجهز
app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

// قفل البرنامج تماماً لما تقفل النافذة
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});