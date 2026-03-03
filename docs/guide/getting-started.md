# 快速开始

本章节将带你快速启动 Bunstuff 项目，包含完整的环境配置和启动流程。

> 💡 **新手建议**: 建议先阅读 [项目简介](/guide/) 了解整体架构，再进行环境搭建。

## 🎯 环境要求

在开始之前，请确保你的开发环境已满足以下要求：

### 核心环境

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| **Bun** | >= 1.0 | 运行时 + 包管理器 + 打包器 |
| **Node.js** | >= 18（可选） | 仅用于前端开发 |
| **Git** | 最新版 | 版本控制 |

::: tip Bun 安装
```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```
安装完成后验证：`bun --version`
:::

### 数据库

| 数据库 | 版本 | 说明 |
|--------|------|------|
| **SQLite** | 内置 | 开发环境默认，零配置 |
| **MySQL** | >= 5.7 | 生产环境推荐 |
| **PostgreSQL** | >= 13 | 生产环境推荐 |

> 💡 **提示**: 开发环境使用 SQLite 即可，无需额外安装数据库。SQLite 数据文件存储在 `data/` 目录。

### 开发工具

- **VS Code**（强烈推荐）
  - 推荐安装 Volar 插件（Vue 3 支持）
  - 推荐安装 TypeScript Vue Plugin

## 🚀 快速启动步骤

### 步骤 1：克隆项目

```bash
git clone https://github.com/a876691666/bunstuff.git
cd bunstuff
```

### 步骤 2：安装依赖

```bash
# 安装所有 Monorepo 子项目的依赖
bun install
```

::: warning 注意
项目采用 Monorepo 结构，根目录 `bun install` 会自动安装所有子项目依赖。无需分别进入各子目录安装。
:::

### 步骤 3：启动开发服务

```bash
# 方式一：同时启动所有服务（后端 + 管理端 + 客户端）
bun run dev

# 方式二：分别启动各服务
bun run dev:backend    # 后端 API 服务（端口 3000）
bun run dev:frontend   # 管理端前端（端口 5173）
bun run dev:client     # 客户端前端（端口 5174）
```

### 步骤 4：访问应用

启动成功后，访问以下地址：

| 服务 | 地址 | 说明 |
|------|------|------|
| **后端 API** | http://localhost:3000 | Elysia API 服务 |
| **管理端** | http://localhost:5173 | Vue 3 + Naive UI 管理后台 |
| **客户端** | http://localhost:5174 | Vue 3 轻量客户端 |
| **OpenAPI 文档** | http://localhost:3000/openapi | 自动生成的 API 文档 |

### 步骤 5：登录系统

使用默认管理员账号登录管理端：

| 项目 | 值 |
|------|---|
| **账号** | `admin` |
| **密码** | `admin123` |

::: danger 安全警告
生产环境部署前，请务必修改默认密码！
:::

## 📁 项目结构预览

```
bunstuff/
├── backend/              # 后端 Elysia API 服务
│   ├── index.ts          # 入口文件
│   ├── api/              # API 路由
│   ├── core/             # 核心框架
│   ├── models/           # 数据模型 (22 张表)
│   ├── services/         # 业务服务
│   ├── plugins/          # 功能插件 (11 个)
│   ├── packages/         # 自研包 (ORM/SSQL/RouteModel)
│   └── _generated/       # 自动生成注册文件
├── frontend/             # 管理端前端 (Vue 3 + Naive UI)
├── client/               # 客户端前端 (Vue 3)
├── docs/                 # 项目文档 (VitePress)
├── data/                 # SQLite 数据文件
├── uploads/              # 文件上传目录
├── build/                # 构建产物
├── Dockerfile            # Docker 构建文件
├── docker-compose.yml    # Docker 编排
└── package.json          # Monorepo 根配置
```

> 📖 更详细的目录说明请查看 [项目结构](/guide/structure)。

## 🔧 其他开发命令

```bash
# 代码生成（模型/路由/权限/Seed 注册文件）
bun run gen:registry

# 代码格式化
bun run format

# 文档开发
bun run dev:docs

# 文档构建
bun run docs:build
```

## 🗄️ 数据库切换

默认使用 SQLite，如需切换到 MySQL 或 PostgreSQL，请参考 [环境配置](/deploy/env) 文档修改数据库连接字符串。

## ❓ 常见问题

### 端口被占用

如果 3000 端口被占用，可通过环境变量修改：

```bash
PORT=3001 bun run dev:backend
```

### 依赖安装失败

尝试清理缓存后重新安装：

```bash
rm -rf node_modules
bun install
```

### SQLite 数据丢失

SQLite 数据文件在 `data/` 目录，确保该目录不被 `.gitignore` 排除（默认已包含在版本控制中）。生产环境建议使用 Docker 卷挂载持久化。
