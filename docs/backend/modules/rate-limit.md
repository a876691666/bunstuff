# API 限流

## 概述

限流模块提供多种 API 限流策略和 IP 封禁机制。位于 `modules/system/rate-limit/`。

## 限流模式

### 时间窗口限流

固定时间窗口内限制最大请求数：

```
窗口: 60秒，最大: 100次
→ 每 60 秒重置计数器
→ 超过 100 次返回 429
```

### 并发限流

限制同时处理的请求数：

```
最大并发: 10
→ 同时处理超过 10 个请求时拒绝新请求
→ 请求完成后释放并发位
```

### 滑动窗口限流

滑动时间窗口，更精确的流量控制。

## RateLimitRule 模型

| 字段 | 说明 |
|------|------|
| name | 规则名称 |
| code | 规则编码（unique） |
| mode | 限流模式（window/concurrent/sliding） |
| pathPattern | 匹配路径模式（支持通配符） |
| method | HTTP 方法（* 表示全部） |
| dimension | 限流维度（ip/user/global） |
| windowSeconds | 时间窗口（秒） |
| maxRequests | 窗口内最大请求数 |
| maxConcurrent | 最大并发数 |
| blacklistThreshold | 黑名单阈值（超过自动封禁） |
| responseCode | 限流响应码 |
| responseMessage | 限流响应消息 |
| priority | 优先级（越小越优先） |
| status | 状态 |

## IP 黑名单

### 自动封禁

当 IP 在单位时间内超过 `blacklistThreshold` 次触发限流，自动加入黑名单。

### IpBlacklist 模型

| 字段 | 说明 |
|------|------|
| ip | IP 地址 |
| reason | 封禁原因 |
| expireAt | 过期时间（null=永久） |
| status | 状态 |

## 工作流程

```
请求进入
  → 检查 IP 黑名单
    → 命中？返回 403
  → 匹配限流规则（按优先级）
    → 无匹配？放行
    → 有匹配？检查限流
      → 未超限？放行 + 计数
      → 超限？
        → 超过黑名单阈值？自动封禁 IP
        → 返回 429
```

## 缓存策略

- 限流规则启动时加载到内存
- 计数器在内存中维护
- 规则变更时自动刷新

## 管理端 API

### 限流规则

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/api/admin/rate-limit` | `rate-limit:admin:list` |
| POST | `/api/admin/rate-limit` | `rate-limit:admin:create` |
| PUT | `/api/admin/rate-limit/:id` | `rate-limit:admin:update` |
| DELETE | `/api/admin/rate-limit/:id` | `rate-limit:admin:delete` |

### IP 黑名单

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/api/admin/ip-blacklist` | `ip-blacklist:admin:list` |
| POST | `/api/admin/ip-blacklist` | `ip-blacklist:admin:create` |
| DELETE | `/api/admin/ip-blacklist/:id` | `ip-blacklist:admin:delete` |
