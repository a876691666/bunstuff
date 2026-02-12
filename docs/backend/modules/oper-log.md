# 操作日志

## 概述

操作日志模块自动记录带有 `operLog` 配置的路由操作。位于 `modules/system/oper-log/`。

## operLogPlugin

在路由 `detail` 中声明 `operLog` 即可自动记录：

```typescript
import { operLogPlugin } from '@/modules/system/oper-log/plugin'

const api = new Elysia()
  .use(authPlugin())
  .use(operLogPlugin())
  
  .post('/users', handler, {
    detail: {
      operLog: {
        title: '用户管理',    // 操作模块
        type: 'create',       // 操作类型
      },
    },
  })
  
  .put('/users/:id', handler, {
    detail: {
      operLog: {
        title: '用户管理',
        type: 'update',
      },
    },
  })
  
  .delete('/users/:id', handler, {
    detail: {
      operLog: {
        title: '用户管理',
        type: 'delete',
      },
    },
  })
```

### 记录内容

| 字段 | 说明 |
|------|------|
| title | 操作模块名 |
| type | 操作类型（create/update/delete/list/...） |
| method | HTTP 方法 |
| url | 请求 URL |
| ip | 请求 IP |
| params | 请求参数 |
| result | 响应结果 |
| status | 执行状态（成功/失败） |
| errorMsg | 错误信息 |
| userId | 操作用户 ID |
| username | 操作用户名 |
| costTime | 耗时（ms） |
| operTime | 操作时间 |

### 工作原理

```
请求进入 → 检查 detail.operLog
  → 有配置 → 记录开始时间
  → 执行 handler
  → 响应后 → 记录日志到 OperLog 表
```

## 管理端 API

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/api/admin/oper-log` | `oper-log:admin:list` |
| DELETE | `/api/admin/oper-log/:id` | `oper-log:admin:delete` |
