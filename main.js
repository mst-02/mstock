const { app, BrowserWindow, Menu, ipcMain, dialog, session } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// ===== إعداد الـ Auto Updater =====
autoUpdater.autoDownload = true;       // تحميل التحديث تلقائياً في الخلفية
autoUpdater.autoInstallOnAppQuit = false; // لا تثبت تلقائياً عند الإغلاق - انتظر قرار المستخدم

function getMainWindow() {
    const windows = BrowserWindow.getAllWindows();
    return windows.length > 0 ? windows[0] : null;
}

// إرسال إشعار للواجهة
function notifyRenderer(channel, data) {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
        win.webContents.send(channel, data);
    }
}

// أحداث الـ Auto Updater
autoUpdater.on('update-available', (info) => {
    notifyRenderer('update-status', {
        type: 'downloading',
        message: `جاري تحميل التحديث v${info.version}...`,
        version: info.version
    });
});

autoUpdater.on('download-progress', (progressObj) => {
    notifyRenderer('update-status', {
        type: 'progress',
        message: `جاري التحميل: ${Math.floor(progressObj.percent)}%`,
        percent: Math.floor(progressObj.percent),
        transferred: progressObj.transferred,
        total: progressObj.total
    });
});

autoUpdater.on('update-downloaded', async (info) => {
    // إخبار الواجهة بأن التحديث جاهز
    notifyRenderer('update-status', {
        type: 'ready',
        message: `تم تحميل التحديث v${info.version} - يمكنك التثبيت الآن`,
        version: info.version,
        releaseNotes: info.releaseNotes || ''
    });

    const win = getMainWindow();
    if (!win) {
        autoUpdater.quitAndInstall(false, true);
        return;
    }

    // إعداد ملاحظات الإصدار للعرض
    let notesText = '';
    if (info.releaseNotes) {
        notesText = typeof info.releaseNotes === 'string'
            ? info.releaseNotes.replace(/<[^>]*>/g, '').trim()
            : '';
    }

    const detailMsg = notesText
        ? `التحديثات الجديدة:\n${notesText}\n\nاختر طريقة التثبيت:`
        : 'اختر طريقة التثبيت:';

    // عرض نافذة الاختيار للمستخدم
    const { response } = await dialog.showMessageBox(win, {
        type: 'info',
        title: `تحديث جديد متاح - v${info.version}`,
        message: `🎉 تم تحميل الإصدار الجديد v${info.version}`,
        detail: detailMsg,
        buttons: [
            '🗑️ حذف البيانات القديمة والتثبيت',   // index 0
            '✅ الحفاظ على البيانات والتثبيت',      // index 1
            '⏳ لاحقاً'                               // index 2
        ],
        defaultId: 1,   // الافتراضي: الحفاظ على البيانات
        cancelId: 2,    // إلغاء = لاحقاً
        noLink: true
    });

    if (response === 2) {
        // المستخدم اختار "لاحقاً" - لا تفعل شيئاً
        notifyRenderer('update-status', {
            type: 'postponed',
            message: 'تم تأجيل التثبيت - سيتم التحديث عند الإغلاق التالي'
        });
        return;
    }

    if (response === 0) {
        // المستخدم اختار حذف البيانات - امسح localStorage قبل التثبيت
        try {
            await session.defaultSession.clearStorageData({
                storages: ['localstorage', 'indexdb', 'cookies', 'cachestorage']
            });
        } catch (e) {
            console.error('Failed to clear storage:', e);
        }
    }

    // تثبيت التحديث وإعادة التشغيل
    // isSilent=false (يظهر نافذة التثبيت), isForceRunAfter=true (يفتح البرنامج بعد التثبيت)
    autoUpdater.quitAndInstall(false, true);
});

autoUpdater.on('error', (err) => {
    notifyRenderer('update-status', {
        type: 'error',
        message: `خطأ في التحديث: ${err.message}`
    });
});

// ===== نافذة البرنامج الرئيسية =====
function createMainWindow() {
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

    mainWindow.loadFile('index.html');
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAutoHideMenuBar(true);
}

// ===== Google OAuth2 =====
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

// ===== Single Instance Lock =====
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
            if (windows[0].isMinimized()) windows[0].restore();
            windows[0].focus();
        }
    });

    app.whenReady().then(() => {
        Menu.setApplicationMenu(null);
        createMainWindow();

        // التحقق من التحديثات بعد 3 ثوانٍ من الفتح
        setTimeout(() => {
            autoUpdater.checkForUpdatesAndNotify();
        }, 3000);

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
        });
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ===== IPC Handlers =====

// البحث عن تحديثات يدوياً من الواجهة
ipcMain.handle('check-for-updates', async () => {
    try {
        const result = await autoUpdater.checkForUpdates();
        return result;
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});
