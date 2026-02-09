import { where } from '@/packages/ssql'
import Permission from './index'
import type { SeedDefinition } from '@/modules/seed'

/** 默认权限数据 - 基于 scopes.json 生成 */
const defaultPermissions = [
  // ========== 认证管理权限 (auth) ==========
  { code: 'auth:admin:kick-session', name: '踢出会话', description: '踢出指定会话' },
  { code: 'auth:admin:kick-user', name: '踢出用户', description: '踢出指定用户所有会话' },
  { code: 'auth:admin:sessions', name: '查看会话列表', description: '获取所有会话列表' },
  { code: 'auth:admin:stats', name: '查看认证统计', description: '获取认证统计信息' },

  // ========== 系统配置权限 (config) ==========
  { code: 'config:admin:create', name: '创建系统配置', description: '创建新系统配置' },
  { code: 'config:admin:delete', name: '删除系统配置', description: '删除系统配置' },
  { code: 'config:admin:list', name: '查看配置列表', description: '获取系统配置列表' },
  { code: 'config:admin:read', name: '查看配置详情', description: '获取系统配置详情' },
  { code: 'config:admin:update', name: '更新系统配置', description: '更新系统配置' },

  // ========== 字典管理权限 (dict) ==========
  { code: 'dict:admin:data:create', name: '创建字典数据', description: '创建字典数据项' },
  { code: 'dict:admin:data:delete', name: '删除字典数据', description: '删除字典数据项' },
  { code: 'dict:admin:data:list', name: '查看字典数据列表', description: '获取字典数据列表' },
  { code: 'dict:admin:data:read', name: '查看字典数据详情', description: '获取字典数据详情' },
  { code: 'dict:admin:data:update', name: '更新字典数据', description: '更新字典数据项' },
  { code: 'dict:admin:type:create', name: '创建字典类型', description: '创建字典类型' },
  { code: 'dict:admin:type:delete', name: '删除字典类型', description: '删除字典类型' },
  { code: 'dict:admin:type:list', name: '查看字典类型列表', description: '获取字典类型列表' },
  { code: 'dict:admin:type:read', name: '查看字典类型详情', description: '获取字典类型详情' },
  { code: 'dict:admin:type:update', name: '更新字典类型', description: '更新字典类型' },

  // ========== 文件管理权限 (file) ==========
  { code: 'file:admin:delete', name: '删除文件', description: '删除上传的文件' },
  { code: 'file:admin:list', name: '查看文件列表', description: '获取文件列表' },
  { code: 'file:admin:read', name: '查看文件详情', description: '获取文件详情' },
  { code: 'file:admin:upload', name: '上传文件', description: '上传新文件' },

  // ========== 登录日志权限 (loginLog) ==========
  { code: 'loginLog:admin:clear', name: '清空登录日志', description: '清空所有登录日志' },
  { code: 'loginLog:admin:delete', name: '删除登录日志', description: '删除登录日志' },
  { code: 'loginLog:admin:list', name: '查看登录日志列表', description: '获取登录日志列表' },
  { code: 'loginLog:admin:read', name: '查看登录日志详情', description: '获取登录日志详情' },

  // ========== 操作日志权限 (operLog) ==========
  { code: 'operLog:admin:list', name: '查看操作日志列表', description: '获取操作日志列表' },
  { code: 'operLog:admin:read', name: '查看操作日志详情', description: '获取操作日志详情' },
  { code: 'operLog:admin:delete', name: '删除操作日志', description: '删除操作日志' },
  { code: 'operLog:admin:clear', name: '清空操作日志', description: '清空所有操作日志' },

  // ========== 菜单管理权限 (menu) ==========
  { code: 'menu:admin:create', name: '创建菜单', description: '创建新菜单' },
  { code: 'menu:admin:delete', name: '删除菜单', description: '删除菜单' },
  { code: 'menu:admin:list', name: '查看菜单列表', description: '获取菜单列表' },
  { code: 'menu:admin:read', name: '查看菜单详情', description: '获取菜单详情' },
  { code: 'menu:admin:tree', name: '查看菜单树', description: '获取菜单树形结构' },
  { code: 'menu:admin:update', name: '更新菜单', description: '更新菜单信息' },

  // ========== 通知管理权限 (notice) ==========
  { code: 'notice:admin:create', name: '创建通知', description: '创建新通知' },
  { code: 'notice:admin:delete', name: '删除通知', description: '删除通知' },
  { code: 'notice:admin:list', name: '查看通知列表', description: '获取通知列表' },
  { code: 'notice:admin:read', name: '查看通知详情', description: '获取通知详情' },
  { code: 'notice:admin:update', name: '更新通知', description: '更新通知内容' },

  // ========== 数据权限规则管理 (permission-scope) ==========
  { code: 'permission-scope:admin:create', name: '创建数据规则', description: '创建数据过滤规则' },
  { code: 'permission-scope:admin:delete', name: '删除数据规则', description: '删除数据过滤规则' },
  {
    code: 'permission-scope:admin:list',
    name: '查看数据规则列表',
    description: '获取数据过滤规则列表',
  },
  {
    code: 'permission-scope:admin:read',
    name: '查看数据规则详情',
    description: '获取数据过滤规则详情',
  },
  { code: 'permission-scope:admin:update', name: '更新数据规则', description: '更新数据过滤规则' },

  // ========== 权限管理权限 (permission) ==========
  { code: 'permission:admin:create', name: '创建权限', description: '创建新权限' },
  { code: 'permission:admin:delete', name: '删除权限', description: '删除权限' },
  { code: 'permission:admin:list', name: '查看权限列表', description: '获取权限列表' },
  { code: 'permission:admin:read', name: '查看权限详情', description: '获取权限详情' },
  { code: 'permission:admin:update', name: '更新权限', description: '更新权限信息' },

  // ========== RBAC 管理权限 (rbac) ==========
  { code: 'rbac:admin:cache-reload', name: '重载RBAC缓存', description: '重新加载RBAC缓存' },
  { code: 'rbac:admin:cache-status', name: '查看缓存状态', description: '获取RBAC缓存状态' },
  { code: 'rbac:admin:permission-check', name: '权限检查', description: '检查单个权限' },
  {
    code: 'rbac:admin:permission-check-all',
    name: '权限全部检查',
    description: '检查是否拥有所有权限',
  },
  {
    code: 'rbac:admin:permission-check-any',
    name: '权限任一检查',
    description: '检查是否拥有任一权限',
  },
  { code: 'rbac:admin:role-chain', name: '查看角色链', description: '获取角色继承链' },
  { code: 'rbac:admin:role-children', name: '查看子角色', description: '获取角色的子角色' },
  { code: 'rbac:admin:role-menus', name: '查看角色菜单', description: '获取角色菜单列表' },
  { code: 'rbac:admin:role-menus-tree', name: '查看角色菜单树', description: '获取角色菜单树' },
  { code: 'rbac:admin:role-permissions', name: '查看角色权限', description: '获取角色权限列表' },
  { code: 'rbac:admin:role-scopes', name: '查看角色数据规则', description: '获取角色数据规则' },
  {
    code: 'rbac:admin:role-scopes-ssql',
    name: '查看角色SSQL规则',
    description: '获取角色SSQL规则',
  },
  {
    code: 'rbac:admin:role-scopes-table',
    name: '查看角色表规则',
    description: '获取角色表级数据规则',
  },
  { code: 'rbac:admin:roles-tree', name: '查看角色树', description: '获取角色树形结构' },
  { code: 'rbac:admin:user-info', name: '查看用户RBAC信息', description: '获取用户RBAC详细信息' },
  { code: 'rbac:admin:user-menus-tree', name: '查看用户菜单树', description: '获取用户菜单树' },
  {
    code: 'rbac:admin:user-permission-check',
    name: '用户权限检查',
    description: '检查用户单个权限',
  },
  {
    code: 'rbac:admin:user-permission-check-any',
    name: '用户权限任一检查',
    description: '检查用户是否拥有任一权限',
  },
  {
    code: 'rbac:admin:user-scopes-table',
    name: '查看用户表规则',
    description: '获取用户表级数据规则',
  },

  // ========== 角色菜单关联管理 (role-menu) ==========
  { code: 'role-menu:admin:batch', name: '批量设置角色菜单', description: '批量设置角色菜单' },
  { code: 'role-menu:admin:create', name: '创建角色菜单关联', description: '为角色添加菜单' },
  { code: 'role-menu:admin:delete', name: '删除角色菜单关联', description: '删除角色菜单关联' },
  { code: 'role-menu:admin:list', name: '查看角色菜单列表', description: '获取角色菜单关联列表' },
  { code: 'role-menu:admin:read', name: '查看角色菜单详情', description: '获取角色菜单关联详情' },

  // ========== 角色权限关联管理 (role-permission) ==========
  {
    code: 'role-permission:admin:batch',
    name: '批量设置角色权限',
    description: '批量设置角色权限',
  },
  { code: 'role-permission:admin:create', name: '创建角色权限关联', description: '为角色添加权限' },
  {
    code: 'role-permission:admin:delete',
    name: '删除角色权限关联',
    description: '删除角色权限关联',
  },
  {
    code: 'role-permission:admin:list',
    name: '查看角色权限列表',
    description: '获取角色权限关联列表',
  },
  {
    code: 'role-permission:admin:read',
    name: '查看角色权限详情',
    description: '获取角色权限关联详情',
  },

  // ========== 角色管理权限 (role) ==========
  { code: 'role:admin:create', name: '创建角色', description: '创建新角色' },
  { code: 'role:admin:delete', name: '删除角色', description: '删除角色' },
  { code: 'role:admin:list', name: '查看角色列表', description: '获取角色列表' },
  { code: 'role:admin:read', name: '查看角色详情', description: '获取角色详情' },
  { code: 'role:admin:tree', name: '查看角色树', description: '获取角色树形结构' },
  { code: 'role:admin:update', name: '更新角色', description: '更新角色信息' },

  // ========== Seed管理权限 (seed) ==========
  { code: 'seed:admin:list', name: '查看Seed列表', description: '获取已注册的Seed列表' },
  { code: 'seed:admin:logs', name: '查看Seed日志', description: '获取Seed执行日志' },
  { code: 'seed:admin:reset', name: '重置Seed', description: '重置Seed执行记录' },
  { code: 'seed:admin:run', name: '执行Seed', description: '执行单个Seed' },
  { code: 'seed:admin:run-all', name: '执行所有Seed', description: '执行所有Seed' },

  // ========== 定时任务权限 (job) ==========
  { code: 'job:admin:create', name: '创建定时任务', description: '创建新定时任务' },
  { code: 'job:admin:delete', name: '删除定时任务', description: '删除定时任务' },
  { code: 'job:admin:list', name: '查看任务列表', description: '获取定时任务列表' },
  { code: 'job:admin:read', name: '查看任务详情', description: '获取定时任务详情' },
  { code: 'job:admin:run', name: '手动触发任务', description: '手动触发执行定时任务' },
  { code: 'job:admin:update', name: '更新定时任务', description: '更新定时任务配置' },

  // ========== 定时任务日志权限 (jobLog) ==========
  { code: 'jobLog:admin:clear', name: '清空任务日志', description: '清空任务执行日志' },
  { code: 'jobLog:admin:delete', name: '删除任务日志', description: '删除任务执行日志' },
  { code: 'jobLog:admin:list', name: '查看任务日志', description: '获取任务执行日志列表' },
  { code: 'jobLog:admin:read', name: '查看任务日志详情', description: '获取任务日志详情' },

  // ========== 用户管理权限 (user) ==========
  { code: 'user:admin:create', name: '创建用户', description: '创建新用户' },
  { code: 'user:admin:delete', name: '删除用户', description: '删除用户' },
  { code: 'user:admin:list', name: '查看用户列表', description: '获取用户列表' },
  { code: 'user:admin:read', name: '查看用户详情', description: '获取用户详情' },
  { code: 'user:admin:update', name: '更新用户', description: '更新用户信息' },
  { code: 'user:read', name: '查看个人信息', description: '获取当前用户信息' },

  // ========== VIP管理权限 (vip) ==========
  // 资源限制
  { code: 'vip:admin:resource-limit:create', name: '创建资源限制', description: '创建VIP资源限制' },
  { code: 'vip:admin:resource-limit:delete', name: '删除资源限制', description: '删除VIP资源限制' },
  {
    code: 'vip:admin:resource-limit:list',
    name: '查看资源限制列表',
    description: '获取VIP资源限制列表',
  },
  { code: 'vip:admin:resource-limit:update', name: '更新资源限制', description: '更新VIP资源限制' },
  // 资源使用
  { code: 'vip:admin:resource:check', name: '检查资源使用', description: '检查用户资源使用情况' },
  { code: 'vip:admin:resource:increment', name: '增加资源使用', description: '增加用户资源使用量' },
  {
    code: 'vip:admin:resource:usage',
    name: '查看资源使用详情',
    description: '获取用户资源使用详情',
  },
  // VIP等级
  { code: 'vip:admin:tier:create', name: '创建VIP等级', description: '创建VIP等级' },
  { code: 'vip:admin:tier:delete', name: '删除VIP等级', description: '删除VIP等级' },
  { code: 'vip:admin:tier:list', name: '查看VIP等级列表', description: '获取VIP等级列表' },
  { code: 'vip:admin:tier:read', name: '查看VIP等级详情', description: '获取VIP等级详情' },
  { code: 'vip:admin:tier:update', name: '更新VIP等级', description: '更新VIP等级信息' },
  // 用户VIP
  { code: 'vip:admin:user:cancel', name: '取消用户VIP', description: '取消用户VIP' },
  { code: 'vip:admin:user:confirm', name: '确认VIP绑定', description: '确认或取消VIP绑定' },
  { code: 'vip:admin:user:list', name: '查看用户VIP列表', description: '获取用户VIP列表' },
  { code: 'vip:admin:user:read', name: '查看用户VIP详情', description: '获取用户VIP详情' },
  { code: 'vip:admin:user:upgrade', name: '升级用户VIP', description: '升级用户VIP等级' },
  {
    code: 'vip:admin:user:upgrade-direct',
    name: '直接升级用户VIP',
    description: '直接升级用户VIP等级',
  },

  // ========== 限流管理权限 (rateLimit) ==========
  // 限流规则
  { code: 'rateLimit:admin:rule:list', name: '查看限流规则列表', description: '获取限流规则列表' },
  { code: 'rateLimit:admin:rule:read', name: '查看限流规则详情', description: '获取限流规则详情' },
  { code: 'rateLimit:admin:rule:create', name: '创建限流规则', description: '创建新限流规则' },
  { code: 'rateLimit:admin:rule:update', name: '更新限流规则', description: '更新限流规则' },
  { code: 'rateLimit:admin:rule:delete', name: '删除限流规则', description: '删除限流规则' },
  // IP黑名单
  { code: 'rateLimit:admin:blacklist:list', name: '查看IP黑名单列表', description: '获取IP黑名单列表' },
  { code: 'rateLimit:admin:blacklist:read', name: '查看IP黑名单详情', description: '获取IP黑名单详情' },
  { code: 'rateLimit:admin:blacklist:create', name: '添加IP黑名单', description: '手动添加IP到黑名单' },
  { code: 'rateLimit:admin:blacklist:update', name: '更新IP黑名单', description: '更新IP黑名单/解封' },
  { code: 'rateLimit:admin:blacklist:delete', name: '删除IP黑名单', description: '删除IP黑名单记录' },
]

/** 权限表 Seed */
export const permissionSeed: SeedDefinition = {
  name: 'permission-default',
  description: '初始化默认权限数据（基于 scopes.json）',
  async run() {
    let created = 0
    let skipped = 0

    for (const permission of defaultPermissions) {
      // 检查是否已存在
      const existing = await Permission.findOne({ where: where().eq('code', permission.code) })
      if (existing) {
        skipped++
        continue
      }
      await Permission.create(permission)
      created++
    }

    console.log(`✅ 权限初始化完成: 创建 ${created} 个, 跳过 ${skipped} 个已存在`)
  },
}

export default permissionSeed
