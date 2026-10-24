@echo off
chcp 65001 > nul
title رفع التحديثات إلى GitHub - منظومة الموارد البشرية

echo ====================================================================
echo        معالج رفع كافة تعديلات المنظومة إلى GitHub (مع ملفات dist)
echo ====================================================================
echo.
echo [1] بناء ملفات الواجهة البرمجية المحدثة (npm run build).
echo [2] مزامنة وتأمين ملفات الخادم والمحدث السحابي.
echo [3] تضمين وتتبع كافة الملفات التراكمية ومجلد dist/.
echo [4] الرفع المباشر إلى مستودع GitHub.
echo.
echo اضغط أي مفتاح للبدء...
pause > nul

echo.
echo [+] خطوة 1: بناء ملفات الواجهة (Vite Build)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [X] فشل بناء ملفات الواجهة.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [+] خطوة 2: مزامنة وحدات التحديث...
if exist "src\server\githubUpdater.cjs" copy /y "src\server\githubUpdater.cjs" "githubUpdater.cjs" > nul
if exist "src\server\scannerDriver.cjs" copy /y "src\server\scannerDriver.cjs" "scannerDriver.cjs" > nul

echo.
echo [+] خطوة 3: تجهيز الملفات لـ Git...
git add -A
git status -s

echo.
set /p commit_msg="اكتب وصف التحديث (أو اضغط Enter للاعتماد التلقائي): "
if "%commit_msg%"=="" set commit_msg=تحديث شامل للمنظومة والواجهة

git commit -m "%commit_msg%"

echo.
echo [+] خطوة 4: الرفع إلى GitHub (git push)...
git push

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================================
    echo [✓] تم رفع كافة ملفات المنظومة وتوزيعة dist/ إلى GitHub بنجاح!
    echo [✓] الآن يمكن لأي جهاز تثبيت التحديث عبر الإنترنت وتطبيقه فوراً.
    echo ====================================================================
) else (
    echo.
    echo [X] تعذر الرفع إلى GitHub. تأكد من صلاحيات Git والاتصال بالإنترنت.
)

echo.
pause
