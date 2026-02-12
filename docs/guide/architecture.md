# 架构设计

## 整体架构

Bunstuff 采用 **Monorepo** 结构，包含三个独立应用和一套自研工具包：

```
┌──────────────────────────────────────────────────────┐
│                    Monorepo Root                       │
├──────────────┬──────────────┬──────────┬──────────────┤
│   frontend/  │   client/    │ backend/ │    docs/     │
│  管理端 SPA  │  客户端 SPA  │ API 服务  │   文档站     │
└──────┬───────┴──────┬───────┴────┬─────┴──────────────┘
       │              │            │
       └──────────────┴────────────┘
                      ↓
              ┌───────────────┐
              │  Backend API  │
              │  Port: 3000   │
              ├───────────────┤
              │  /api/*       │ ← 客户端接口
              │  /api/admin/* │ ← 管理端接口
              │  /            │ ← 客户端 SPA
              │  /_admin      │ ← 管理端 SPA
              └───────┬───────┘
                      ↓
              ┌───────────────┐
              │   Database    │
              │ SQLite/MySQL/ │
              │  PostgreSQL   │
              └───────────────┘
```

## 后端架构

### 分层设计

```
路由层（Elysia Route）
    ↓ 请求校验（TypeBox）
插件层（Plugin）
    ↓ 认证 / 权限 / 日志 / 限流
服务层（Service / CrudService）
    ↓ 业务逻辑 / 数据权限过滤
模型层（Model / ORM）
    ↓ CRUD 操作 / Schema 管理
数据库层（DB）
    ↓ SQL 编译执行
```

### 模块结构约定

每个功能模块遵循统一的文件结构：

```
modules/
  └── feature/
      └── main/           # 或直接在 feature/ 下
          ├── plugin.ts    # Elysia 插件（derive 注入上下文）
          ├── service.ts   # 业务逻辑服务
          ├── api_client.ts# 客户端路由（/api/...）
          └── api_admin.ts # 管理端路由（/api/admin/...）
```

### 插件链架构

Elysia 插件按依赖关系链式组合：

```
请求 → CORS → 限流 → 路由匹配
                       ↓
              authPlugin()  → 注入 session/userId/roleId
                       ↓
              rbacPlugin()  → 权限校验 → 注入 dataScope
                       ↓
              operLogPlugin() → 操作日志记录（可选）
                       ↓
              业务 Handler → CrudService → 数据库
```

### 数据权限流

数据权限是本系统的核心特性，实现行级数据过滤：

```
1. 路由声明权限
   detail: { rbac: { scope: { permissions: ['user:admin:list'] } } }

2. rbacPlugin 匹配权限 → 查找 PermissionScope
   PermissionScope { permissionId, tableName, ssqlRule }

3. ssqlRule 模板渲染（VelocityJS）
   "userId = $auth.userId" → "userId = 42"

4. CrudService 合并条件
   原始 WHERE + DataScope WHERE → 最终查询

5. 结果：用户只能看到自己权限范围内的数据
```

## 前端架构

### 管理端架构

```
App.vue
  └── AdminLayout.vue
        ├── 侧边栏菜单（动态生成）
        ├── 顶部导航栏
        └── RouterView（动态路由）
               ├── Dashboard
               ├── Admin 视图
               │     ├── system/  (Users/Roles/Menus/...)
               │     ├── rbac/    (RoleMenus/RolePermissions/...)
               │     ├── crud/    (CrudTable)
               │     ├── file/    (文件管理)
               │     ├── job/     (定时任务)
               │     └── ...
               └── Auth 视图
                     ├── Login
                     ├── Profile
                     └── ChangePassword
```

### 路由流程

```
用户访问页面
    ↓
路由守卫检查
    ↓ 无 Token
重定向到登录页
    ↓ 有 Token
检查用户信息是否已初始化
    ↓ 未初始化
fetchUserInfo() → fetchPermissions() → fetchMenuTree()
    ↓
addDynamicRoutes(menuTree) → 生成 Vue Router 路由
    ↓
进入目标页面
```

### CRUD 模式

管理端视图高度标准化，遵循统一的 CRUD 模式：

```
视图组件（.vue）
    ├── useTable(options)     复用表格逻辑
    │     ├── 分页
    │     ├── SSQL 过滤
    │     └── 数据加载
    ├── useModal(options)     复用弹窗逻辑
    │     ├── 新增/编辑
    │     └── 表单校验
    ├── PageTable 组件        渲染数据表格
    │     ├── columns 定义
    │     ├── SearchForm      搜索条件
    │     └── 操作按钮
    └── FormModal 组件        渲染表单弹窗
          ├── FormField       字段渲染
          └── 提交/取消
```

## 启动流程

系统启动按严格顺序执行：

```
1. runSeeds()              → 数据库迁移 + 种子数据初始化
2. sessionStore.init()     → 从 DB 加载 Session 到内存
3. rbacService.init()      → 全量预热 RBAC 缓存（角色/权限/菜单）
4. dictService.initCache() → 字典全量缓存
5. configService.initCache()→ 配置全量缓存
6. rateLimitRuleService.initCache() → 限流规则缓存
7. crudRegistry.initFromDb()→ 动态 CRUD 表注册
8. jobService.start()      → Cron 调度器启动
9. Elysia.listen(3000)     → 开始接收请求
```

## 安全设计

| 层级 | 安全措施 |
|------|----------|
| **传输层** | CORS 白名单控制 |
| **认证层** | Token 校验、Session 过期、强制踢出 |
| **权限层** | 接口级权限码、角色校验 |
| **数据层** | 行级数据过滤（DataScope） |
| **限流层** | 时间窗口/并发/滑动窗口限流 |
| **封禁层** | IP 黑名单自动封禁 |
| **输入层** | TypeBox 自动校验、SSQL 白名单字段 |
| **日志层** | 登录日志、操作日志全记录 |
