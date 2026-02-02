import type { SeedDefinition } from '@/modules/seed'
import { where } from '@pkg/ssql'
import RoleMenu from './index'
import Role from '../role'
import Menu from '../menu'

/** 角色菜单关联 Seed */
export const roleMenuSeed: SeedDefinition = {
  name: 'role-menu-default',
  description: '初始化角色菜单关联数据',
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

    // 获取所有菜单
    const allMenus = await Menu.findMany({})

    // 超级管理员拥有所有菜单
    let count = 0
    for (const menu of allMenus) {
      await RoleMenu.create({
        roleId: superAdminRole.id,
        menuId: menu.id,
      })
      count++
    }
    console.log(`✅ 超级管理员已关联 ${count} 个菜单`)

    // 管理员也拥有所有菜单
    count = 0
    for (const menu of allMenus) {
      await RoleMenu.create({
        roleId: adminRole.id,
        menuId: menu.id,
      })
      count++
    }
    console.log(`✅ 管理员已关联 ${count} 个菜单`)

    // 普通用户只有用户管理菜单（系统管理目录 + 用户管理页面）
    const userMenus = allMenus.filter((m) => m.path === '/system' || m.path === '/system/user')
    count = 0
    for (const menu of userMenus) {
      await RoleMenu.create({
        roleId: userRole.id,
        menuId: menu.id,
      })
      count++
    }
    console.log(`✅ 普通用户已关联 ${count} 个菜单`)
  },
}

export default roleMenuSeed
