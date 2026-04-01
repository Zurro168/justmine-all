---
name: zk-multi-tenant-memory
description: 基于 Mem0 框架建设、具备群组物理隔离（多租户防串联）的长短期记忆系统
version: 1.0.0
author: Zhengkuang_Supply_Chain
tags:
  - mem0
  - memory
  - context-isolation
  - compliance
dependencies:
  - mem0ai
  - dotenv
run_cmd: "python memory_engine.py"
---

# 正矿智能防串联引擎技能 (zhengkuang-multi-tenant-memory)

## 技能说明
这是系统中极其重要的业务合规与风控组件。为所有负责对外沟通的智能体（如 `Pitcher`, `Negotiator`）提供持久化的上下文对话记录以及针对特定客户的偏好提炼（Long-Term Preference）。

## 安全与隔离红线（极度重要）
本技能底层已植入强隔离逻辑的 Tenant Vault。
在进行记忆**写入（Add）**或**读取（Search）**时，**必须**传递从微信或钉钉网关接收到的真实上下文鉴权参数：
- `run_id`: 此参数对应企微的 RoomID（群组ID），用于在同一笔业务/团队群聊中共享记忆。
- `user_id`: 具体的个人客户微信号或钉钉工号。

任何试图绕开隔离墙进行无条件全局检索的行为，会在数据库物理层直接报错阻断。这保证了客户A的底价这辈子都不可能被串读进客户B的对话沙盒中。
