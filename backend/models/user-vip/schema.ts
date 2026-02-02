import { TimestampSchema, column } from '../../packages/orm'

/** 用户 VIP 表 Schema */
export default class UserVipSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement()
  /** 用户 ID */
  userId = column.number().default(0)
  /** VIP 等级 ID */
  vipTierId = column.number().default(0)
  /** 过期时间（NULL 表示永久） */
  expireTime = column.date().nullable().default(null)
  /** 状态: 0-禁用 1-启用 */
  status = UserVipSchema.status(1)
  /** 绑定回调状态: 0-待确认 1-已确认 */
  bindingStatus = column.number().default(0)
  /** 绑定时用户原角色ID（用于回滚） */
  originalRoleId = column.number().nullable().default(null)
}
