"""
Session 登录态初始化 — CDP 连接模式
连接已运行的 Edge 实例（需手动先登录好），保存 session JSON。

用法：
1. 关闭所有 Edge
2. 启动 Edge（调试模式）:
   "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222
3. 在 Edge 中登录铁合金在线
4. 运行此脚本保存 session
"""
import asyncio
import os
import sys

from playwright.async_api import async_playwright

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

SESSION_DIR = os.path.join(os.path.dirname(__file__), "data")
SESSION_FILE = os.path.join(SESSION_DIR, "ferroalloy_session.json")
Ferroalloy_URL = "https://www.cnfeol.com/gao/p_2528659.aspx"


async def connect_and_save_session():
    os.makedirs(SESSION_DIR, exist_ok=True)

    print("=" * 60)
    print("铁合金在线 登录态初始化（CDP 连接模式）")
    print("=" * 60)
    print("\n[1] 请先完成以下操作：")
    print("    a. 关闭所有 Edge 窗口")
    print('    b. 运行: "msedge.exe" --remote-debugging-port=9222')
    print("    c. 在 Edge 中手动登录铁合金在线")
    print("    d. 确保能正常打开 https://www.cnfeol.com/gao/p_2528659.aspx")
    print()

    input("    全部完成后，按 Enter 开始连接...")

    async with async_playwright() as p:
        try:
            print("\n[2] 连接 Edge（端口 9222）...")
            browser = await p.chromium.connect_over_cdp(
                "http://localhost:9222", timeout=15000
            )
        except Exception as e:
            print(f"  ❌ 连接失败: {e}")
            print("  请确认 Edge 已用 --remote-debugging-port=9222 启动")
            return

        # 复用已有 context（包含登录 cookie）
        contexts = browser.contexts
        if not contexts:
            print("  ❌ 未找到活跃的浏览器上下文")
            await browser.close()
            return

        context = contexts[0]
        pages = context.pages
        if not pages:
            page = await context.new_page()
        else:
            page = pages[0]

        # 验证登录态
        print("\n[3] 验证会员页面访问...")
        try:
            await page.goto(Ferroalloy_URL, wait_until="domcontentloaded", timeout=15000)
            await asyncio.sleep(2)
            content = await page.content()
            if "TencentCaptcha" in content:
                print("  ⚠️  触发验证码，可能需要刷新或重新登录")
            elif "价格" in content or "dataListTable" in content:
                print("  ✅ 会员页面可正常访问")
            else:
                print("  ⚠️  页面内容异常，请检查浏览器窗口")
        except Exception as e:
            print(f"  ⚠️  验证请求异常: {e}")

        # 保存 session
        print("\n[4] 保存 session...")
        await context.storage_state(path=SESSION_FILE)
        print(f"\n✅ Session 已保存到: {SESSION_FILE}")
        print("   文件大小:", os.path.getsize(SESSION_FILE), "bytes")
        print("   定时任务将复用此 session")
        print("   Session 有效期约 7-30 天，过期后重新运行")

        await browser.close()


if __name__ == "__main__":
    asyncio.run(connect_and_save_session())
