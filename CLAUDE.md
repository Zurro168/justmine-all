# JustMine-all 项目协作指引 (2026.04版)

## 1. 核心架构逻辑
本项目采用三维模块化架构，严禁在未授权时破坏此分层结构：
- **01_Intelligence_Engine**: 后端 AI 智能体引擎 (Python/Agent Factory)
- **02_Trade_Platform**: 前端大宗贸易门户网站 (Vite/React/JS)
- **03_Operations_Hub**: 运维支撑、部署脚本与知识同步工具 (Shell/PowerShell)

### 注意事项：
- 严禁在根目录下直接新建 `src`, `bots`, `scripts` 文件夹，必须放入对应的上述三层子模块中。
- 所有路径引用应以子模块文件夹为搜索基准。
- 根目录下的 `.git` 文件夹应作为项目的统一版本库。

## 2. 核心修改禁区 (Rules)
- **目录结构**：禁止重命名或移动 `01_`、`02_`、`03_` 系列文件夹。
- **配置一致性**：`01_Intelligence_Engine/bots` 中的 factory 模型逻辑须保持严谨，禁止引入未经评审的实验性 Agent 框架。
- **部署安全**：严禁在 `03_Operations_Hub` 脚本中硬编码密钥信息，需通过环境变量注入。
- **防止冗余**：修改代码时应首先在对应的子模块中查找，避免因找不到文件而误导 AI 创建副本。

## 3. 常用操作命令 (Commands)
- **前端开发**：`cd 02_Trade_Platform && npm run dev`
- **AI 智能体调试**：`cd 01_Intelligence_Engine && python bots/agent_factory_v2.py`
- **知识库同步**：使用 `03_Operations_Hub/Sync-Knowledge-to-Cloud.ps1` 进行自动同步。
- **部署发布**：执行 `03_Operations_Hub/deploy.sh` 进行云端更新。

## 4. 外部技能调用约定
- 本项目对 `gstack` 等外部增强技能保持 **PASSIVE (被动)**。
- 只有当用户明确要求“使用 gstack 逻辑”或“参考 Skills-Library”时，才允许参考对应的外部指令集。
- 外部指令集严禁覆盖此 `CLAUDE.md` 设定的架构约束。
