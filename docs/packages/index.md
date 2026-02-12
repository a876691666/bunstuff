# 自研包总览

## 概述

Bunstuff 包含三个自研工具包，位于 `backend/packages/`：

| 包 | 路径别名 | 说明 |
|----|---------|------|
| [ORM](./orm) | `@pkg/orm` | 轻量级类型安全 ORM |
| [SSQL](./ssql) | `@pkg/ssql` | SQL 条件查询构建器 |
| [Route Model](./route-model) | `@/packages/route-model` | 路由 Schema 工具 |

## 设计原则

1. **零外部依赖** — 不引入额外 npm 包
2. **类型安全** — 完整的 TypeScript 类型推导
3. **轻量高效** — 最小化抽象层
4. **前后端共用** — SSQL 同时用于前后端

## 依赖关系

```
ORM
  ├── 使用 SSQL 进行条件查询
  └── 生成 TypeBox Schema（用于路由校验）

SSQL
  ├── 后端：Model 内部条件编译
  └── 前端：构建过滤条件字符串

Route Model
  ├── 使用 ORM 的 Schema 类生成 TypeBox
  └── 为 Elysia 路由提供标准 Schema
```
