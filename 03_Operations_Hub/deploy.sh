#!/bin/bash
# ==========================================
# 联合部署脚本 - 正矿供应链 & 自华积加 (Jaguar)
# ==========================================

echo "🚀 开始全系统集成部署流程..."

# 1. 检查各系统配置文件
if [ ! -f "../Supply-chain-Multiagents/openclaw-deployment/.env" ] || [ ! -f "../Jaguar-MultiAgents/.env" ]; then
    echo "❌ 错误: 未发现各子系统的 .env 配置文件。"
    exit 1
fi

# 2. 安装 Docker (如果不存在)
if ! [ -x "$(command -v docker)" ]; then
  echo "📦 正在安装 Docker..."
  curl -fsSL https://get.docker.com | bash -s docker
  systemctl start docker
  systemctl enable docker
fi

# 3. 执行集成构建与启动
echo "🛠️ 正在并行构建所有系统镜像..."
docker-compose up -d --build

# 4. 清理冗余镜像
docker image prune -f

echo "=========================================="
echo "✅ 部署完成！"
echo "🌐 官网地址: http://服务器公网IP"
echo "🖥️ [正矿] 管理后台: http://服务器公网IP/zk-manager"
echo "🖥️ [自华] 管理后台: http://服务器公网IP/jaguar-manager"
echo "⚠️  注意: 请确保腾讯云安全组已放行 80, 443, 3000, 3001, 8000, 8001 端口。"
echo "=========================================="
