---
name: zk-obsidian-indexer
description: 读取企业本地 Obsidian 风控制度库，利用 RAG 增强 Docu-Checker 处理单据异常的容错能力。
version: 1.0.0
author: System
tags: ["RAG", "Obsidian", "Knowledge Base", "Risk Control"]
dependencies:
  - os
  - glob
  - python-dotenv
run_cmd: "python ../../zk_obsidian_indexer.py"
---

# ZK Obsidian Indexer (正矿风控密室探针)

## 📌 技能背景
风控的红线条文通常是绝对保密的，不能传上云端大模型进行训练或存储。本技能允许系统在处理外商文件时，以“只读”权限检索用户本地的 Obsidian Vault 文件夹（`.md` 纯文本），将最新的罚金计算公式、制裁清单或黑历史客户名单，作为临时上下文（Context）动态拼接到大模型的提示词中，辅佐最终判决。

## 🔐 运行边界
1. 本程序无外网发送代码，只做本地递归文件读取。
2. 绝对不可修改/删除 Obsidian 中的任何知识点文件。
3. 需要 `.env` 提供 `OBSIDIAN_VAULT_PATH`。

## 🚀 调用方式
由 `Nexus` 在分配审单任务前，或者由 `Docu-Checker` 遇到知识盲区时触发。
```bash
python zk_obsidian_indexer.py
```
