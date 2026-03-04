# 定时任务

定时任务模块基于 [Croner](https://github.com/hexagon/croner) 实现 Cron 定时调度，支持任务的注册、暂停、恢复、手动执行和日志记录。

## 🎯 功能概述

| 功能          | 说明                               |
| ------------- | ---------------------------------- |
| **Cron 调度** | 支持标准 Cron 表达式               |
| **任务管理**  | 注册、暂停、恢复、删除             |
| **手动执行**  | 支持手动触发执行                   |
| **执行日志**  | 记录每次执行的状态、耗时、错误信息 |
| **动态注册**  | 运行时动态注册/修改任务            |

## 🗄️ 数据模型

### Job（任务定义）

| 字段             | 类型     | 说明                    |
| ---------------- | -------- | ----------------------- |
| `id`             | `number` | 主键                    |
| `name`           | `string` | 任务名称                |
| `group`          | `string` | 任务分组                |
| `cronExpression` | `string` | Cron 表达式             |
| `handler`        | `string` | 处理函数标识            |
| `params`         | `string` | 执行参数（JSON）        |
| `status`         | `number` | 状态：0 暂停 / 1 运行中 |
| `misfirePolicy`  | `number` | 错过策略                |
| `remark`         | `string` | 备注                    |

### JobLog（执行日志）

| 字段        | 类型       | 说明                      |
| ----------- | ---------- | ------------------------- |
| `id`        | `number`   | 主键                      |
| `jobId`     | `number`   | 任务 ID                   |
| `jobName`   | `string`   | 任务名称                  |
| `status`    | `number`   | 执行状态：0 失败 / 1 成功 |
| `message`   | `string`   | 执行结果信息              |
| `errorInfo` | `string`   | 错误详情                  |
| `costTime`  | `number`   | 耗时（毫秒）              |
| `startTime` | `datetime` | 开始时间                  |
| `endTime`   | `datetime` | 结束时间                  |

## ⏰ Cron 表达式

| 表达式         | 说明              |
| -------------- | ----------------- |
| `* * * * *`    | 每分钟执行        |
| `0 * * * *`    | 每小时整点        |
| `0 0 * * *`    | 每天 0 点         |
| `0 0 * * 1`    | 每周一 0 点       |
| `0 0 1 * *`    | 每月 1 号 0 点    |
| `*/5 * * * *`  | 每 5 分钟         |
| `0 9,18 * * *` | 每天 9 点和 18 点 |

## 🔧 JobService

```typescript
import { jobService } from '@/services/job'

// 注册定时任务
jobService.register({
  name: '清理过期数据',
  cronExpression: '0 3 * * *', // 每天凌晨 3 点
  handler: async () => {
    await cleanExpiredData()
  },
})

// 注册带参数的任务
jobService.registerCron('report-generation', '0 8 * * 1', async () => {
  await generateWeeklyReport()
})
```

## 📡 管理端 API

| 方法     | 路径                        | 说明     | 权限                |
| -------- | --------------------------- | -------- | ------------------- |
| `GET`    | `/api/admin/job`            | 任务列表 | `job:admin:list`    |
| `POST`   | `/api/admin/job`            | 创建任务 | `job:admin:create`  |
| `PUT`    | `/api/admin/job/:id`        | 更新任务 | `job:admin:update`  |
| `DELETE` | `/api/admin/job/:id`        | 删除任务 | `job:admin:delete`  |
| `POST`   | `/api/admin/job/:id/run`    | 手动执行 | `job:admin:run`     |
| `POST`   | `/api/admin/job/:id/pause`  | 暂停任务 | `job:admin:update`  |
| `POST`   | `/api/admin/job/:id/resume` | 恢复任务 | `job:admin:update`  |
| `GET`    | `/api/admin/job-log`        | 执行日志 | `jobLog:admin:list` |
