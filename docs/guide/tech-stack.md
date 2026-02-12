# 技术栈

## 运行时与语言

### Bun

[Bun](https://bun.sh) 是一个高性能的 JavaScript 运行时，内置了包管理器、打包器和测试运行器。本项目全面使用 Bun 作为后端运行时和工具链：

- **运行时**：替代 Node.js 运行后端服务
- **包管理器**：替代 npm/yarn/pnpm
- **打包器**：`Bun.build` 将后端编译为单文件
- **密码哈希**：`Bun.password.hash` / `Bun.password.verify`（内置 argon2/bcrypt）
- **文件操作**：`Bun.file` / `Bun.write`
- **SQLite**：`bun:sqlite`（内置原生 SQLite 驱动）

### TypeScript

全栈 TypeScript 开发，前后端共享类型安全。

## 后端技术

### Elysia

[Elysia](https://elysiajs.com) 是专为 Bun 设计的 Web 框架，核心特性：

- **TypeBox 校验**：编译期类型推导 + 运行时自动校验
- **OpenAPI 文档**：自动生成 Swagger 文档
- **插件系统**：声明式插件组合
- **生命周期钩子**：`onBeforeHandle` / `derive` / `onAfterHandle` / `onError`
- **端到端类型安全**：从路由定义到响应类型完全推导

```typescript
new Elysia()
  .get('/users', () => userService.findAll(), {
    query: t.Object({ page: t.Number() }),
    response: { 200: PagedResponse(UserSchema) },
    detail: {
      tags: ['用户管理'],
      rbac: { scope: { permissions: ['user:list'] } },
    },
  })
```

### 自研 ORM（@pkg/orm）

轻量级 ORM，支持 SQLite / MySQL / PostgreSQL：

- 链式 Schema 定义
- 自动表同步（建表/迁移）
- TypeBox Schema 生成（`Model.getSchema()`）
- 类型安全的 CRUD 操作

### 自研 SSQL（@pkg/ssql）

SQL 条件构建器，前后端共用：

- 类 SQL 语法的字符串查询
- AST 解析和编译
- 多方言支持
- 防注入安全设计

### Croner

Cron 表达式调度器，用于定时任务模块。

### VelocityJS

模板引擎，用于数据权限规则中的变量渲染。

## 前端技术

### Vue 3

Composition API + `<script setup>` 语法，组件化开发。

### Naive UI

企业级 Vue 3 组件库，提供丰富的 UI 组件：

- Data Table（数据表格）
- Form / FormItem（表单）
- Modal / Drawer（弹窗/抽屉）
- Menu / Breadcrumb（菜单/面包屑）
- Tree / TreeSelect（树形选择）
- Message / Notification（消息/通知）

### Pinia

Vue 官方推荐的状态管理库，用于管理：

- 用户认证状态（authStore）
- 全局应用状态

### Vue Router

前端路由，支持：

- 静态路由（登录、404 等固定页面）
- 动态路由（基于后端菜单树自动生成）
- 路由守卫（认证检查）

### Vite

前端构建工具：

- 极速 HMR
- 开发代理（`/api` 代理到后端）
- 生产构建优化

## 数据库

### SQLite（默认）

- 零配置，文件级数据库
- 通过 `bun:sqlite` 内置驱动连接
- 适合开发和中小规模部署

### MySQL / PostgreSQL

- 生产环境推荐
- 切换只需修改连接字符串
- ORM 自动适配 SQL 方言

## 部署技术

### Docker

- 多阶段构建（deps → build → runtime）
- 基于 `oven/bun:1-slim` 镜像
- 非 root 用户运行
- 健康检查配置

### Docker Compose

- 卷挂载（数据持久化、静态资源）
- 环境变量配置
- 一键部署
