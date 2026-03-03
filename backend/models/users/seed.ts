import type { SeedDefinition } from '@/services/seed'
import { model } from '@/core/model'

/** 默认用户数据 */
const defaultUsers = [
  {
    username: 'admin',
    password: 'admin123', // TODO: 实际使用时应加密
    nickname: '超级管理员',
    email: 'admin@example.com',
    phone: '13800000000',
    avatar: null,
    status: 1,
    roleId: 'super-admin',
  },
  {
    username: 'manager',
    password: 'manager123',
    nickname: '管理员',
    email: 'manager@example.com',
    phone: '13800000001',
    avatar: null,
    status: 1,
    roleId: 'admin',
  },
  {
    username: 'user',
    password: 'user123',
    nickname: '普通用户',
    email: 'user@example.com',
    phone: '13800000002',
    avatar: null,
    status: 1,
    roleId: 'user'
  },
]

/** 用户表 Seed */
export const userSeed: SeedDefinition = {
  name: 'user-default',
  description: '初始化默认用户数据',
  async run() {
    for (const user of defaultUsers) {
      await model.users.create(user)
    }
    console.log(`✅ 已创建 ${defaultUsers.length} 个默认用户`)
  },
}

export default userSeed
