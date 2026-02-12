# VIP 会员

## 概述

VIP 模块提供会员等级管理、资源配额限制和用量追踪功能。位于 `modules/vip/`。

## vipPlugin

通过 `derive` 注入 VIP 相关工具函数：

```typescript
import { vipPlugin } from '@/modules/vip/plugin'

const api = new Elysia()
  .use(authPlugin())
  .use(vipPlugin())
  .post('/upload', async (ctx) => {
    // 检查是否可以使用资源
    if (!ctx.canUseResource('storage', 1)) {
      return R.forbidden()
    }
    // 使用资源
    await ctx.incrementResource('storage', 1)
    // ... 上传逻辑
  })
```

### 注入方法

| 方法 | 说明 |
|------|------|
| `vipTierId` | 当前用户 VIP 等级 ID |
| `vipTierCode` | VIP 等级编码 |
| `isValidVip` | 是否为有效 VIP |
| `canUseResource(type, amount)` | 检查资源配额是否充足 |
| `incrementResource(type, amount)` | 增加资源使用量 |
| `decrementResource(type, amount)` | 减少资源使用量 |
| `getResourceUsage(type)` | 获取资源使用情况 |

## 数据模型

### VipTier（VIP 等级）

| 字段 | 说明 |
|------|------|
| name | 等级名称 |
| code | 等级编码（unique） |
| roleId | 关联角色 ID |
| price | 价格 |
| durationDays | 有效天数 |
| status | 状态 |
| description | 描述 |

### VipResourceLimit（资源限制）

定义每个 VIP 等级对各类资源的配额限制。

### UserVip（用户 VIP）

用户的 VIP 绑定记录，包含开通时间和过期时间。

### UserResourceUsage（资源用量）

跟踪每个用户对各类资源的使用量。

## 管理端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/vip/tier` | VIP 等级列表 |
| POST | `/api/admin/vip/tier` | 创建 VIP 等级 |
| PUT | `/api/admin/vip/tier/:id` | 更新 VIP 等级 |
| DELETE | `/api/admin/vip/tier/:id` | 删除 VIP 等级 |
| GET | `/api/admin/vip/resource-limit` | 资源限制列表 |
| GET | `/api/admin/vip/user-vip` | 用户 VIP 列表 |
