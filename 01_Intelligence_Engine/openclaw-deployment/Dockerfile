# --- 严格遵循 SOP-V2.1: 使用 Playwright 胖镜像 (预装所有浏览器依赖) ---
FROM mcr.microsoft.com/playwright/python:v1.45.0-jammy

WORKDIR /app

# 1. 自动检测并同步 Python 依赖环境 (支持多级目录)
COPY openclaw-deployment/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 2. 同步全量智控大脑业务代码 (包括 skills 和 bots)
COPY . .

# 3. 智控中枢端口开放 (Sandbox + WeCom Webhook)
EXPOSE 3000
EXPOSE 5000

# 4. 启动智控仪表盘 & 沙盘逻辑
CMD ["python", "app_dashboard.py"]
