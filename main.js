const { app, BrowserWindow } = require('electron');
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
    
    // سطر اختياري: بيفتح أدوات المطور (DevTools) عشان لو في أخطاء نصلحها زي المتصفح
    // mainWindow.webContents.openDevTools();
}

// تشغيل النافذة أول ما الـ Electron يجهز
app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

// قفل البرنامج تماماً لما تقفل النافذة
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});