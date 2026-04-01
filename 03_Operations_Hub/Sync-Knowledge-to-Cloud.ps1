# ==========================================================
# 💎 正矿智控 · 知识库「一键同步 + 云端部署」脚本
# ==========================================================
# 功能：
# 1. 自动从 Obsidian 提取 Markdown (需保持 Obsidian 路径正确)
# 2. 自动更新网站 JSON 数据库
# 3. 自动提交并推送代码
# 4. 🔗 (可选) 远程触发腾讯云更新
# ==========================================================

$CurrentDir = Get-Location
$ProjectRoot = Split-Path $CurrentDir -Parent
$FrontendPath = Join-Path $ProjectRoot "02_Trade_Platform"
$OpsPath = Join-Path $ProjectRoot "03_Operations_Hub"

Write-Host "🚀 [1/4] 正在从 Obsidian 提取最新知识..." -ForegroundColor Cyan
cd $FrontendPath
npm run sync-kb

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 提取失败，请检查 Obsidian 路径是否正确。" -ForegroundColor Red
    exit
}

Write-Host "`n📦 [2/4] 正在保存知识库变更到本地 Git..." -ForegroundColor Cyan
git add src/data/kb-articles.json
git commit -m "docs(kb): 自动同步 Obsidian 知识库内容 $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

Write-Host "`n☁️ [3/4] 正在推送至代码中心..." -ForegroundColor Cyan
git push

Write-Host "`n⚡ [4/4] 远程部署指令 (建议手动执行或配置 SSH 免密)..." -ForegroundColor Yellow
Write-Host "请在腾讯云服务器上执行以下命令：" -ForegroundColor White
Write-Host "cd /root/justmine-all && git pull && bash 03_Operations_Hub/sync-deploy.sh" -ForegroundColor Green

Write-Host "`n✅ 完成！本地同步已就绪。" -ForegroundColor Cyan
cd $CurrentDir
