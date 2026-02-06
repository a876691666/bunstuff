
import type { Insert, Update } from '@/packages/orm'
import User from '@/models/users'

/** 用户服务 */
export class UserService {
  /** 获取所有用户 */
  async findAll(query?: {
    page?: number
    pageSize?: number
    filter?: string
  }) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize

    const data = await User.findMany({
      where: query?.filter,
      limit: pageSize,
      offset,
    })

    const total = await User.count(query?.filter)

    return {
      data,
      total,
      page,
      pageSize,
    }
  }

  /** 根据ID获取用户 */
  async findById(id: number) {
    return await User.findOne({ where: `id = ${id}` })
  }

  /** 根据用户名获取用户 */
  async findByUsername(username: string) {
    return await User.findOne({ where: `username = '${username}'` })
  }

  /** 创建用户 */
  async create(data: Insert<typeof User>) {
    // TODO: 密码加密
    return await User.create(data)
  }

  /** 更新用户 */
  async update(id: number, data: Update<typeof User>) {
    // TODO: 如果更新密码，需要加密
    return await User.update(id, data)
  }

  /** 删除用户 */
  async delete(id: number) {
    return await User.delete(id)
  }
}

export const userService = new UserService()
