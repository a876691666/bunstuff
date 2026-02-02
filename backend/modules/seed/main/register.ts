/**
 * Seeds 注册入口
 * 在此处注册所有的 Seed 定义
 */
import { seedService } from './service'

// 导入所有 Seed 定义
import roleSeed from '@/models/role/seed'
import permissionSeed from '@/models/permission/seed'
import menuSeed from '@/models/menu/seed'
import userSeed from '@/models/users/seed'
import rolePermissionSeed from '@/models/role-permission/seed'
import roleMenuSeed from '@/models/role-menu/seed'
import permissionScopeSeed from '@/models/permission-scope/seed'
import vipTierSeed from '@/models/vip-tier/seed'
import vipResourceLimitSeed from '@/models/vip-resource-limit/seed'

// System 模块 Seeds
import { dictTypeSeed } from '@/models/dict-type/seed'
import { dictDataSeed } from '@/models/dict-data/seed'
import { sysConfigSeed } from '@/models/sys-config/seed'

// Notice 模块 Seeds
import { noticeSeed } from '@/models/notice/seed'

/**
 * 注册所有 Seeds
 * 注意：Seeds 按顺序执行，需要注意依赖关系
 * 1. role-default: 先创建角色
 * 2. permission-default: 创建权限
 * 3. menu-default: 创建菜单
 * 4. user-default: 创建用户（依赖角色）
 * 5. role-permission-default: 关联角色权限（依赖角色和权限）
 * 6. role-menu-default: 关联角色菜单（依赖角色和菜单）
 * 7. permission-scope-default: 创建数据过滤规则（依赖权限）
 * 8. vip-tier-default: 创建 VIP 等级
 * 9. vip-resource-limit-default: 创建 VIP 资源限制（依赖 VIP 等级）
 * 10. dict-type-init: 创建字典类型
 * 11. dict-data-init: 创建字典数据（依赖字典类型）
 * 12. sys-config-init: 创建系统参数配置
 * 13. notice-init: 创建示例通知公告
 */
export function registerSeeds() {
  seedService.registerMany([
    roleSeed,
    permissionSeed,
    menuSeed,
    userSeed,
    rolePermissionSeed,
    roleMenuSeed,
    permissionScopeSeed,
    vipTierSeed,
    vipResourceLimitSeed,
    // System 模块
    dictTypeSeed,
    dictDataSeed,
    sysConfigSeed,
    // Notice 模块
    noticeSeed,
  ])

  console.log('✅ Seeds registered')
}

export { seedService }
