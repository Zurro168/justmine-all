"""
Session 登录态初始化脚本 — 在服务器上用 Playwright 打开浏览器
等待人工登录铁合金在线，然后保存 session 供定时任务复用。

在 Windows 本地开发机上：
  python scout_login.py
  → 自动打开 Edge，手动登录后关闭浏览器即可

在服务器（无 GUI）：
  需要先用 Xvfb + vncserver 提供远程桌面，
  或者直接在本地生成 session JSON 后复制到服务器。
"""
import asyncio
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

SESSION_DIR = os.path.join(os.path.dirname(__file__), "data")
SESSION_FILE = os.path.join(SESSION_DIR, "ferroalloy_session.json")
LOGIN_URL = "https://www.cnfeol.com/"


async def login_and_save_session():
    """打开浏览器，等待人工登录，保存 session"""
    os.makedirs(SESSION_DIR, exist_ok=True)

    print("=" * 60)
    print("铁合金在线 登录态初始化")
    print(f"Session 将保存到: {SESSION_FILE}")
    print("=" * 60)

    async with async_playwright() as p:
        # 在 Windows 上用 Edge，在 Linux 上用 Chromium
        launch_args = {"headless": False}
        if sys.platform == "win32":
            launch_args["channel"] = "msedge"
        else:
            launch_args["executable_path"] = None

        browser = await p.chromium.launch(**launch_args)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720},
        )
        page = await context.new_page()

        # 防检测
        await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        print(f"\n[1] 打开铁合金在线: {LOGIN_URL}")
        await page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=60000)

        print("\n[2] 请在打开的浏览器中手动登录铁合金在线账号")
        print("    登录成功后，在终端按 Enter 键保存 session")
        input()  # 等待用户按 Enter

        # 跳转到会员页面验证登录
        print("\n[3] 验证登录态...")
        await page.goto("https://www.cnfeol.com/gao/p_2528659.aspx", wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)

        content = await page.content()
        if "TencentCaptcha" in content or "登录" in content[:500]:
            print("  ⚠️  检测到登录页面或验证码，可能未成功登录")
            print("  请确认浏览器窗口中是否已登录，然后按 Enter 继续")
            input()

        # 保存 session
        await context.storage_state(path=SESSION_FILE)
        print(f"\n✅ Session 已保存到: {SESSION_FILE}")
        print("   定时任务将复用此 session，无需再次登录")
        print("   Session 有效期约 7-30 天，过期后重新运行此脚本")

        await browser.close()


if __name__ == "__main__":
    asyncio.run(login_and_save_session())
