# 自研包总览

Bunstuff 包含三个自研包，位于 `backend/packages/` 目录，为整个系统提供基础能力。

## 📦 包列表

| 包 | 目录 | 说明 |
|------|------|------|
| `@pkg/orm` | `packages/orm/` | 轻量 ORM，支持 SQLite / MySQL / PostgreSQL |
| `@pkg/ssql` | `packages/ssql/` | 安全 SQL 查询 DSL，防注入 |
| `@pkg/route-model` | `packages/route-model/` | Elysia 路由 Schema 工具集 |

## 🔗 依赖关系

```
@pkg/route-model
  └── @pkg/orm
        └── @pkg/ssql
```

- `@pkg/ssql` 是最底层包，提供 SQL 方言和查询解析
- `@pkg/orm` 依赖 SSQL 方言能力，构建跨数据库 ORM
- `@pkg/route-model` 依赖 ORM 的 Schema 定义，生成路由类型

## 🎯 设计理念

| 原则 | 说明 |
|------|------|
| **零外部依赖** | 三个包均无第三方运行时依赖 |
| **类型安全** | 全程 TypeScript，完整类型推导 |
| **跨数据库** | 同一套 API 适配 SQLite / MySQL / PostgreSQL |
| **前后端统一** | SSQL 语法在前端 Builder 和后端 Parser 间保持一致 |
