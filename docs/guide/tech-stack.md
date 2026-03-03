# 技术栈

Bunstuff 采用现代化技术栈，注重性能和开发体验。本章节详细介绍项目使用的各项技术。

## 📊 技术栈总览

| 层次 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **运行时** | Bun | >= 1.0 | JS/TS 运行时、包管理器、打包器 |
| **后端框架** | Elysia | 1.4.x | HTTP 框架、类型安全路由 |
| **数据库** | SQLite / MySQL / PostgreSQL | — | 数据持久化 |
| **ORM** | 自研 `@pkg/orm` | — | 数据库操作、Schema 生成 |
| **查询语言** | 自研 `@pkg/ssql` | — | 类型安全条件构建 |
| **权限引擎** | Casbin | 5.49.x | RBAC 策略引擎 |
| **管理端** | Vue 3 + Naive UI | 3.5.x | 后台管理界面 |
| **客户端** | Vue 3 | 3.5.x | C 端应用 |
| **状态管理** | Pinia | 最新 | 前端状态管理 |
| **构建工具** | Vite | 最新 | 前端构建 |
| **定时任务** | Croner | 10.0.x | Cron 调度引擎 |
| **模板引擎** | VelocityJS | 2.1.x | 数据权限模板 |
| **容器化** | Docker | — | 部署运维 |

## ⚡ Bun 运行时

Bunstuff 的核心运行时是 [Bun](https://bun.sh/)，一个高性能的 JavaScript/TypeScript 运行时。

### 为什么选择 Bun？

| 能力 | Node.js | Bun | 优势 |
|------|---------|-----|------|
| 启动速度 | ~300ms | ~50ms | **6 倍提升** |
| HTTP 吞吐量 | ~65,000 req/s | ~150,000 req/s | **2.3 倍提升** |
| 包安装速度 | npm ~30s | bun ~3s | **10 倍提升** |
| 原生 TypeScript | ❌ 需要 ts-node | ✅ 原生支持 | 零配置 |
| 原生 SQLite | ❌ 需要依赖 | ✅ 内置 `bun:sqlite` | 零依赖 |
| 密码哈希 | ❌ 需要 bcrypt | ✅ `Bun.password` | 原生 Argon2 |
| 打包构建 | webpack/esbuild | ✅ `Bun.build()` | 内置打包器 |

### Bun 在项目中的应用

```typescript
// 1. 原生 SQLite 驱动
import { Database } from 'bun:sqlite'

// 2. 内置密码哈希（Argon2）
const hash = await Bun.password.hash('password')
const isValid = await Bun.password.verify('password', hash)

// 3. 内置打包器
await Bun.build({ entrypoints: ['./index.ts'], outdir: './build' })

// 4. 原生文件操作
const file = Bun.file('./path/to/file')
await Bun.write('./output', content)
```

## 🦊 Elysia 框架

[Elysia](https://elysiajs.com/) 是专为 Bun 优化的 TypeScript HTTP 框架。

### 核心优势

| 特性 | 说明 |
|------|------|
| **端到端类型安全** | 路由参数、请求体、响应全部类型推导 |
| **自动 OpenAPI** | 基于 TypeBox Schema 自动生成 API 文档 |
| **插件系统** | `derive` / `onBeforeHandle` 注入上下文 |
| **生命周期钩子** | `onRequest` → `onParse` → `onBeforeHandle` → `onAfterHandle` → `onError` |
| **性能** | 基于 Bun HTTP 服务器，吞吐量极高 |

### 在项目中的应用

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
  .get('/api/users', ({ query }) => {
    // query 类型自动推导
    return service.findAll(query)
  }, {
    query: t.Object({
      page: t.Optional(t.Number()),
      size: t.Optional(t.Number()),
      filter: t.Optional(t.String()),
    }),
    response: {
      200: PagedResponse(UserSchema),
    },
    detail: {
      tags: ['管理 - 用户'],
      security: [{ bearerAuth: [] }],
      operLog: { title: '用户管理', type: 'list' },
    },
  })
```

## 🗄️ 数据库

### 多数据库支持

| 数据库 | 适用场景 | 特点 |
|--------|---------|------|
| **SQLite** | 开发环境、小型应用 | 零配置、内置于 Bun、文件存储 |
| **MySQL** | 生产环境 | 广泛使用、生态成熟 |
| **PostgreSQL** | 生产环境 | 功能丰富、性能优秀 |

### 自研 ORM (`@pkg/orm`)

```typescript
// 定义 Schema
class UserSchema extends TimestampSchema {
  tableName = 'users'
  username = column.string().unique().description('用户名')
  password = column.string().description('密码')
  roleId = column.string().nullable().description('角色ID')
}

// 创建 Model
const UserModel = db.model(UserSchema)

// 类型安全的 CRUD
const users = UserModel.findMany({ where: 'status = 1' })
const user = UserModel.findById(1)
UserModel.create({ username: 'test', password: hash })
```

> 📖 详细文档请查看 [ORM 包](/packages/orm)。

## 🔐 权限引擎

基于 [Casbin](https://casbin.org/) 实现 RBAC 权限控制：

| 组件 | 用途 |
|------|------|
| **Casbin** | 策略引擎，评估权限规则 |
| **VelocityJS** | 数据权限模板渲染（`$auth.userId` 等变量） |
| **SSQL** | 行级数据过滤条件生成 |

## 💻 前端技术栈

### 管理端

| 技术 | 用途 |
|------|------|
| **Vue 3** | 组合式 API，响应式编程 |
| **Naive UI** | 企业级 UI 组件库 |
| **Pinia** | 状态管理（authStore） |
| **Vue Router** | 路由管理，支持动态路由 |
| **Vite** | 构建工具，HMR 热更新 |

### 客户端

| 技术 | 用途 |
|------|------|
| **Vue 3** | 极简应用框架 |
| **Vue Router** | 路由管理 |
| **Vite** | 构建工具 |

## 🔧 开发工具链

| 工具 | 用途 |
|------|------|
| **TypeScript** | 类型安全 |
| **Prettier** | 代码格式化 |
| **VitePress** | 文档站点 |
| **Docker** | 容器化部署 |

## 🔗 相关链接

- [Bun 官网](https://bun.sh/)
- [Elysia 官网](https://elysiajs.com/)
- [Casbin 官网](https://casbin.org/)
- [Vue 3 文档](https://vuejs.org/)
- [Naive UI 文档](https://www.naiveui.com/)
- [Pinia 文档](https://pinia.vuejs.org/)
