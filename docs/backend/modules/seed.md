# Seed 种子

## 概述

Seed 模块负责数据库初始化数据，确保系统首次启动时拥有必要的基础数据。位于 `modules/seed/`。

## 工作原理

```
服务启动 → runSeeds()
   ↓
遍历所有注册的种子
   ↓ 检查 SeedLog
已执行？→ 跳过
未执行？→ 执行种子函数
   ↓
记录到 SeedLog
```

## 执行顺序

种子按依赖关系排序，共 15 个核心种子：

```
1.  role                → 创建角色（admin/user 等）
2.  permission          → 创建权限编码
3.  menu                → 创建菜单配置
4.  user                → 创建默认用户（admin）
5.  role-permission     → 绑定角色-权限关系
6.  role-menu           → 绑定角色-菜单关系
7.  permission-scope    → 配置数据权限规则
8.  vip-tier            → 创建 VIP 等级
9.  vip-resource-limit  → 配置资源限制
10. dict                → 初始化字典数据
11. config              → 初始化系统配置
12. notice              → 创建示例通知
13. job                 → 注册定时任务
14. rate-limit          → 配置限流规则
15. crud-table          → 注册动态 CRUD 表
```

## SeedLog 模型

| 字段 | 说明 |
|------|------|
| name | 种子名称 |
| status | 执行状态（success/failed） |
| message | 执行消息/错误信息 |
| executedAt | 执行时间 |

## 管理端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/seed` | 查看种子执行日志 |
| POST | `/api/admin/seed/:name/run` | 手动执行指定种子 |
| POST | `/api/admin/seed/:name/rerun` | 重新执行种子（重置标记） |

## 自定义种子

在 `modules/seed/main/register.ts` 中注册新种子：

```typescript
seedRunner.register('my-data', async () => {
  await myService.create({ name: '默认数据' })
}, { after: 'user' })  // 在 user 种子之后执行
```
