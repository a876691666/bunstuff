# 快速开始

## 环境要求

| 工具 | 版本 |
|------|------|
| [Bun](https://bun.sh) | >= 1.0 |
| [Node.js](https://nodejs.org)（可选，前端构建） | >= 18 |

## 安装

```bash
# 克隆项目
git clone <repository-url> bunstuff
cd bunstuff

# 安装根依赖
bun install

# 安装后端依赖
cd backend && bun install && cd ..

# 安装前端依赖（管理端）
cd frontend && bun install && cd ..

# 安装客户端依赖
cd client && bun install && cd ..
```

## 启动开发

### 一键启动

在项目根目录执行，将同时启动后端、管理端前端和客户端：

```bash
bun run dev
```

### 分别启动

```bash
# 仅后端
bun run dev:backend    # 端口 3000

# 仅管理端前端
bun run dev:frontend   # 端口 5173

# 仅客户端
bun run dev:client     # 端口 5174
```

## 访问地址

| 服务 | 地址 |
|------|------|
| 后端 API | `http://localhost:3000/api` |
| OpenAPI 文档 | `http://localhost:3000/api/openapi` |
| 管理端 | `http://localhost:5173/_admin` |
| 客户端 | `http://localhost:5174` |

## 默认账号

系统首次启动时会自动执行种子数据（Seed），创建以下默认账号：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 超级管理员 | admin | admin123 |

::: warning 安全提示
生产环境部署后请立即修改默认密码！
:::

## 数据库

默认使用 **SQLite**，数据文件位于 `backend/data/myapp.db`，无需额外配置。

如需切换到 MySQL 或 PostgreSQL，修改 `backend/models/main.ts` 中的数据库连接字符串：

```typescript
// SQLite（默认）
export const db = new DB('sqlite://data/myapp.db')

// MySQL
export const db = new DB('mysql://user:password@localhost:3306/bunstuff')

// PostgreSQL
export const db = new DB('postgres://user:password@localhost:5432/bunstuff')
```

## 下一步

- 阅读 [项目结构](./structure) 了解代码组织
- 阅读 [架构设计](./architecture) 理解核心设计理念
- 查看 [后端模块](../backend/) 了解各功能模块
