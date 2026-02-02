import { TimestampSchema, column } from '../../packages/orm'

/** VIP 等级表 Schema */
export default class VipTierSchema extends TimestampSchema {
  /** VIP 等级 ID */
  id = column.number().primaryKey().autoIncrement()
  /** VIP 名称 */
  name = column.string().default('')
  /** VIP 代码 */
  code = column.string().unique().default('')
  /** 默认绑定角色 ID */
  roleId = column.number().nullable().default(null)
  /** 价格 */
  price = column.number().default(0)
  /** 有效期天数（0 表示永久） */
  durationDays = column.number().default(0)
  /** 状态: 0-禁用 1-启用 */
  status = VipTierSchema.status(1)
  /** 描述 */
  description = column.string().nullable().default(null)
}
