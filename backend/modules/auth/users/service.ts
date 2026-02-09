import User from '@/models/users'
import { CrudService } from '@/modules/crud-service'

/** 用户服务 */
export class UserService extends CrudService<typeof User.schema> {
  constructor() {
    super(User)
  }

  /** 根据用户名获取用户 */
  async findByUsername(username: string) {
    return await this.model.findOne({ where: `username = '${username}'` })
  }
}

export const userService = new UserService()
