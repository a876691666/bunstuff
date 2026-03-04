# 💎 VIP 会员

VIP 模块提供会员等级管理、资源配额控制、用户 VIP 绑定和资源使用量追踪能力。

## 📖 模块概览

| 组件                | 路径                                   | 说明                               |
| ------------------- | -------------------------------------- | ---------------------------------- |
| `vipPlugin`         | `plugins/vip.ts`                       | 全局 VIP 中间件，注入 `vip` 上下文 |
| `VipService`        | `services/vip.ts`                      | VIP 等级、资源限制、用户 VIP 管理  |
| `VipTier`           | `models/vip-tier/schema.ts`            | VIP 等级模型                       |
| `VipResourceLimit`  | `models/vip-resource-limit/schema.ts`  | 资源限制模型                       |
| `UserVip`           | `models/user-vip/schema.ts`            | 用户 VIP 绑定模型                  |
| `UserResourceUsage` | `models/user-resource-usage/schema.ts` | 资源使用量模型                     |

## 🗃️ 数据模型

### VipTier - VIP 等级

```typescript
class VipTierSchema extends TimestampSchema {
  id = column.number().primaryKey().autoIncrement() // 等级 ID
  name = column.string().default('') // 等级名称
  code = column.string().unique().default('') // 等级代码（唯一标识）
  roleId = column.string().nullable() // 绑定角色编码
  price = column.number().default(0) // 价格
  durationDays = column.number().default(0) // 有效期天数（0=永久）
  status = VipTierSchema.status(1) // 状态：1启用 0禁用
  description = column.string().nullable() // 描述
}
```

### VipResourceLimit - 资源限制

```typescript
class VipResourceLimitSchema extends TimestampSchema {
  id = column.number().primaryKey().autoIncrement() // ID
  vipTierId = column.number().default(0) // VIP 等级 ID
  resourceKey = column.string().default('') // 资源键
  limitValue = column.number().default(-1) // 限制值（-1=无限）
  description = column.string().nullable() // 描述
}
```

### UserVip - 用户 VIP 绑定

```typescript
class UserVipSchema extends TimestampSchema {
  id = column.number().primaryKey().autoIncrement() // ID
  userId = column.number().default(0) // 用户 ID
  vipTierId = column.number().default(0) // VIP 等级 ID
  expireTime = column.date().nullable() // 过期时间（null=永久）
  status = UserVipSchema.status(1) // 状态：1启用 0禁用
  bindingStatus = column.number().default(0) // 绑定状态：0待确认 1已确认
  originalRoleId = column.string().nullable() // 原角色 ID（用于回滚）
}
```

### UserResourceUsage - 资源使用量

```typescript
class UserResourceUsageSchema extends TimestampSchema {
  id = column.number().primaryKey().autoIncrement() // ID
  userId = column.number().default(0) // 用户 ID
  resourceKey = column.string().default('') // 资源键
  usageCount = column.number().default(0) // 已使用数量
}
```

### 模型关系图

```
┌──────────┐     ┌──────────────────┐
│ VipTier  │────<│ VipResourceLimit │
│ (等级)    │     │ (资源限制)        │
└──────┬───┘     └──────────────────┘
       │
       │  1:N
       │
┌──────┴───┐     ┌────────────────────┐
│ UserVip  │     │ UserResourceUsage  │
│ (绑定)    │     │ (使用量)            │
└──────┬───┘     └──────────┬─────────┘
       │                     │
       └──── User ──────────┘
```

## 🔌 vipPlugin VIP 插件

`vipPlugin` 在 `authPlugin` 之后执行，自动加载用户的 VIP 信息并注入到请求上下文。

### 注入上下文

```typescript
interface VipContext {
  vipTierId: number | null // VIP 等级 ID
  vipTierCode: string | null // VIP 等级代码
  bindingStatus: number // 绑定状态
  isValidVip: boolean // 是否有效 VIP

  /** 检查是否可使用指定资源 */
  canUseResource(resourceKey: string, amount?: number): Promise<boolean>
  /** 增加资源使用量 */
  incrementResource(resourceKey: string, amount?: number): Promise<void>
  /** 减少资源使用量 */
  decrementResource(resourceKey: string, amount?: number): Promise<void>
  /** 获取资源使用详情 */
  getResourceUsage(resourceKey: string): Promise<{
    currentUsage: number
    limitValue: number
    available: number
    canUse: boolean
  }>
}
```

### VIP 检查流程

```
请求进入（userId 已由 authPlugin 注入）
  │
  ├─ derive 阶段
  │   ├─ 无 userId → vip = 默认空上下文
  │   ├─ 查询 UserVip: userId + status=1
  │   ├─ 无有效 VIP 或 bindingStatus ≠ 1 → vip = 默认空上下文
  │   ├─ 检查是否过期 → 已过期 → vip = 默认空上下文
  │   └─ 有效 → 构建完整 VipContext
  │
  └─ onBeforeHandle 阶段
      ├─ 读取 detail.vip.scope 配置
      ├─ 若无 scope → 放行
      ├─ scope.required=true 且 isValidVip=false → 403
      └─ scope.vipTier 指定等级 → 检查用户等级匹配 → 不匹配 403
```

### 路由配置

```typescript
// 要求任意有效 VIP
app.get('/pro-feature', handler, {
  detail: {
    vip: { scope: { required: true } },
  },
})

// 要求指定 VIP 等级
app.get('/premium-feature', handler, {
  detail: {
    vip: { scope: { vipTier: 'premium' } },
  },
})

// 无 VIP 要求（默认），但可读取 VIP 信息
app.get('/normal', ({ vip }) => {
  if (vip.isValidVip) {
    // 给 VIP 用户额外功能
  }
})
```

## 🔧 VIP 工作流

### 1. 配置 VIP 等级和资源

```
管理员创建 VIP 等级
  │
  ├─ VipTier: { code: 'pro', name: '专业版', price: 99, durationDays: 30, roleId: 'vip' }
  │
  └─ VipResourceLimit:
      ├─ { resourceKey: 'api:call', limitValue: 1000, description: 'API 调用次数' }
      ├─ { resourceKey: 'storage:mb', limitValue: 500, description: '存储空间(MB)' }
      └─ { resourceKey: 'export:daily', limitValue: 50, description: '每日导出次数' }
```

### 2. 用户开通/升级 VIP

```typescript
// 标准开通（需要用户确认绑定）
await vipService.upgradeUserVip(userId, 'pro', {
  expireTime: '2026-12-31', // 可选，不传则按 durationDays 计算
})

// 直接开通（跳过确认，立即生效）
await vipService.upgradeUserVipDirect(userId, 'pro')
```

**开通流程：**

```
upgradeUserVip(userId, 'pro')
  │
  ├─ 查找 VipTier by code
  ├─ 检查等级状态（必须启用）
  ├─ 查找用户（必须存在）
  │
  ├─ 计算过期时间：
  │   ├─ 指定 expireTime → 直接使用
  │   ├─ durationDays > 0 → now + durationDays
  │   └─ durationDays = 0 → null（永久）
  │
  ├─ 若有旧 VIP → 设为 status=0
  │
  ├─ 创建 UserVip 记录:
  │   ├─ bindingStatus = 0（待确认）
  │   └─ originalRoleId = 用户当前角色
  │
  └─ 触发 bindingCallback（如已设置）
```

### 3. 确认 VIP 绑定

```typescript
// 确认绑定 → 切换用户角色到 VIP 角色
await vipService.confirmVipBinding(userVipId, true)

// 取消绑定 → 恢复原角色
await vipService.confirmVipBinding(userVipId, false)
```

:::tip 绑定确认机制
两步确认机制适用于需要用户明确同意角色切换的场景。VIP 等级可能绑定不同的角色编码，切换角色会影响用户权限。使用 `upgradeUserVipDirect()` 可以跳过确认直接生效。
:::

### 4. 资源检查与消耗

```typescript
app.post('/api/export', async ({ vip, userId }) => {
  // 检查是否可以使用资源
  const canExport = await vip.canUseResource('export:daily')
  if (!canExport) {
    return R.forbidden('今日导出次数已用完')
  }

  // 执行业务逻辑...
  await doExport()

  // 消耗资源
  await vip.incrementResource('export:daily', 1)

  return R.success('导出成功')
})
```

### 5. 查看资源使用情况

```typescript
const usage = await vip.getResourceUsage('api:call')
// {
//   currentUsage: 342,
//   limitValue: 1000,
//   available: 658,
//   canUse: true
// }
```

## 📊 资源配额机制

### 配额检查逻辑

```typescript
async function checkResourceUsage(userId, resourceKey, amount = 1) {
  // 1. 获取用户 VIP 信息
  const userVip = await getUserVip(userId)
  if (!userVip || userVip.bindingStatus !== 1) {
    return { canUse: false, ... }
  }

  // 2. 查找资源限制配置
  const resourceLimit = userVip.resourceLimits
    ?.find(r => r.resourceKey === resourceKey)
  const limitValue = resourceLimit?.limitValue ?? 0

  // 3. 无限制
  if (limitValue === -1) {
    return { canUse: true, available: -1, ... }
  }

  // 4. 查询当前使用量
  const usage = await UserResourceUsage.findOne({ ... })
  const currentUsage = usage?.usageCount ?? 0
  const available = limitValue - currentUsage

  return { currentUsage, limitValue, available, canUse: available >= amount }
}
```

### 特殊值含义

| limitValue | 含义                   |
| ---------- | ---------------------- |
| `-1`       | 无限制（不检查使用量） |
| `0`        | 禁止使用               |
| `> 0`      | 允许的最大使用量       |

### 资源键命名约定

```
<模块>:<操作>

示例:
  api:call          - API 调用次数
  storage:mb        - 存储空间 (MB)
  export:daily      - 每日导出次数
  scene:create      - 场景创建数量
  upload:file       - 文件上传数量
```

## 🔄 取消 VIP

```typescript
await vipService.cancelUserVip(userId)
```

**取消流程：**

```
cancelUserVip(userId)
  │
  ├─ 查找活跃 UserVip: userId + status=1
  ├─ 设置 status=0
  ├─ 恢复用户原角色（originalRoleId）
  └─ 触发 bindingCallback (action: 'unbind')
```

## 🔗 绑定回调

系统支持设置全局绑定回调函数，在 VIP 状态变更时触发：

```typescript
import { setBindingCallback } from '@/services/vip'

setBindingCallback(async ({ userId, userVipId, vipTierId, roleId, originalRoleId, action }) => {
  switch (action) {
    case 'bind': // 开通 VIP（待确认）
      await sendNotification(userId, '您已开通 VIP，请确认绑定')
      break
    case 'confirm': // 确认绑定
      await sendNotification(userId, 'VIP 绑定成功')
      break
    case 'cancel': // 取消绑定
      await sendNotification(userId, 'VIP 绑定已取消')
      break
    case 'unbind': // 取消 VIP
      await sendNotification(userId, 'VIP 已取消')
      break
  }
})
```

## 🌐 Admin API 接口

### VIP 等级管理

| 方法     | 路径        | 说明                 | 权限                    |
| -------- | ----------- | -------------------- | ----------------------- |
| `GET`    | `/tier`     | 获取等级列表（分页） | `vip:admin:tier:list`   |
| `GET`    | `/tier/:id` | 获取等级详情         | `vip:admin:tier:read`   |
| `POST`   | `/tier`     | 创建等级             | `vip:admin:tier:create` |
| `PUT`    | `/tier/:id` | 更新等级             | `vip:admin:tier:update` |
| `DELETE` | `/tier/:id` | 删除等级             | `vip:admin:tier:delete` |

:::warning 删除限制
删除 VIP 等级时，如果有用户正在使用该等级，操作将被拒绝。需要先取消相关用户的 VIP。
:::

### 资源限制管理

| 方法     | 路径                        | 说明               | 权限                              |
| -------- | --------------------------- | ------------------ | --------------------------------- |
| `GET`    | `/tier/:id/resource-limits` | 获取等级的资源限制 | `vip:admin:resource-limit:list`   |
| `POST`   | `/resource-limit`           | 创建资源限制       | `vip:admin:resource-limit:create` |
| `PUT`    | `/resource-limit/:id`       | 更新资源限制       | `vip:admin:resource-limit:update` |
| `DELETE` | `/resource-limit/:id`       | 删除资源限制       | `vip:admin:resource-limit:delete` |

### 用户 VIP 管理

| 方法   | 路径                       | 说明                      | 权限                                |
| ------ | -------------------------- | ------------------------- | ----------------------------------- |
| `GET`  | `/user-vip`                | 获取用户 VIP 列表（分页） | `vip:admin:user-vip:list`           |
| `GET`  | `/user-vip/:userId`        | 获取用户 VIP 详情         | `vip:admin:user-vip:read`           |
| `POST` | `/user-vip/upgrade`        | 开通/升级 VIP             | `vip:admin:user-vip:upgrade`        |
| `POST` | `/user-vip/upgrade-direct` | 直接开通 VIP              | `vip:admin:user-vip:upgrade-direct` |
| `POST` | `/user-vip/:id/confirm`    | 确认 VIP 绑定             | `vip:admin:user-vip:confirm`        |
| `POST` | `/user-vip/cancel/:userId` | 取消用户 VIP              | `vip:admin:user-vip:cancel`         |

### 资源使用查询

| 方法  | 路径                          | 说明                 | 权限                            |
| ----- | ----------------------------- | -------------------- | ------------------------------- |
| `GET` | `/user-vip/:userId/resources` | 获取用户资源使用情况 | `vip:admin:resource-usage:read` |

## 💡 使用示例

### 完整路由示例

```typescript
import { Elysia } from 'elysia'
import { authPlugin } from '@/plugins/auth'
import { vipPlugin } from '@/plugins/vip'
import { R } from '@/services/response'

export default new Elysia()
  .use(authPlugin())
  .use(vipPlugin())

  // 免费用户也能访问，VIP 有更多功能
  .get('/api/dashboard', async ({ vip }) => {
    const data: any = { basic: true }

    if (vip.isValidVip) {
      data.premium = true
      data.analytics = await getAdvancedAnalytics()
    }

    return R.ok(data)
  })

  // 仅 VIP 用户可访问
  .post(
    '/api/batch-export',
    async ({ vip }) => {
      const canUse = await vip.canUseResource('export:daily', 10)
      if (!canUse) {
        const usage = await vip.getResourceUsage('export:daily')
        return R.forbidden(`导出额度不足，剩余 ${usage.available} 次`)
      }

      const result = await doBatchExport()
      await vip.incrementResource('export:daily', result.count)

      return R.ok(result)
    },
    {
      detail: {
        vip: { scope: { required: true } },
      },
    },
  )

  // 仅 premium VIP 可访问
  .get(
    '/api/ai-analysis',
    async ({ vip }) => {
      const canUse = await vip.canUseResource('ai:analysis')
      if (!canUse) return R.forbidden('AI 分析额度已用完')

      const result = await doAiAnalysis()
      await vip.incrementResource('ai:analysis')

      return R.ok(result)
    },
    {
      detail: {
        vip: { scope: { vipTier: 'premium' } },
      },
    },
  )
```

## 🔄 完整 VIP 生命周期

```
┌─────────────┐
│ 管理员配置    │
│ VIP 等级     │ ── 配置资源限制 ──┐
└──────┬──────┘                    │
       │                     ┌─────▼──────┐
       │                     │ 资源限制配置  │
       │                     │ api:call=1000│
       │                     │ storage=500  │
       │                     └─────────────┘
       ▼
┌─────────────┐    确认绑定     ┌─────────────┐
│ 开通 VIP     │──────────────>│ VIP 生效      │
│ bindingStatus│               │ bindingStatus│
│ = 0 (待确认) │               │ = 1 (已确认)  │
└──────┬──────┘               └──────┬──────┘
       │                              │
       │  取消                  使用资源 │
       ▼                              ▼
┌─────────────┐               ┌─────────────┐
│ VIP 取消     │               │ 检查配额     │
│ 恢复原角色   │               │ 消耗资源     │
│ status = 0   │               │ 追踪使用量   │
└─────────────┘               └──────┬──────┘
                                     │
                                到期  │
                                     ▼
                              ┌─────────────┐
                              │ VIP 过期     │
                              │ isValidVip   │
                              │ = false      │
                              └─────────────┘
```
