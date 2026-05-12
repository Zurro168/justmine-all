#!/bin/bash
# ==========================================
# 部署脚本 - 正矿供应链 (JustMine)
# ==========================================

echo "🚀 开始正矿供应链部署流程..."

# 1. Check config
if [ ! -f ".env.justmine" ]; then
    echo "⚠️ 未发现 .env.justmine 配置文件，从模板创建..."
    if [ -f "env.justmine.example" ]; then
        cp env.justmine.example .env.justmine
        echo "📝 已创建 .env.justmine，请填写 API 密钥后重新运行"
        exit 1
    else
        echo "❌ 错误: 未发现 env.justmine.example 模板文件"
        exit 1
    fi
fi

# 2. Install Docker if missing
if ! [ -x "$(command -v docker)" ]; then
  echo "📦 正在安装 Docker..."
  curl -fsSL https://get.docker.com | bash -s docker
  systemctl start docker
  systemctl enable docker
fi

# 3. Build and start
echo "🛠️ 正在构建并启动服务..."
docker-compose up -d --build

# 4. Clean up
docker image prune -f

echo "=========================================="
echo "✅ 部署完成！"
echo "🌐 官网地址: http://服务器公网IP"
echo "🖥️ AI 管理后台: http://服务器公网IP/ai-manager/"
echo "⚠️  注意: 请确保腾讯云安全组已放行 80, 443 端口"
echo "=========================================="
