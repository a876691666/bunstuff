# Job 定时任务模块

基于 Croner 的定时任务调度系统，支持全局注册任务、Cron 自动调度和手动触发。

## 核心特性

- ✅ **全局注册任务处理函数** - 通过 `jobService.register()` 注册
- ✅ **自动同步 Cron 任务** - 启动时自动将代码注册的任务同步到数据库（以 `handler + group` 为唯一键）
- ✅ **数据库驱动调度** - 从数据库加载任务配置并启动 Cron 调度
- ✅ **运行时控制** - 支持启用/禁用/手动执行任务
- ✅ **执行日志** - 自动记录每次执行的结果、耗时和错误信息
- ✅ **插件支持** - 提供 `jobPlugin()` 用于在路由中触发任务

## 快速开始

### 1. 注册任务处理函数

```typescript
// backend/modules/job/main/service.ts
import { jobService } from './service'

// 注册处理函数
jobService.register('myTask', async (params) => {
  console.log('执行任务:', params)
  // 你的业务逻辑
})
```

### 2. 注册 Cron 任务（可选）

```typescript
// 注册定时执行的任务（启动时自动同步到数据库）
jobService.registerCron({
  handler: 'myTask', // 处理函数名称
  group: 'business', // 分组（可选，默认 'default'）
  name: '我的定时任务', // 任务名称
  cron: '0 0 * * *', // Cron 表达式（每天凌晨执行）
  params: { foo: 'bar' }, // 默认参数（可选）
  remark: '每天定时执行的任务', // 备注（可选）
})
```

### 3. 启动调度器

```typescript
// backend/index.ts
import { jobService } from '@/modules/job'

// 启动定时任务调度器
await jobService.start()
```

### 4. 使用插件触发任务

```typescript
import { Elysia } from 'elysia'
import { jobPlugin } from '@/modules/job'

new Elysia()
  .use(jobPlugin())
  .post('/trigger-task', async ({ job }) => {
    // 通过 handler 触发
    const result = await job.trigger('myTask', { custom: 'params' })
    return result
  })
  .post('/execute-task/:id', async ({ job, params }) => {
    // 通过 ID 执行
    const result = await job.execute(params.id)
    return result
  })
```

## API 接口

### 管理端 API (`/api/admin/job`)

#### 任务管理

| 方法   | 路径           | 说明       | 权限               |
| ------ | -------------- | ---------- | ------------------ |
| GET    | `/`            | 任务列表   | `job:admin:list`   |
| GET    | `/:id`         | 任务详情   | `job:admin:read`   |
| POST   | `/`            | 创建任务   | `job:admin:create` |
| PUT    | `/:id`         | 更新任务   | `job:admin:update` |
| DELETE | `/:id`         | 删除任务   | `job:admin:delete` |
| POST   | `/:id/run`     | 执行任务   | `job:admin:run`    |
| POST   | `/:id/enable`  | 启用任务   | `job:admin:update` |
| POST   | `/:id/disable` | 禁用任务   | `job:admin:update` |
| GET    | `/handlers`    | 已注册函数 | `job:admin:list`   |

#### 日志管理 (`/api/admin/job-log`)

| 方法   | 路径     | 说明     | 权限                  |
| ------ | -------- | -------- | --------------------- |
| GET    | `/`      | 日志列表 | `jobLog:admin:list`   |
| GET    | `/:id`   | 日志详情 | `jobLog:admin:read`   |
| DELETE | `/:id`   | 删除日志 | `jobLog:admin:delete` |
| DELETE | `/clear` | 清空日志 | `jobLog:admin:clear`  |

## 数据库表结构

### `job` - 定时任务表

| 字段      | 类型   | 说明                           |
| --------- | ------ | ------------------------------ |
| id        | number | 主键                           |
| name      | string | 任务名称                       |
| group     | string | 任务分组（默认 'default'）     |
| handler   | string | 处理器标识（对应注册的函数名） |
| cron      | string | Cron 表达式（如：`0 2 * * *`） |
| params    | string | 执行参数（JSON 格式）          |
| status    | number | 状态（0-暂停，1-运行）         |
| remark    | string | 备注                           |
| createdAt | string | 创建时间                       |
| updatedAt | string | 更新时间                       |

### `job_log` - 任务执行日志表

| 字段      | 类型   | 说明                   |
| --------- | ------ | ---------------------- |
| id        | number | 主键                   |
| jobId     | number | 任务 ID                |
| jobName   | string | 任务名称               |
| handler   | string | 处理器标识             |
| message   | string | 日志信息               |
| status    | number | 状态（0-失败，1-成功） |
| errorMsg  | string | 错误消息               |
| startTime | string | 开始时间               |
| endTime   | string | 结束时间               |
| costTime  | number | 耗时（毫秒）           |

## Cron 表达式示例

```
* * * * *        每分钟
0 * * * *        每小时
0 0 * * *        每天凌晨
0 2 * * *        每天凌晨2点
0 0 * * 0        每周日凌晨
0 0 1 * *        每月1号凌晨
0 0 1 1 *        每年1月1日凌晨
*/5 * * * *      每5分钟
0 */2 * * *      每2小时
0 9-17 * * *     每天9点到17点（每小时）
```

**格式**: `分 时 日 月 周`

## 服务方法

### `jobService`

```typescript
// 注册处理函数
jobService.register(handler: string, fn: JobHandler)

// 注册 Cron 任务
jobService.registerCron(def: CronJobDefinition)

// 启动调度器
await jobService.start()

// 手动触发任务（by handler）
await jobService.trigger(handler: string, params?: unknown)

// 执行任务（by id）
await jobService.executeJob(jobId: number, params?: unknown)

// 启用/禁用任务
await jobService.enable(jobId: number)
await jobService.disable(jobId: number)

// CRUD 操作
await jobService.findAll(query)
await jobService.findById(id)
await jobService.create(data)
await jobService.update(id, data)
await jobService.delete(id)
```

## 最佳实践

### 1. 任务注册集中管理

```typescript
// backend/modules/job/main/service.ts

// 系统任务
jobService.register('clearExpiredSessions', async () => {
  await sessionStore.cleanup()
})

jobService.register('cleanupOldLogs', async (params: { days: number }) => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - params.days)
  // 清理逻辑
})

// 注册 Cron 任务
jobService.registerCron({
  handler: 'clearExpiredSessions',
  group: 'system',
  name: '清理过期会话',
  cron: '0 2 * * *',
  remark: '每天凌晨2点清理过期会话',
})

jobService.registerCron({
  handler: 'cleanupOldLogs',
  group: 'system',
  name: '清理旧日志',
  cron: '0 3 1 * *',
  params: { days: 90 },
  remark: '每月1号凌晨3点清理90天前的日志',
})
```

### 2. 错误处理

任务处理函数应该抛出错误以便记录日志：

```typescript
jobService.register('myTask', async (params) => {
  try {
    // 业务逻辑
  } catch (err) {
    // 抛出错误，会自动记录到 job_log
    throw new Error(`任务执行失败: ${err.message}`)
  }
})
```

### 3. 参数传递

```typescript
// 注册时设置默认参数
jobService.registerCron({
  handler: 'backup',
  name: '数据备份',
  cron: '0 3 * * *',
  params: { target: 's3', compress: true },
})

// 手动触发时覆盖参数
await jobService.trigger('backup', {
  target: 'local',
  compress: false,
})
```

## 注意事项

1. **唯一键**: 任务以 `handler + group` 为唯一标识，避免重复注册
2. **启动顺序**: 必须先注册任务，再调用 `jobService.start()`
3. **状态管理**: 数据库中的 `status` 字段控制任务是否运行
4. **Cron 同步**: `registerCron()` 的任务会在启动时自动同步到数据库，如果数据库中已存在则更新 cron 表达式和名称
5. **日志清理**: 建议定期清理旧的执行日志以节省存储空间

## 文件结构

```
backend/modules/job/
├── README.md                # 本文档
├── index.ts                 # 模块导出
├── main/
│   ├── service.ts          # 核心服务（调度器、注册、执行）
│   ├── plugin.ts           # Elysia 插件
│   └── api_admin.ts        # 管理端 API（任务 CRUD）
└── job-log/
    ├── service.ts          # 日志服务
    └── api_admin.ts        # 日志管理 API
```

## 依赖

- `croner` - Cron 调度库
- `@/models/job` - 任务模型
- `@/models/job-log` - 日志模型
