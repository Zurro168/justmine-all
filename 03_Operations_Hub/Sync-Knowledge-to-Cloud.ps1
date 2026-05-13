# ==========================================================
# [Zhengkuang] Knowledge Base "One-Key Sync + Cloud Deploy" Script
# ==========================================================
# Functions:
# 1. Extract Markdown from Obsidian
# 2. Update website JSON database
# 3. Commit and push code
# 4. Remote trigger Tencent Cloud update (optional)
# ==========================================================

$CurrentDir = Get-Location
$ProjectRoot = Split-Path $CurrentDir -Parent
$FrontendPath = Join-Path $ProjectRoot "02_Trade_Platform"
$OpsPath = Join-Path $ProjectRoot "03_Operations_Hub"

Write-Host "[1/4] Extracting latest knowledge from Obsidian..." -ForegroundColor Cyan
cd $FrontendPath
npm run sync-kb

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Extraction failed. Please check Obsidian path." -ForegroundColor Red
    cd $CurrentDir
    exit
}

Write-Host "`n[2/4] Saving knowledge base changes to local Git..." -ForegroundColor Cyan
git add .
git commit -m "docs(kb): auto sync knowledge base $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

Write-Host "`n[3/4] Pushing to GitHub..." -ForegroundColor Cyan
git push

Write-Host "`n[4/4] Remote Deployment Instructions..." -ForegroundColor Yellow
Write-Host "Please run the following on your Tencent Cloud server:" -ForegroundColor White
Write-Host "cd /root/justmine-all && git pull && bash 03_Operations_Hub/sync-deploy.sh" -ForegroundColor Green

Write-Host "`n[DONE] Local synchronization complete." -ForegroundColor Cyan
cd $CurrentDir
