# 正矿供应链 - 数字化平台 (JustMine Supply Chain)

这是一个基于 React + Vite 的高效数字化供应链管理平台。

## 🚀 快速更新与维护指南

为了让您能够便捷地维护网站，我们已经实现了**统一配置化管理**：

### 1. 修改公司基本信息 (推荐)
如果您需要修改公司名称、地址、电话、邮箱或者备案号，**无需修改代码**，请直接编辑以下文件：
- 路径: `src/config/siteConfig.js`
- 操作: 使用记事本或编辑器打开，修改对应的双引号内的内容即可。

### 2. 更新图片与二维码
我们已经为您预留了静态资源存放位置：
- 路径: `public/assets/`
- 操作:
  - **公众号二维码**: 将新的二维码图片重命名为 `wechat-public-qr.jpg` 放入该文件夹替换旧图。
  - **企业微信二维码**: 将新的企微码重命名为 `wecom-qr.jpg` 放入该文件夹。
  - **公司 Logo**: 直接替换 `public/logo.png`。

### 3. 同步知识库 (Obsidian)
每当您在本地 Obsidian 中更新了内容，请在项目根目录运行以下命令进行自动同步：
```bash
npm run sync-kb
```

### 4. 自动化部署 (GitHub Actions)
我已经为您配置了自动部署脚本（`.github/workflows/deploy.yml`）。当您完成 `git push` 后，GitHub 会自动帮您构建并上传到云服务器。

**⚠️ 首次使用需在 GitHub 仓库设置中添加以下 Secrets (配置路径: Settings -> Secrets and variables -> Actions):**
1. `SERVER_IP`: 您的腾讯云服务器公网 IP。
2. `SERVER_USER`: 服务器登录用户名（通常是 `ubuntu` 或 `root`）。
3. `SERVER_SSH_KEY`: 您的私钥（如果是用 SSH 密钥登录的话）。

**服务器 Nginx 配置建议:**
```nginx
server {
    listen 80;
    server_name 您的域名; # 或 IP

    location / {
        root /var/www/zhengkuang-sc; # 需与 deploy.yml 中的 target 路径一致
        index index.html;
        try_files $uri $uri/ /index.html; # 支持单页应用路由
    }
}
```

## 🛠️ 核心功能栏目
- **行情中心**: 实时追踪矿产价格走势。
- **知识库 (Obsidian)**: 数字化行业研报与贸易实务。
- **协同工作台**: 数字化单证中心与风险控制。
- **物流监控**: 全球船位 AIS 可视化追踪。

---
由 Antigravity AI 特约构建。
