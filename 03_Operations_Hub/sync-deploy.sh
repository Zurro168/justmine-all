#!/bin/bash
# --- [SOP-V2.3: 正矿智控系统 · 战术自动同步脚本] ---

echo "🚀 [$(date '+%Y-%m-%d %H:%M')] 智控中心正在点火..."

# 1. 自动检测中枢所在的物理路径
BASE_DIR=$(cd "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(cd "$BASE_DIR/.." && pwd)

echo "📦 [1/4] 定位正矿主阵地: $PROJECT_ROOT"

# 2. 补全秘钥金库 (如果缺失)
if [ ! -f "$BASE_DIR/.env.justmine" ]; then
    echo "⚠️  [提醒] 未检测到 .env.justmine 秘钥。从模板克隆..."
    cp "$PROJECT_ROOT/env.justmine.example" "$BASE_DIR/.env.justmine" || echo "❌ [警告] 根本找不到 env 模板！"
fi

# 3. 闪电点火并强制重构 (锁定在 03 运维中心执行)
cd "$BASE_DIR"
echo "⚡ [2/4] 正在拉起 Docker 战术单元 (前端 + 引擎)..."

# 强制重构并后台运行
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 4. 结果核验
echo "📡 [3/4] 最终链路重载中..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "🚀 [4/4] 正矿智控 (JustMine) 系统全量重启成功！"
