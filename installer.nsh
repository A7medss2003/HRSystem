; سكريبت تثبيت التحديثات لضمان الترقية في نفس المكان وحذف أي اختصارات سابقة مكررة وتنظيف بقايا التحديثات المعطوبة لمنع الشاشة البيضاء
!macro customInit
  ; حذف أي اختصارات قديمة كانت باللغة الإنجليزية أو بأسماء مختلفة لمنع تكرار الأيقونات
  Delete "$DESKTOP\react-example.lnk"
  Delete "$SMPROGRAMS\react-example.lnk"
  Delete "$DESKTOP\HR System.lnk"
  Delete "$SMPROGRAMS\HR System.lnk"
  Delete "$LOCALAPPDATA\Programs\react-example\react-example.exe"

  ; تنظيف مجلدات التحديثات التالفة والقديمة لضمان فتح المنظومة مباشرة دون شاشة بيضاء
  RMDir /r "$APPDATA\hr-system\app_update"
  RMDir /r "$APPDATA\HR System\app_update"
  RMDir /r "$APPDATA\react-example\app_update"
  RMDir /r "$LOCALAPPDATA\hr-system\app_update"
!macroend

!macro customInstall
  ; تنظيف نهائي أثناء التثبيت لضمان بقاء أيقونة رسمية واحدة فقط على سطح المكتب وقائمة ابدأ
  Delete "$DESKTOP\react-example.lnk"
  Delete "$SMPROGRAMS\react-example.lnk"
  Delete "$DESKTOP\HR System.lnk"
  Delete "$SMPROGRAMS\HR System.lnk"

  ; ضمان تنظيف مجلد التحديثات التالفة حتى تعمل النسخة المنصبة فوراً وبشكل سليم 100%
  RMDir /r "$APPDATA\hr-system\app_update"
  RMDir /r "$APPDATA\HR System\app_update"
  RMDir /r "$APPDATA\react-example\app_update"
  RMDir /r "$LOCALAPPDATA\hr-system\app_update"
!macroend

