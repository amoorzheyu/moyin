#!/bin/bash
echo "启动开发环境..."
echo ""
echo "正在启动前端服务器 (端口 5173)..."
npm run dev &
FRONTEND_PID=$!
sleep 2
echo ""
echo "正在启动后端服务器 (端口 3000)..."
npm run dev:server &
BACKEND_PID=$!
echo ""
echo "开发环境已启动！"
echo "前端: http://localhost:5173"
echo "后端: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"
trap "kill $FRONTEND_PID $BACKEND_PID" EXIT
wait
