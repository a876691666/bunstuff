import type { SeedDefinition } from '@/services/seed'
import { model } from '@/core/model'

/** 默认角色数据 */
const defaultRoles = [
  {
    id: 'super-admin',
    name: '超级管理员',
    status: 1,
    sort: 0,
    description: '系统超级管理员，拥有所有权限',
  },
  {
    id: 'admin',
    name: '管理员',
    status: 1,
    sort: 1,
    description: '系统管理员，拥有大部分管理权限',
  },
  {
    id: 'user',
    name: '普通用户',
    status: 1,
    sort: 2,
    description: '普通用户，拥有基础权限',
  },
]

/** 角色表 Seed */
export const roleSeed: SeedDefinition = {
  name: 'role-default',
  description: '初始化默认角色数据',
  async run() {
    for (const role of defaultRoles) {
      await model.role.create(role)
    }
    console.log(`✅ 已创建 ${defaultRoles.length} 个默认角色`)
  },
}

export default roleSeed
