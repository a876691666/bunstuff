# 操作日志

操作日志模块自动记录管理端的增删改查操作，用于审计追踪。

## 🎯 功能概述

| 功能 | 说明 |
|------|------|
| **自动记录** | 通过路由 `detail.operLog` 配置自动收集 |
| **手动记录** | 通过 `operLog.log()` 手动写入 |
| **错误捕获** | `onError` 钩子自动记录异常信息 |
| **耗时统计** | 记录每次操作的毫秒级耗时 |

## 🔌 operLogPlugin

`operLogPlugin` 在 Elysia 生命周期中注入日志上下文，并在 `onAfterHandle` / `onError` 中自动提交日志。

### 注入上下文

| 属性 | 类型 | 说明 |
|------|------|------|
| `operLog.log(data)` | `(data) => Promise` | 手动记录操作日志 |

### 操作类型

| 类型 | 说明 |
|------|------|
| `create` | 新增 |
| `update` | 修改 |
| `delete` | 删除 |
| `export` | 导出 |
| `import` | 导入 |
| `query` | 查询 |
| `clear` | 清空 |
| `other` | 其他 |

## 📝 使用方式

### 方式一：自动记录（推荐）

在路由的 `detail` 中声明 `operLog` 配置，插件会自动在请求结束后写入日志：

```typescript
app
  .use(authPlugin())
  .use(operLogPlugin())
  .post('/users', async ({ body }) => {
    const user = await userService.create(body)
    return R.ok(user)
  }, {
    detail: {
      operLog: { title: '用户管理', type: 'create' }
    }
  })
```

::: tip 配置项
- `title` — 模块标题（必填）
- `type` — 操作类型，默认 `other`
- `skip` — 设为 `true` 跳过记录
:::

### 方式二：手动记录

在路由处理函数中直接调用 `operLog.log()`：

```typescript
app.post('/users/:id/reset-password', async ({ operLog }) => {
  // ... 业务逻辑
  await operLog.log({ title: '重置密码', type: 'update' })
  return R.success()
})
```

## 🗄️ OperLog 模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `number` | 主键 |
| `title` | `string` | 操作模块 |
| `type` | `string` | 操作类型 |
| `method` | `string` | HTTP 方法 |
| `url` | `string` | 请求路径 |
| `ip` | `string` | 操作 IP |
| `params` | `string` | 请求参数（最长 2000 字符） |
| `result` | `string` | 返回结果（最长 2000 字符） |
| `status` | `0 \| 1` | 操作状态：0 失败 / 1 成功 |
| `errorMsg` | `string` | 错误信息 |
| `userId` | `number` | 操作人 ID |
| `username` | `string` | 操作人用户名 |
| `costTime` | `number` | 耗时（毫秒） |
| `operTime` | `Date` | 操作时间 |

## 📡 API 接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/admin/oper-log` | 日志列表 | `operLog:admin:list` |
| `GET` | `/api/admin/oper-log/:id` | 日志详情 | `operLog:admin:list` |
| `DELETE` | `/api/admin/oper-log/:id` | 删除日志 | `operLog:admin:delete` |
| `DELETE` | `/api/admin/oper-log/clear` | 清空日志 | `operLog:admin:delete` |

## ⚙️ 工作原理

```
请求进入 → derive 记录 startTime
         → 路由处理
         → onAfterHandle：检查 detail.operLog 配置 → 写入成功日志
         ↘ onError：检查 detail.operLog 配置 → 写入失败日志（含 errorMsg）
```

插件通过 `onStart` 钩子预收集所有路由的 `detail` 配置，存入 `routerHooksMap`，运行时按 `method:::path` 键快速查表。
