@echo off
setlocal
title 部署向导 - 正矿供应链 (JustMine)

echo ============================================================
echo      🚀 正矿供应链 AI 系统 - 部署向导 (V3.0)
echo ============================================================
echo.

echo [1/3] 正在检查 Docker 环境...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Docker！请先安装并启动 Docker Desktop。
    pause
    exit /b
)

echo [2/3] 正在检查配置文件...
if not exist ".env.justmine" (
    echo [警告] 缺少配置文件 (.env.justmine)！
    echo 请复制 env.justmine.example 为 .env.justmine 并填写 API 密钥。
    pause
    exit /b
)

echo [3/3] 正在启动服务集群...
docker-compose up -d --build

echo.
echo ============================================================
echo ✅ 部署成功！
echo    - JustMine 官网: http://localhost
echo    - AI 管理后台: http://localhost/ai-manager/ (或端口 3000)
echo    - 查看容器状态: docker-compose ps
echo ============================================================
pause
