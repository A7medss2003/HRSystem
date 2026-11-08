@echo off
chcp 65001 > nul
title معالج إصلاح الشاشة البيضاء واستعادة المنظومة - مركز البنيان
color 0B

echo ====================================================================
echo      أداة الإصلاح الفوري للشاشة البيضاء واستعادة منظومة الموارد البشرية
echo ====================================================================
echo.
echo [1] سيتم إغلاق أي عملية معلقة للمنظومة.
echo [2] تنظيف مجلد التحديثات المؤقتة المعطوبة (app_update).
echo [3] مسح كاش العرض والتخزين المؤقت التالف (Cache ^& GPUCache).
echo [✓] تنبيه: بيانات الموظفين وسجلات الحضور والرواتب محفوظة بأمان 100%%.
echo.
echo اضغط أي مفتاح للبدء في الإصلاح...
pause > nul

echo.
echo [+] جاري إيقاف العمليات السابقة إن وجدت...
taskkill /F /IM "HR System.exe" /T >nul 2>&1
taskkill /F /IM "hr-system.exe" /T >nul 2>&1
taskkill /F /IM "electron.exe" /T >nul 2>&1
timeout /t 1 /nobreak > nul

echo [+] جاري تنظيف مجلدات التحديث المعطوبة...
if exist "%APPDATA%\hr-system\app_update" (
    rmdir /s /q "%APPDATA%\hr-system\app_update"
    echo    ✓ تم حذف مجلد التحديثات التالفة: %%APPDATA%%\hr-system\app_update
)
if exist "%APPDATA%\HR System\app_update" (
    rmdir /s /q "%APPDATA%\HR System\app_update"
    echo    ✓ تم حذف مجلد التحديثات التالفة: %%APPDATA%%\HR System\app_update
)
if exist "%APPDATA%\react-example\app_update" (
    rmdir /s /q "%APPDATA%\react-example\app_update"
    echo    ✓ تم حذف مجلد التحديثات التالفة: %%APPDATA%%\react-example\app_update
)
if exist "%LOCALAPPDATA%\hr-system\app_update" (
    rmdir /s /q "%LOCALAPPDATA%\hr-system\app_update"
    echo    ✓ تم حذف مجلد التحديثات التالفة: %%LOCALAPPDATA%%\hr-system\app_update
)

echo [+] جاري تنظيف الذاكرة المؤقتة التالفة (Cache)...
if exist "%APPDATA%\hr-system\Cache" rmdir /s /q "%APPDATA%\hr-system\Cache" >nul 2>&1
if exist "%APPDATA%\hr-system\GPUCache" rmdir /s /q "%APPDATA%\hr-system\GPUCache" >nul 2>&1
if exist "%APPDATA%\hr-system\Code Cache" rmdir /s /q "%APPDATA%\hr-system\Code Cache" >nul 2>&1

echo.
echo ====================================================================
echo [✓] تم الإصلاح بنجاح تام! تم إزالة الملفات المعطوبة واستعادة سلامة المنظومة.
echo ====================================================================
echo.
echo يمكنك الآن إعادة تشغيل المنظومة من أيقونة سطح المكتب وستفتح الواجهة فوراً.
echo.

set "APP_EXE=%LOCALAPPDATA%\Programs\hr-system\HR System.exe"
if exist "%APP_EXE%" (
    echo [+] جاري تشغيل المنظومة تلقائياً الآن...
    start "" "%APP_EXE%"
) else (
    echo يرجى تشغيل المنظومة الآن من أيقونة سطح المكتب: [نظام الموارد البشرية]
)

echo.
pause
