# 限流与黑名单

限流模块作为全局中间件运行，提供多维度限流策略和自动 IP 封禁机制。

## 🎯 功能概述

| 功能 | 说明 |
|------|------|
| **IP 黑名单** | 优先拦截已封禁 IP |
| **多模式限流** | 时间窗口 / 滑动窗口 / 并发数 |
| **多维度** | 按 IP / 用户 / 全局 |
| **自动封禁** | 触发阈值后自动拉黑 IP |
| **白名单放行** | 本地 IP 和超级管理员免检 |
| **缓存驱动** | 规则和黑名单全量缓存 |

## 🔌 rateLimitPlugin

`rateLimitPlugin` 注册为全局 `onBeforeHandle` 中间件，每次请求自动执行限流检查。

### 处理流程

```
请求进入
 ├─ 白名单 IP？→ 放行
 ├─ Bearer Token 含超管角色？→ 放行
 ├─ IP 在黑名单中？→ 返回 403
 ├─ 遍历限流规则（按优先级排序）
 │   ├─ 匹配路径和方法？
 │   ├─ 根据维度构建 key（ip / user / global）
 │   ├─ 根据模式检查（time_window / sliding_window / concurrent）
 │   └─ 不通过？→ 检查是否自动封禁 → 返回 429
 └─ 放行
```

### 注入上下文

| 方法 | 说明 |
|------|------|
| `rateLimit.getClientIp()` | 获取当前请求的客户端 IP |
| `rateLimit.getRateLimitStats()` | 获取限流计数器统计 |

## 📋 限流模式

### 时间窗口（time_window）

固定时间窗口内限制最大请求数。窗口到期后重置计数。

```
窗口 60 秒，限 100 次
[0s ─── 请求 1~100 ──── 60s] → 重置 → [60s ─── 请求 1~100 ──── 120s]
```

### 滑动窗口（sliding_window）

加权计算前一窗口的剩余请求，更平滑地过渡。

```
估算数 = 前窗口请求数 × (1 - 已过比例) + 当前窗口请求数
```

### 并发限制（concurrent）

限制同时进行的请求数。`onBeforeHandle` 加 1，`onAfterHandle` 减 1。

## 📋 限流维度

| 维度 | key 构成 | 说明 |
|------|---------|------|
| `ip` | `规则code:客户端IP` | 按 IP 独立计数 |
| `user` | `规则code:用户ID` | 按用户独立计数 |
| `global` | `规则code:global` | 全局共享计数 |

## 🗄️ 数据模型

### RateLimitRule（限流规则）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `number` | 主键 |
| `name` | `string` | 规则名称 |
| `code` | `string` | 规则编码（唯一） |
| `pathPattern` | `string` | 路径匹配模式，支持 `*` 和 `**` |
| `method` | `string` | HTTP 方法，`*` 匹配全部 |
| `mode` | `string` | 限流模式 |
| `dimension` | `string` | 限流维度 |
| `windowSeconds` | `number` | 时间窗口（秒） |
| `maxRequests` | `number` | 最大请求数 |
| `maxConcurrent` | `number` | 最大并发数 |
| `blacklistThreshold` | `number` | 自动封禁阈值（0 禁用） |
| `responseCode` | `number` | 响应码，默认 429 |
| `responseMessage` | `string` | 响应消息 |
| `priority` | `number` | 优先级（越小越先匹配） |
| `status` | `0 \| 1` | 启用状态 |

### IpBlacklist（IP 黑名单）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `number` | 主键 |
| `ip` | `string` | 封禁 IP |
| `reason` | `string` | 封禁原因 |
| `source` | `string` | 来源：`auto` / `manual` |
| `ruleId` | `number` | 触发规则 ID |
| `triggerCount` | `number` | 触发次数 |
| `expireAt` | `Date` | 过期时间（自动封禁默认 24h） |
| `status` | `0 \| 1` | 状态 |

## 📡 API 接口

### 限流规则

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/admin/rate-limit` | 规则列表 | `rateLimit:admin:list` |
| `POST` | `/api/admin/rate-limit` | 创建规则 | `rateLimit:admin:create` |
| `PUT` | `/api/admin/rate-limit/:id` | 更新规则 | `rateLimit:admin:update` |
| `DELETE` | `/api/admin/rate-limit/:id` | 删除规则 | `rateLimit:admin:delete` |
| `POST` | `/api/admin/rate-limit/refresh` | 刷新缓存 | `rateLimit:admin:update` |

### IP 黑名单

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/admin/ip-blacklist` | 黑名单列表 | `ipBlacklist:admin:list` |
| `POST` | `/api/admin/ip-blacklist` | 添加黑名单 | `ipBlacklist:admin:create` |
| `PUT` | `/api/admin/ip-blacklist/:id` | 更新黑名单 | `ipBlacklist:admin:update` |
| `DELETE` | `/api/admin/ip-blacklist/:id` | 删除黑名单 | `ipBlacklist:admin:delete` |
| `POST` | `/api/admin/ip-blacklist/:id/unblock` | 解封 IP | `ipBlacklist:admin:update` |

## 🛡️ 白名单机制

::: tip 免检白名单
以下请求不会经过限流检查：
- **本地 IP**：`127.0.0.1`、`localhost`、`::1`、`::ffff:127.0.0.1`
- **超级管理员**：Bearer Token 中角色为 `super-admin`
:::

## ⚙️ 路径匹配语法

| 模式 | 说明 | 示例 |
|------|------|------|
| `/api/admin/users` | 精确匹配 | 仅匹配该路径 |
| `/api/admin/*` | 单层通配 | 匹配 `/api/admin/users` 但不匹配 `/api/admin/users/1` |
| `/api/**` | 多层通配 | 匹配 `/api/` 下所有路径 |
| `/**` | 全部匹配 | 匹配所有请求 |
