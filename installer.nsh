; سكريبت تثبيت التحديثات لضمان الترقية في نفس المكان وحذف أي اختصارات سابقة مكررة
!macro customInit
  ; حذف أي اختصارات قديمة كانت باللغة الإنجليزية أو بأسماء مختلفة لمنع تكرار الأيقونات
  Delete "$DESKTOP\react-example.lnk"
  Delete "$SMPROGRAMS\react-example.lnk"
  Delete "$DESKTOP\HR System.lnk"
  Delete "$SMPROGRAMS\HR System.lnk"
  Delete "$LOCALAPPDATA\Programs\react-example\react-example.exe"
!macroend

!macro customInstall
  ; تنظيف نهائي أثناء التثبيت لضمان بقاء أيقونة رسمية واحدة فقط على سطح المكتب وقائمة ابدأ
  Delete "$DESKTOP\react-example.lnk"
  Delete "$SMPROGRAMS\react-example.lnk"
  Delete "$DESKTOP\HR System.lnk"
  Delete "$SMPROGRAMS\HR System.lnk"
!macroend
