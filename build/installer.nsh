!macro customInit
  MessageBox MB_YESNO "هل تريد حذف بيانات النظام القديمة بالكامل قبل تثبيت النسخة الجديدة؟$\n(تحذير: سيتم مسح الفواتير والتجار وجميع الإعدادات من هذا الجهاز، لا تفعل ذلك إلا إذا أردت تصفير البرنامج تماماً)" IDNO skip_clean
    RMDir /r "$APPDATA\mstock"
    Delete "$PROFILE\mstock_local_db.json"
    Delete "$PROFILE\mstock_local_db.json.tmp"
  skip_clean:
!macroend
