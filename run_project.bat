@echo off
chcp 65001 > nul
title TUANVIETLIBRARY - KHỞI CHẠY HỆ THỐNG
echo ======================================================
echo    TUANVIETLIBRARY - HỆ THỐNG QUẢN LÝ THƯ VIỆN SỐ
echo ======================================================
echo.

:: 1. Kiểm tra và khởi động MySQL XAMPP nếu chưa chạy
echo [1/3] Đang kiểm tra dịch vụ MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo    -> MySQL đang chạy sẵn sàng!
) else (
    echo    -> Đang khởi động MySQL từ XAMPP...
    start "" /B "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
    timeout /t 3 > nul
    echo    -> MySQL đã khởi động!
)

:: 2. Khởi chạy Backend Express Server (Port 5000)
echo.
echo [2/3] Đang khởi động Backend API Server (Port 5000)...
start "Backend Server (Port 5000)" cmd /k "cd /d ""%~dp0server"" && npm start"

:: 3. Khởi chạy Frontend React Vite (Port 3000)
echo.
echo [3/3] Đang khởi động Frontend Web App (Port 3000)...
start "Frontend Web (Port 3000)" cmd /k "cd /d ""%~dp0"" && npm run dev"

echo.
echo ======================================================
echo    HỆ THỐNG ĐÃ KHỞI CHẠY THÀNH CÔNG!
echo    - Trang web:   http://localhost:3000
echo    - API Backend: http://localhost:5000/api/v1
echo    - Health check: http://localhost:5000/api/health
echo ======================================================
echo.
timeout /t 3 > nul
start http://localhost:3000
exit
