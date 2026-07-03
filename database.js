const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// دالة أساسية لفتح قاعدة البيانات وإنشاء الجداول
async function initDatabase() {
    // فتح ملف قاعدة البيانات (لو مش موجود هيتم إنشاؤه تلقائياً باسم mstock.db)
    const db = await open({
        filename: './mstock.db',
        driver: sqlite3.Database
    });

    console.log('--- Mstock POS System ---');
    console.log('تم الاتصال بقاعدة البيانات بنجاح (Offline Mode)...');

    // 1. إنشاء جدول المخزن والبضاعة
    await db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            quantity INTEGER DEFAULT 0,
            buy_price REAL DEFAULT 0.0,
            sell_price REAL DEFAULT 0.0
        );
    `);

    // 2. إنشاء جدول التجار
    await db.exec(`
        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            total_debt REAL DEFAULT 0.0
        );
    `);

    // 3. إنشاء جدول تحصيل مديونيات التجار
    await db.exec(`
        CREATE TABLE IF NOT EXISTS supplier_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_id INTEGER,
            paid_amount REAL DEFAULT 0.0,
            transaction_date TEXT,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        );
    `);

    console.log('تم إنشاء الجداول الأساسية بنجاح بنظام Mstock!');
    return db;
}

// تشغيل الدالة للتجربة وفحص الأخطاء
initDatabase().catch(err => {
    console.error('حدث خطأ أثناء تهيئة قاعدة البيانات:', err);
});