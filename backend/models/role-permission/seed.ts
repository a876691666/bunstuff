import type { SeedDefinition } from '../../modules/seed/service'
import { where } from '@pkg/ssql'
import RolePermission from './index'
import Role from '../role'
import Permission from '../permission'

/** 角色权限关联 Seed */
export const rolePermissionSeed: SeedDefinition = {
  name: 'role-permission-default',
  description: '初始化角色权限关联数据（超级管理员拥有所有权限）',
  async run() {
    // 获取超级管理员角色
    const superAdminRole = await Role.findOne({ where: where().eq('code', 'super-admin') })
    if (!superAdminRole) {
      throw new Error('超级管理员角色不存在，请先执行 role-default seed')
    }

    // 获取管理员角色
    const adminRole = await Role.findOne({ where: where().eq('code', 'admin') })
    if (!adminRole) {
      throw new Error('管理员角色不存在，请先执行 role-default seed')
    }

    // 获取普通用户角色
    const userRole = await Role.findOne({ where: where().eq('code', 'user') })
    if (!userRole) {
      throw new Error('普通用户角色不存在，请先执行 role-default seed')
    }

    // 获取所有权限
    const allPermissions = await Permission.findMany({})

    // 超级管理员拥有所有权限
    let count = 0
    for (const permission of allPermissions) {
      await RolePermission.create({
        roleId: superAdminRole.id,
        permissionId: permission.id,
      })
      count++
    }
    console.log(`✅ 超级管理员已关联 ${count} 个权限`)

    // 管理员拥有除 seed 管理外的所有权限
    const adminPermissions = allPermissions.filter((p) => !p.code.startsWith('seed:'))
    count = 0
    for (const permission of adminPermissions) {
      await RolePermission.create({
        roleId: adminRole.id,
        permissionId: permission.id,
      })
      count++
    }
    console.log(`✅ 管理员已关联 ${count} 个权限`)

    // 普通用户只有查看权限
    const userPermissions = allPermissions.filter(
      (p) => p.code.endsWith(':list') || p.code.endsWith(':read') || p.code.endsWith(':tree'),
    )
    count = 0
    for (const permission of userPermissions) {
      await RolePermission.create({
        roleId: userRole.id,
        permissionId: permission.id,
      })
      count++
    }
    console.log(`✅ 普通用户已关联 ${count} 个权限`)
  },
}

export default rolePermissionSeed
