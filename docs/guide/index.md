# 项目简介

## 什么是 Bunstuff？

**Bunstuff** 是一个基于 **Bun + Elysia** 构建的全栈后台管理系统模板，旨在提供一套开箱即用、规范统一、可高度定制的中后台解决方案。

## 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| **运行时** | [Bun](https://bun.sh) | 高性能 JavaScript 运行时，内置包管理器与打包器 |
| **后端框架** | [Elysia](https://elysiajs.com) | TypeBox 端到端类型安全，自动生成 OpenAPI 文档 |
| **前端框架** | Vue 3 + Naive UI | Composition API + 企业级 UI 组件库 |
| **状态管理** | Pinia | Vue 官方推荐状态管理 |
| **路由** | Vue Router | 动态路由，基于后端菜单自动生成 |
| **数据库** | SQLite / MySQL / PostgreSQL | 默认 SQLite 零配置，生产可切换 |
| **ORM** | `@pkg/orm`（自研） | 轻量级、类型安全的 ORM |
| **查询构建** | `@pkg/ssql`（自研） | SQL 条件构建器，支持前后端共用 |

## 核心特性

### 🔐 完整权限体系

- **RBAC 模型**：角色 → 权限 → 菜单 三级关联
- **数据权限**：基于 SSQL 规则的行级数据过滤（DataScope）
- **Session Token**：内存 + 数据库双存储，24h 过期自动清理
- **API 限流**：时间窗口 / 并发 / 滑动窗口三种模式
- **IP 黑名单**：异常请求自动封禁

### 📦 丰富功能模块

- 用户管理、角色管理、菜单管理、权限管理
- 字典管理、参数配置
- 文件管理（本地 + S3）
- 通知公告（SSE 实时推送）
- 定时任务（Cron 调度）
- 登录日志、操作日志
- VIP 会员体系
- 动态 CRUD（数据库驱动表配置）

### 🧩 插件化架构

所有功能模块均以 Elysia 插件形式组织，可独立使用或组合：

```
authPlugin()     → 认证与会话
rbacPlugin()     → 权限校验
vipPlugin()      → VIP 会员
filePlugin()     → 文件操作
noticePlugin()   → 通知推送
dictPlugin()     → 字典数据
configPlugin()   → 参数配置
loginLogPlugin() → 登录日志
operLogPlugin()  → 操作日志
```

### 🎨 管理端前端

- Naive UI 企业级组件
- 动态菜单路由
- 通用 CRUD 组件（PageTable / FormModal / SearchForm）
- 组合式函数封装（useTable / useModal / useDict）
- 前端 SSQL Builder 构建查询条件

## 项目定位

Bunstuff 不是框架，而是一个**可即刻投入使用的项目模板**。你可以：

1. **直接使用** — 作为后台管理系统的基础，在此之上添加业务模块
2. **学习参考** — 了解 Bun + Elysia 全栈开发的最佳实践
3. **裁剪定制** — 移除不需要的模块，保留核心功能
