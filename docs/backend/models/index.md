# 模型总览

## 所有数据模型

系统包含 25+ 个数据模型，覆盖用户认证、权限管理、系统配置等功能：

### 用户与认证

| 模型 | 表名 | Schema 基类 | 说明 |
|------|------|-------------|------|
| User | `users` | TimestampSchema | 用户表（用户名/密码/昵称/邮箱/手机/头像/状态/角色） |
| Session | `session` | Schema | 会话表（token/用户ID/IP/UA/过期时间） |

### RBAC 权限

| 模型 | 表名 | Schema 基类 | 说明 |
|------|------|-------------|------|
| Role | `role` | TimestampSchema | 角色表（树形结构，parentId/name/code/status/sort） |
| Permission | `permission` | TimestampSchema | 权限表（name/code/resource） |
| Menu | `menu` | TimestampSchema | 菜单表（树形，parentId/name/path/component/icon/type/permCode） |
| PermissionScope | `permission_scope` | TimestampSchema | 数据权限范围（permissionId/tableName/ssqlRule） |
| RolePermission | `role_permission` | — | 角色-权限关联（roleId/permissionId） |
| RoleMenu | `role_menu` | — | 角色-菜单关联（roleId/menuId） |

### 系统管理

| 模型 | 表名 | Schema 基类 | 说明 |
|------|------|-------------|------|
| DictType | `dict_type` | — | 字典类型（name/type/status） |
| DictData | `dict_data` | — | 字典数据（dictType/label/value/sort） |
| SysConfig | `sys_config` | — | 系统配置（name/key/value/type） |
| SysFile | `sys_file` | TimestampSchema | 文件记录（originalName/storagePath/size/mimeType） |
| Notice | `notice` | TimestampSchema | 通知公告（title/content/type/status） |
| NoticeRead | `notice_read` | — | 通知已读记录 |

### 日志审计

| 模型 | 表名 | Schema 基类 | 说明 |
|------|------|-------------|------|
| LoginLog | `login_log` | — | 登录日志（username/ip/status） |
| OperLog | `oper_log` | Schema | 操作日志（title/method/url/params/result/costTime） |

### 定时任务

| 模型 | 表名 | Schema 基类 | 说明 |
|------|------|-------------|------|
| Job | `job` | TimestampSchema | 任务配置（name/handler/cron/params/status） |
| JobLog | `job_log` | — | 任务执行日志 |

### VIP 会员

| 模型 | 表名 | Schema 基类 | 说明 |
|------|------|-------------|------|
| VipTier | `vip_tier` | TimestampSchema | VIP 等级（name/code/price/durationDays） |
| VipResourceLimit | `vip_resource_limit` | — | 资源限制 |
| UserVip | `user_vip` | — | 用户 VIP 绑定 |
| UserResourceUsage | `user_resource_usage` | — | 资源用量 |

### 安全与限流

| 模型 | 表名 | Schema 基类 | 说明 |
|------|------|-------------|------|
| RateLimitRule | `rate_limit_rule` | TimestampSchema | 限流规则（mode/pathPattern/maxRequests） |
| IpBlacklist | `ip_blacklist` | — | IP 黑名单 |

### 其他

| 模型 | 表名 | Schema 基类 | 说明 |
|------|------|-------------|------|
| CrudTable | `crud_table` | TimestampSchema | 动态 CRUD 表配置 |
| SeedLog | `seed_log` | — | 种子执行日志 |

## Schema 继承体系

```
Schema（基础类）
  ├── id()          → number, primaryKey, autoIncrement
  ├── string()      → string, default ''
  ├── number()      → number, default 0
  ├── date()        → string (datetime)
  ├── status()      → number, default 1 (1=正常 0=禁用)
  └── sort()        → number, default 0
  
TimestampSchema extends Schema
  ├── createdAt     → string (datetime), 自动填充
  └── updatedAt     → string (datetime), 自动更新
  
BaseSchema extends TimestampSchema
  └── remark        → string, default ''
```

## 菜单类型

Menu 模型的 `type` 字段：

| 值 | 类型 | 说明 |
|----|------|------|
| 1 | 目录 | 菜单分组，可含子菜单 |
| 2 | 菜单 | 页面菜单，有路由 |
| 3 | 按钮 | 操作按钮，关联权限编码 |
