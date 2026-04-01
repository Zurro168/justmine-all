---
name: zk-notion-bridge
description: 读取企业云端 Notion CRM 表格，获取各类国际买家和下游大厂的即时线索池。
version: 1.0.0
author: System
tags: ["CRM", "Notion", "Sales", "API"]
dependencies:
  - os
  - requests
  - json
  - python-dotenv
run_cmd: "python ../../zk_notion_bridge.py"
---

# ZK Notion Bridge (正矿云端业务协同桥)

## 📌 技能背景
与本地防壁的 Obsidian 不同，Notion 被设计为“前台进攻端”。前端销售、矿主寻源、市场资讯均被录入 Notion Database 进行管理。本技能让 `Matchmaker` (撮合分析师) 在推销新船矿单前，能够实时在线拉取最新的《客户需求池》，生成极其精准且高度转化的逼单信息。

## 🔐 运行边界
1. 本程序使用 `requests` 库纯 HTTP 调用官方 API，无第三方污染。
2. 基础版本只开放“读取（Query）”权限，防止 AI 因幻觉清空客户库。
3. 必须在环境变量中提供被授予权限的 API Secret。

## 🚀 调用方式
由 `Nexus` 分发至 `Matchmaker` 时，在后台静默抓取。
```bash
python zk_notion_bridge.py
```
