# Seed 种子

Seed 种子模块负责系统基础数据的初始化，确保系统首次启动时创建必要的角色、用户、菜单、字典等基础数据。

## 🎯 功能概述

| 功能         | 说明                              |
| ------------ | --------------------------------- |
| **依赖排序** | 按依赖关系自动排序执行            |
| **幂等执行** | 已执行的 Seed 不会重复执行        |
| **执行日志** | 每次执行记录到 `seed_log` 表      |
| **手动触发** | 管理端支持手动重新执行            |
| **自动运行** | 启动时自动检测并执行未执行的 Seed |

## 🌱 Seed 定义

每个模型目录下的 `seed.ts` 定义该模型的初始数据：

```typescript
// models/role/seed.ts
import type { SeedDefinition } from '@/core/seed'

export default {
  name: 'role',
  description: '初始化默认角色',
  autoRun: true,
  run: async (db) => {
    await db.model(RoleSchema).create({
      id: 'admin',
      name: '超级管理员',
      description: '拥有系统所有权限',
    })
    await db.model(RoleSchema).create({
      id: 'user',
      name: '普通用户',
      description: '基础权限',
    })
  },
} satisfies SeedDefinition
```

## 📋 核心 Seed 列表

20 个 Seed 按依赖关系排序：

| 顺序 | Seed                 | 说明                         | 依赖      |
| ---- | -------------------- | ---------------------------- | --------- |
| 1    | `role`               | 默认角色（admin/user）       | 无        |
| 2    | `users`              | 管理员账号（admin/admin123） | role      |
| 3    | `menu`               | 菜单树（目录/菜单/按钮）     | 无        |
| 4    | `dict-type`          | 字典类型                     | 无        |
| 5    | `dict-data`          | 字典数据                     | dict-type |
| 6    | `sys-config`         | 系统配置                     | 无        |
| 7    | `session`            | 会话表初始化                 | 无        |
| 8    | `login-log`          | 登录日志                     | 无        |
| 9    | `oper-log`           | 操作日志                     | 无        |
| 10   | `notice`             | 通知公告                     | 无        |
| 11   | `notice-read`        | 通知已读                     | notice    |
| 12   | `sys-file`           | 文件表                       | 无        |
| 13   | `job`                | 定时任务                     | 无        |
| 14   | `job-log`            | 任务日志                     | job       |
| 15   | `rate-limit-rule`    | 限流规则                     | 无        |
| 16   | `ip-blacklist`       | IP 黑名单                    | 无        |
| 17   | `seed-log`           | Seed 日志                    | 无        |
| 18   | `crud-table`         | CRUD 注册表                  | 无        |
| 19   | `vip-tier`           | VIP 等级                     | 无        |
| 20   | `vip-resource-limit` | VIP 资源限制                 | vip-tier  |

## 🔄 执行机制

```
启动时
    │
    ▼
┌──────────────────────────┐
│ 扫描所有 seed.ts 文件     │
│ 生成 seeds.generated.ts  │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ 查询 seed_log 表          │
│ 获取已执行 Seed 列表      │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ 按依赖关系排序            │
│ 跳过已执行的 Seed         │
│ 逐个执行未执行的 Seed     │
│ 记录执行结果到 seed_log   │
└──────────────────────────┘
```

### SeedLog 模型

| 字段         | 类型       | 说明                  |
| ------------ | ---------- | --------------------- |
| `id`         | `number`   | 主键                  |
| `name`       | `string`   | Seed 名称             |
| `status`     | `number`   | 状态：0 失败 / 1 成功 |
| `message`    | `string`   | 执行信息              |
| `executedAt` | `datetime` | 执行时间              |

## 📡 管理端 API

| 方法   | 路径                          | 说明                    | 权限              |
| ------ | ----------------------------- | ----------------------- | ----------------- |
| `GET`  | `/api/admin/seed`             | Seed 列表（含执行状态） | `seed:admin:list` |
| `POST` | `/api/admin/seed/:name/run`   | 手动执行 Seed           | `seed:admin:run`  |
| `POST` | `/api/admin/seed/:name/rerun` | 强制重新执行            | `seed:admin:run`  |

::: warning 注意
强制重新执行 Seed 可能导致数据重复或冲突，请谨慎操作。建议仅在开发环境使用。
:::

## 🔧 自定义 Seed

新增 Seed 的步骤：

1. 在对应模型目录创建 `seed.ts` 文件
2. 导出 `SeedDefinition` 对象
3. 执行 `bun run generate` 重新生成注册文件
4. 重启服务，新 Seed 将自动执行

```typescript
// models/my-module/seed.ts
export default {
  name: 'my-module',
  description: '初始化 XXX 数据',
  autoRun: true,
  run: async (db) => {
    // 初始化逻辑
  },
} satisfies SeedDefinition
```
