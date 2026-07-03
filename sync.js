const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// إعداد مسارات الملفات
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const DB_PATH = path.join(__dirname, 'mstock.db');

async function uploadToDrive() {
    console.log('\n--- جاري بدء عملية المزامنة الذكية المباشرة ---');

    // 1. التأكد من وجود الملفات الأساسية
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error('❌ خطأ: ملف credentials.json غير موجود في الفولدر!');
        return;
    }
    if (!fs.existsSync(DB_PATH)) {
        console.error('❌ خطأ: ملف قاعدة البيانات mstock.db غير موجود! يرجى تشغيل database.js أولاً.');
        return;
    }

    try {
        // 2. تسجيل الدخول لخدمات جوجل برمجياً
        const auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // 3. البحث في جوجل درايف لو الملف اترفع قبل كده (لتحديثه وتوفير المساحة)
        console.log('🔍 جاري الفحص في جوجل درايف عن نسخ سابقة من mstock.db...');
        const response = await drive.files.list({
            q: "name = 'mstock.db' and trashed = false",
            fields: 'files(id, name)',
        });

        const files = response.data.files;
        const fileMetadata = { name: 'mstock.db' };
        const media = {
            mimeType: 'application/x-sqlite3',
            body: fs.createReadStream(DB_PATH),
        };

        if (files && files.length > 0) {
            // لو الملف موجود بالفعل، هنعمل له تحديث (Overwrite/New Version)
            const fileId = files[0].id;
            console.log(`🔄 تم العثور على نسخة سابقة بـ ID: ${fileId}. جاري تحديث البيانات...`);
            await drive.files.update({
                fileId: fileId,
                media: media,
            });
            console.log('✅ تم تحديث نسخة قاعدة البيانات أونلاين بنجاح!');
        } else {
            // لو أول مرة يرفع الملف
            console.log('🆕 جاري رفع ملف قاعدة البيانات لأول مرة على حسابك...');
            const newFile = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id',
            });
            console.log(`✅ تم الرفع لأول مرة بنجاح! معرف الملف: ${newFile.data.id}`);
        }

    } catch (error) {
        console.error('❌ فشلت المزامنة المباشرة.');
        console.error('تفاصيل الخطأ:', error.message);
    }
}

// تشغيل المزامنة
uploadToDrive();