import { TimestampSchema, column } from '../../packages/orm'

/** 用户 VIP 表 Schema */
export default class UserVipSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 用户 ID */
  userId = column.number().default(0).description('用户ID')
  /** VIP 等级 ID */
  vipTierId = column.number().default(0).description('VIP等级ID')
  /** 过期时间（NULL 表示永久） */
  expireTime = column.date().nullable().default(null).description('过期时间')
  /** 状态: 0-禁用 1-启用 */
  status = UserVipSchema.status(1).description('状态：1启用 0禁用')
  /** 绑定回调状态: 0-待确认 1-已确认 */
  bindingStatus = column.number().default(0).description('绑定状态：0待确认 1已确认')
  /** 绑定时用户原角色ID（用于回滚） */
  originalRoleId = column.number().nullable().default(null).description('原角色ID')
}
