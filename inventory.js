const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// دالة مساعدة للاتصال بقاعدة البيانات
async function getDB() {
    return await open({
        filename: './mstock.db',
        driver: sqlite3.Database
    });
}

// 1. دالة إضافة منتج جديد أو زيادة كمية منتج موجود
async function addProduct(name, quantity, buyPrice, sellPrice) {
    const db = await getDB();
    
    // الفحص أولاً لو المنتج موجود بنفس الاسم عشان نزود الكمية بس
    const existingProduct = await db.get('SELECT * FROM products WHERE name = ?', [name]);
    
    if (existingProduct) {
        const newQuantity = existingProduct.quantity + quantity;
        await db.run('UPDATE products SET quantity = ?, buy_price = ?, sell_price = ? WHERE id = ?', 
            [newQuantity, buyPrice, sellPrice, existingProduct.id]);
        console.log(`🔄 تم تحديث المنتج [${name}] وزيادة الكمية إلى: ${newQuantity}`);
    } else {
        await db.run('INSERT INTO products (name, quantity, buy_price, sell_price) VALUES (?, ?, ?, ?)', 
            [name, quantity, buyPrice, sellPrice]);
        console.log(`✅ تم إضافة منتج جديد بنجاح: [${name}]`);
    }
}

// 2. دالة سحب البضاعة من المخزن (واجهة الكاشير)
async function sellProduct(name, quantitySold) {
    const db = await getDB();
    const product = await db.get('SELECT * FROM products WHERE name = ?', [name]);
    
    if (!product) {
        console.log(`❌ خطأ: المنتج [${name}] غير موجود في المخزن!`);
        return false;
    }
    
    if (product.quantity < quantitySold) {
        console.log(`⚠️ عذراً: الكمية المتاحة من [${name}] هي (${product.quantity}) فقط، لا تكفي لبيع (${quantitySold})!`);
        return false;
    }
    
    // خصم الكمية برمجياً
    const newQuantity = product.quantity - quantitySold;
    await db.run('UPDATE products SET quantity = ? WHERE id = ?', [newQuantity, product.id]);
    
    // حساب الإجمالي اللي طلبته (السعر * الكمية)
    const total = product.sell_price * quantitySold;
    console.log(`💰 تم البيع بنجاح! المنتج: [${name}] | الكمية: ${quantitySold} | الإجمالي: ${total} جنيه | المتبقي في المخزن: ${newQuantity}`);
    return true;
}

// 3. دالة إضافة تاجر جديد بمديونية ابتدائية
async function addSupplier(name, phone, initialDebt) {
    const db = await getDB();
    await db.run('INSERT INTO suppliers (name, phone, total_debt) VALUES (?, ?, ?)', [name, phone, initialDebt]);
    console.log(`👤 تم تسجيل التاجر: [${name}] بمديونية قدرها: ${initialDebt} جنيه`);
}

// 4. دالة تحصيل وتسديد جزء من مديونية التاجر (تقليل المديونية)
async function paySupplierDebt(supplierName, amountPaid) {
    const db = await getDB();
    const supplier = await db.get('SELECT * FROM suppliers WHERE name = ?', [supplierName]);
    
    if (!supplier) {
        console.log(`❌ التاجر [${supplierName}] غير مسجل!`);
        return;
    }
    
    // تحديث المديونية: المديونية الجديدة = الحالية - المدفوع
    const newDebt = supplier.total_debt - amountPaid;
    await db.run('UPDATE suppliers SET total_debt = ? WHERE id = ?', [newDebt, supplier.id]);
    
    // تسجيل العملية في جدول التحصيلات للرجوع إليها
    const today = new Date().toISOString().split('T')[0];
    await db.run('INSERT INTO supplier_transactions (supplier_id, paid_amount, transaction_date) VALUES (?, ?, ?)', 
        [supplier.id, amountPaid, today]);
        
    console.log(`📉 تم سداد دفعة للتاجر [${supplierName}] بمبلغ: ${amountPaid} جنيه | المديونية المتبقية الحالية: ${newDebt} جنيه`);
}

// ==========================================
// شاشة تجربة العمليات (تخيل إن الكاشير شغال)
// ==========================================
async function runTest() {
    console.log('\n--- بدء تجربة العمليات الحية على Mstock ---');
    
    // أ. توريد بضاعة للمخزن
    await addProduct('بيبسي كانز', 50, 8.0, 10.0);
    await addProduct('إندومي دجاج', 100, 7.0, 9.0);
    
    // ب. إضافة تاجر بنتعامل معاه آجل
    await addSupplier('شركة النصر للمواد الغذائية', '0123456789', 5000);
    
    // ج. زبون جه يشتري من الكاشير (سحب من المخزن)
    await sellProduct('بيبسي كانز', 3); // هيخصم 3 ويحسب الإجمالي
    await sellProduct('إندومي دجاج', 5); // هيخصم 5 ويحسب الإجمالي
    
    // د. دفعنا جزء من المديونية للتاجر (تحصيل وتقليل الحساب الآجل)
    await paySupplierDebt('شركة النصر للمواد الغذائية', 1500);
}

// تشغيل التجربة
runTest();