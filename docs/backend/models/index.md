# 数据模型总览

Bunstuff 使用自研 `@pkg/orm` 包定义和管理数据模型。每个模型由 `schema.ts` 定义表结构，由代码生成器自动注册到全局 `model` 对象。

## 🎯 模型列表

项目包含 22 张数据表，按功能分组如下：

### 核心业务

| 模型 | 表名 | 说明 |
|------|------|------|
| `UsersSchema` | `users` | 用户表 |
| `RoleSchema` | `role` | 角色表 |
| `MenuSchema` | `menu` | 菜单表（树形） |
| `SessionSchema` | `session` | 会话表 |

### 字典与配置

| 模型 | 表名 | 说明 |
|------|------|------|
| `DictTypeSchema` | `dict_type` | 字典类型 |
| `DictDataSchema` | `dict_data` | 字典数据 |
| `SysConfigSchema` | `sys_config` | 参数配置 |

### VIP 体系

| 模型 | 表名 | 说明 |
|------|------|------|
| `VipTierSchema` | `vip_tier` | VIP 等级 |
| `UserVipSchema` | `user_vip` | 用户 VIP 关联 |
| `VipResourceLimitSchema` | `vip_resource_limit` | 资源限制 |
| `UserResourceUsageSchema` | `user_resource_usage` | 资源用量 |

### 文件与通知

| 模型 | 表名 | 说明 |
|------|------|------|
| `SysFileSchema` | `sys_file` | 系统文件 |
| `NoticeSchema` | `notice` | 通知公告 |
| `NoticeReadSchema` | `notice_read` | 通知已读 |

### 日志

| 模型 | 表名 | 说明 |
|------|------|------|
| `OperLogSchema` | `oper_log` | 操作日志 |
| `LoginLogSchema` | `login_log` | 登录日志 |
| `JobLogSchema` | `job_log` | 任务日志 |
| `SeedLogSchema` | `seed_log` | Seed 执行日志 |

### 定时任务

| 模型 | 表名 | 说明 |
|------|------|------|
| `JobSchema` | `job` | 定时任务 |

### 限流保护

| 模型 | 表名 | 说明 |
|------|------|------|
| `RateLimitRuleSchema` | `rate_limit_rule` | 限流规则 |
| `IpBlacklistSchema` | `ip_blacklist` | IP 黑名单 |

### 动态 CRUD

| 模型 | 表名 | 说明 |
|------|------|------|
| `CrudTableSchema` | `crud_table` | CRUD 表配置 |

## 📂 目录结构

```
backend/models/
├── main.ts                  # 数据库连接（SQLite/MySQL/PostgreSQL）
├── users/
│   ├── schema.ts            # 表结构定义
│   └── seed.ts              # 初始数据
├── role/
│   ├── schema.ts
│   └── seed.ts
├── menu/
│   ├── schema.ts
│   └── seed.ts
└── ...                      # 其他模型同理
```

## ⚙️ 注册机制

模型注册由代码生成器自动完成：

```
bun run generate
  → 扫描 models/*/schema.ts
  → 生成 _generated/schemas.generated.ts
  → core/model.ts 遍历注册到全局 model 对象
```

运行时通过 `model.xxx` 访问任意模型：

```typescript
import { model } from '@/core/model'

// 直接使用
const user = await model.users.findOne({ where: 'id = 1' })
const roles = await model.role.findMany({ where: 'status = 1' })
```

## 🔗 相关页面

- [Schema 定义指南](./define.md) — 字段类型、链式 API、继承基类
- [ORM 包文档](/packages/orm) — Model API 完整参考
