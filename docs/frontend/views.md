# 页面视图

## 视图目录结构

```
views/
├── Dashboard.vue              # 仪表盘
├── NotFound.vue               # 404 页面
├── auth/
│   ├── Login.vue              # 登录
│   ├── Profile.vue            # 个人信息
│   └── ChangePassword.vue     # 修改密码
└── admin/
    ├── system/
    │   ├── Users.vue           # 用户管理
    │   ├── Roles.vue           # 角色管理
    │   ├── Menus.vue           # 菜单管理
    │   ├── Permissions.vue     # 权限管理
    │   ├── PermissionScopes.vue# 权限范围
    │   ├── DictTypes.vue       # 字典类型
    │   ├── DictData.vue        # 字典数据
    │   ├── Configs.vue         # 系统配置
    │   ├── LoginLogs.vue       # 登录日志
    │   └── OperLogs.vue        # 操作日志
    ├── rbac/
    │   ├── RoleMenus.vue       # 角色菜单分配
    │   ├── RolePermissions.vue # 角色权限分配
    │   ├── Sessions.vue        # 在线会话
    │   └── Cache.vue           # 缓存管理
    ├── crud/
    │   └── CrudTable.vue       # 动态 CRUD 表管理
    ├── file/
    │   └── Files.vue           # 文件管理
    ├── job/
    │   └── Jobs.vue            # 定时任务
    ├── notice/
    │   └── Notices.vue         # 通知公告
    ├── rate-limit/
    │   ├── RateLimits.vue      # 限流规则
    │   └── IpBlacklist.vue     # IP 黑名单
    └── vip/
        └── VipTiers.vue        # VIP 等级
```

## 视图开发模式

所有管理页面遵循统一的开发模式：

1. 导入 API 模块
2. 使用 `useTable` + `useModal` 组合函数
3. 定义表格列配置
4. 使用 `PageTable` + `FormModal` 组件
5. 可选：使用 `useDict` 加载字典数据

每个视图文件通常不超过 150 行代码，核心业务逻辑通过组合函数复用。
