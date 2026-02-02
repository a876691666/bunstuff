import type { SeedDefinition } from '../../modules/seed/service'
import Permission from './index'

/** 默认权限数据 */
const defaultPermissions = [
  // 认证管理权限
  {
    code: 'auth:admin',
    name: '认证管理',
    resource: '/api/auth/admin',
    description: '管理端认证相关操作',
  },

  // 用户管理权限
  { code: 'user:list', name: '查看用户列表', resource: '/api/users', description: '获取用户列表' },
  {
    code: 'user:read',
    name: '查看用户详情',
    resource: '/api/users/:id',
    description: '获取用户详细信息',
  },
  { code: 'user:create', name: '创建用户', resource: '/api/users', description: '创建新用户' },
  {
    code: 'user:update',
    name: '更新用户',
    resource: '/api/users/:id',
    description: '更新用户信息',
  },
  { code: 'user:delete', name: '删除用户', resource: '/api/users/:id', description: '删除用户' },

  // 角色管理权限
  { code: 'role:list', name: '查看角色列表', resource: '/api/role', description: '获取角色列表' },
  {
    code: 'role:read',
    name: '查看角色详情',
    resource: '/api/role/:id',
    description: '获取角色详细信息',
  },
  {
    code: 'role:tree',
    name: '查看角色树',
    resource: '/api/role/tree',
    description: '获取角色树形结构',
  },
  { code: 'role:create', name: '创建角色', resource: '/api/role', description: '创建新角色' },
  { code: 'role:update', name: '更新角色', resource: '/api/role/:id', description: '更新角色信息' },
  { code: 'role:delete', name: '删除角色', resource: '/api/role/:id', description: '删除角色' },

  // 权限管理权限
  {
    code: 'permission:list',
    name: '查看权限列表',
    resource: '/api/permission',
    description: '获取权限列表',
  },
  {
    code: 'permission:read',
    name: '查看权限详情',
    resource: '/api/permission/:id',
    description: '获取权限详细信息',
  },
  {
    code: 'permission:create',
    name: '创建权限',
    resource: '/api/permission',
    description: '创建新权限',
  },
  {
    code: 'permission:update',
    name: '更新权限',
    resource: '/api/permission/:id',
    description: '更新权限信息',
  },
  {
    code: 'permission:delete',
    name: '删除权限',
    resource: '/api/permission/:id',
    description: '删除权限',
  },

  // 菜单管理权限
  { code: 'menu:list', name: '查看菜单列表', resource: '/api/menu', description: '获取菜单列表' },
  {
    code: 'menu:read',
    name: '查看菜单详情',
    resource: '/api/menu/:id',
    description: '获取菜单详细信息',
  },
  {
    code: 'menu:tree',
    name: '查看菜单树',
    resource: '/api/menu/tree',
    description: '获取菜单树形结构',
  },
  { code: 'menu:create', name: '创建菜单', resource: '/api/menu', description: '创建新菜单' },
  { code: 'menu:update', name: '更新菜单', resource: '/api/menu/:id', description: '更新菜单信息' },
  { code: 'menu:delete', name: '删除菜单', resource: '/api/menu/:id', description: '删除菜单' },

  // 数据权限规则管理
  {
    code: 'permission-scope:list',
    name: '查看数据规则列表',
    resource: '/api/permission-scope',
    description: '获取数据过滤规则列表',
  },
  {
    code: 'permission-scope:read',
    name: '查看数据规则详情',
    resource: '/api/permission-scope/:id',
    description: '获取数据过滤规则详细信息',
  },
  {
    code: 'permission-scope:create',
    name: '创建数据规则',
    resource: '/api/permission-scope',
    description: '创建新数据过滤规则',
  },
  {
    code: 'permission-scope:update',
    name: '更新数据规则',
    resource: '/api/permission-scope/:id',
    description: '更新数据过滤规则信息',
  },
  {
    code: 'permission-scope:delete',
    name: '删除数据规则',
    resource: '/api/permission-scope/:id',
    description: '删除数据过滤规则',
  },

  // 角色权限关联管理
  {
    code: 'role-permission:list',
    name: '查看角色权限列表',
    resource: '/api/role-permission',
    description: '获取角色权限关联列表',
  },
  {
    code: 'role-permission:read',
    name: '查看角色权限详情',
    resource: '/api/role-permission/:id',
    description: '获取角色权限关联详情',
  },
  {
    code: 'role-permission:create',
    name: '创建角色权限关联',
    resource: '/api/role-permission',
    description: '为角色添加权限',
  },
  {
    code: 'role-permission:batch',
    name: '批量设置角色权限',
    resource: '/api/role-permission/batch',
    description: '批量设置角色权限',
  },
  {
    code: 'role-permission:delete',
    name: '删除角色权限关联',
    resource: '/api/role-permission/:id',
    description: '删除角色权限关联',
  },

  // 角色菜单关联管理
  {
    code: 'role-menu:list',
    name: '查看角色菜单列表',
    resource: '/api/role-menu',
    description: '获取角色菜单关联列表',
  },
  {
    code: 'role-menu:read',
    name: '查看角色菜单详情',
    resource: '/api/role-menu/:id',
    description: '获取角色菜单关联详情',
  },
  {
    code: 'role-menu:create',
    name: '创建角色菜单关联',
    resource: '/api/role-menu',
    description: '为角色添加菜单',
  },
  {
    code: 'role-menu:batch',
    name: '批量设置角色菜单',
    resource: '/api/role-menu/batch',
    description: '批量设置角色菜单',
  },
  {
    code: 'role-menu:delete',
    name: '删除角色菜单关联',
    resource: '/api/role-menu/:id',
    description: '删除角色菜单关联',
  },

  // RBAC 管理权限
  {
    code: 'rbac:admin',
    name: 'RBAC管理',
    resource: '/api/rbac/admin',
    description: 'RBAC权限管理相关操作',
  },

  // Seed管理权限
  {
    code: 'seed:logs',
    name: '查看Seed日志',
    resource: '/api/seed/logs',
    description: '获取Seed执行日志',
  },
  {
    code: 'seed:list',
    name: '查看Seed列表',
    resource: '/api/seed/registered',
    description: '获取已注册的Seed列表',
  },
  { code: 'seed:run', name: '执行Seed', resource: '/api/seed/run', description: '执行Seed' },
  {
    code: 'seed:reset',
    name: '重置Seed',
    resource: '/api/seed/reset',
    description: '重置Seed执行记录',
  },

  // VIP 等级管理权限
  {
    code: 'vip:tier:list',
    name: '查看VIP等级列表',
    resource: '/api/vip/tier',
    description: '获取VIP等级列表',
  },
  {
    code: 'vip:tier:read',
    name: '查看VIP等级详情',
    resource: '/api/vip/tier/:id',
    description: '获取VIP等级详细信息',
  },
  {
    code: 'vip:tier:create',
    name: '创建VIP等级',
    resource: '/api/vip/tier',
    description: '创建新VIP等级',
  },
  {
    code: 'vip:tier:update',
    name: '更新VIP等级',
    resource: '/api/vip/tier/:id',
    description: '更新VIP等级信息',
  },
  {
    code: 'vip:tier:delete',
    name: '删除VIP等级',
    resource: '/api/vip/tier/:id',
    description: '删除VIP等级',
  },

  // VIP 资源限制管理权限
  {
    code: 'vip:resource-limit:list',
    name: '查看资源限制列表',
    resource: '/api/vip/tier/:id/resource-limits',
    description: '获取VIP等级资源限制列表',
  },
  {
    code: 'vip:resource-limit:create',
    name: '创建资源限制',
    resource: '/api/vip/resource-limit',
    description: '创建资源限制',
  },
  {
    code: 'vip:resource-limit:update',
    name: '更新资源限制',
    resource: '/api/vip/resource-limit/:id',
    description: '更新资源限制',
  },
  {
    code: 'vip:resource-limit:delete',
    name: '删除资源限制',
    resource: '/api/vip/resource-limit/:id',
    description: '删除资源限制',
  },

  // 用户 VIP 管理权限
  {
    code: 'vip:user:list',
    name: '查看用户VIP列表',
    resource: '/api/vip/user-vips',
    description: '获取用户VIP列表',
  },
  {
    code: 'vip:user:read',
    name: '查看用户VIP详情',
    resource: '/api/vip/user/:userId',
    description: '获取用户VIP详细信息',
  },
  {
    code: 'vip:user:upgrade',
    name: '升级用户VIP',
    resource: '/api/vip/upgrade',
    description: '升级用户VIP等级',
  },
  {
    code: 'vip:user:confirm',
    name: '确认VIP绑定',
    resource: '/api/vip/confirm-binding',
    description: '确认或取消VIP绑定',
  },
  {
    code: 'vip:user:cancel',
    name: '取消用户VIP',
    resource: '/api/vip/cancel/:userId',
    description: '取消用户VIP',
  },

  // 资源使用管理权限
  {
    code: 'vip:resource:check',
    name: '检查资源使用',
    resource: '/api/vip/resource/check',
    description: '检查用户资源使用情况',
  },
  {
    code: 'vip:resource:increment',
    name: '增加资源使用',
    resource: '/api/vip/resource/increment',
    description: '增加用户资源使用量',
  },
  {
    code: 'vip:resource:usage',
    name: '查看资源使用详情',
    resource: '/api/vip/resource/usage/:userId',
    description: '获取用户资源使用详情',
  },
]

/** 权限表 Seed */
export const permissionSeed: SeedDefinition = {
  name: 'permission-default',
  description: '初始化默认权限数据',
  async run() {
    for (const permission of defaultPermissions) {
      await Permission.create(permission)
    }
    console.log(`✅ 已创建 ${defaultPermissions.length} 个默认权限`)
  },
}

export default permissionSeed
