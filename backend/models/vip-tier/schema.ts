import { TimestampSchema, column } from '../../packages/orm'

/** VIP 等级表 Schema */
export default class VipTierSchema extends TimestampSchema {
  /** VIP 等级 ID */
  id = column.number().primaryKey().autoIncrement().description('VIP等级ID')
  /** VIP 名称 */
  name = column.string().default('').description('VIP名称')
  /** VIP 代码 */
  code = column.string().unique().default('').description('VIP代码')
  /** 默认绑定角色 ID */
  roleId = column.number().nullable().default(null).description('绑定角色ID')
  /** 价格 */
  price = column.number().default(0).description('价格')
  /** 有效期天数（0 表示永久） */
  durationDays = column.number().default(0).description('有效期天数')
  /** 状态: 0-禁用 1-启用 */
  status = VipTierSchema.status(1).description('状态：1启用 0禁用')
  /** 描述 */
  description = column.string().nullable().default(null).description('描述')
}
