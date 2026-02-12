# 定时任务

## 概述

定时任务模块基于 [croner](https://www.npmjs.com/package/croner) 库实现 Cron 调度，支持任务注册、启停控制和执行日志。位于 `modules/job/`。

## 核心概念

### JobService

任务调度核心服务：

```typescript
import { jobService } from '@/modules/job/main/service'

// 注册处理函数
jobService.register('myHandler', async (params) => {
  // 任务逻辑
  console.log('任务执行，参数：', params)
})

// 注册 Cron 任务
jobService.registerCron({
  name: '数据清理',
  group: 'system',
  handler: 'myHandler',
  cron: '0 2 * * *',      // 每天凌晨2点
  params: { days: 30 },
})
```

### 工作流程

```
1. 启动时加载 Job 表中所有启用的任务
2. 注册到 croner 调度器
3. 按 Cron 表达式触发执行
4. 调用对应 handler 函数
5. 记录执行日志到 JobLog
```

## 数据模型

### Job（任务）

| 字段 | 说明 |
|------|------|
| name | 任务名称 |
| group | 任务分组 |
| handler | 处理函数名 |
| cron | Cron 表达式 |
| params | 参数（JSON） |
| status | 状态：1=运行 0=停止 |

### JobLog（任务日志）

记录每次执行的开始时间、结束时间、耗时、状态和错误信息。

## Cron 表达式

```
┌─────────── 秒 (0-59)（可选）
│ ┌───────── 分 (0-59)
│ │ ┌─────── 时 (0-23)
│ │ │ ┌───── 日 (1-31)
│ │ │ │ ┌─── 月 (1-12)
│ │ │ │ │ ┌─ 周 (0-6, 周日=0)
│ │ │ │ │ │
* * * * * *
```

常用示例：

| 表达式 | 说明 |
|--------|------|
| `* * * * *` | 每分钟 |
| `0 * * * *` | 每小时 |
| `0 0 * * *` | 每天午夜 |
| `0 2 * * *` | 每天凌晨2点 |
| `0 0 * * 1` | 每周一午夜 |
| `0 0 1 * *` | 每月1日午夜 |

## 管理端 API

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/admin/job` | `job:admin:list` | 任务列表 |
| POST | `/api/admin/job` | `job:admin:create` | 创建任务 |
| PUT | `/api/admin/job/:id` | `job:admin:update` | 更新任务 |
| DELETE | `/api/admin/job/:id` | `job:admin:delete` | 删除任务 |
| POST | `/api/admin/job/:id/run` | `job:admin:run` | 立即执行 |
| POST | `/api/admin/job/:id/pause` | `job:admin:pause` | 暂停任务 |
| POST | `/api/admin/job/:id/resume` | `job:admin:resume` | 恢复任务 |
| GET | `/api/admin/job-log` | `job-log:admin:list` | 执行日志 |
