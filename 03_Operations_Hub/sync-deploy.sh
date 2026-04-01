#!/bin/bash
# ==========================================
# 💎 正矿智控 · 一键极速部署 (V2.3 稳定版)
# ==========================================

echo "🚀 [$(date '+%Y-%m-%d %H:%M')] 正矿系统 (V2.3) · 启动云端同步程序..."
echo "------------------------------------------------------------"

# 0. 环境预处理 (SOP-V2.1)
git config core.fileMode false
echo "📦 [1/4] 正在拉取代码更新..."
git pull || {
    echo "❌ [错误] Git 更新冲突。尝试覆盖本地更改..."
    git reset --hard origin/$(git rev-parse --abbrev-ref HEAD)
    git pull
}

# 1. 检查物理环境
if [ ! -f 03_Operations_Hub/.env.justmine ]; then
    echo "⚠️  [提醒] 未检测到 .env.justmine 秘钥金库。使用示例配置..."
    cp 03_Operations_Hub/env.justmine.example 03_Operations_Hub/.env.justmine
fi

# 2. 核心构建与拉取
echo "⚡ [2/4] 正在构建最新镜像 (前端 + 引擎)..."
cd 03_Operations_Hub
docker-compose up -d --build --remove-orphans || {
    echo "❌ [错误] Docker 启动失败。正在清理缓存并重试..."
    docker system prune -f
    docker-compose up -d --build
}

# 3. 健康自检
echo "🚀 [3/4] 正矿智控系统已满血复活！"
echo "------------------------------------------------------------"
docker ps | grep zk-
echo "📊 [4/4] 状态正常。访问域名或在企微中测试。 "
echo "------------------------------------------------------------"
