@echo off
echo 启动开发环境...
echo.
echo 正在启动前端服务器 (端口 5173)...
start "前端服务器" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul
echo.
echo 正在启动后端服务器 (端口 3000)...
start "后端服务器" cmd /k "npm run dev:server"
echo.
echo 开发环境已启动！
echo 前端: http://localhost:5173
echo 后端: http://localhost:3000
pause
