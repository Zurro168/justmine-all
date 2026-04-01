@echo off
setlocal
title 联合部署向导 - 正矿供应链 & 自华积加 (Jaguar)

echo ============================================================
echo      🚀 跨国贸易 AI 系统 - 联合部署向导 (V2.0)
echo ============================================================
echo.

echo [1/3] 正在检查 Docker 环境...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Docker！请先安装并启动 Docker Desktop。
    pause
    exit /b
)

echo [2/3] 正在检查各子系统配置文件...
set MISSING_ENV=0
if not exist "..\Supply-chain-Multiagents\openclaw-deployment\.env" set MISSING_ENV=1
if not exist "..\Jaguar-MultiAgents\.env" set MISSING_ENV=2

if %MISSING_ENV% neq 0 (
    echo [警告] 缺少子系统配置文件 (.env)！
    echo 请确保 Zhengkuang 和 Jaguar 目录下均已配置 .env
    pause
    exit /b
)

echo [3/3] 正在启动全量容器集群 (Zhengkuang + Jaguar + Web)...
docker-compose up -d --build

echo.
echo ============================================================
echo ✅ 全系统部署成功！
echo    - JustMine 官网: http://localhost
echo    - 正矿管理后台: http://localhost/zk-manager (或端口 3000)
echo    - 自华管理后台: http://localhost/jaguar-manager (或端口 3001)
echo    - 联合调度中心: 查看 docker-compose ps
echo ============================================================
pause
