import { TimestampSchema, column } from '../../packages/orm'

/** VIP 资源限制表 Schema */
export default class VipResourceLimitSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement()
  /** VIP 等级 ID */
  vipTierId = column.number().default(0)
  /** 资源键（如：scene:create） */
  resourceKey = column.string().default('')
  /** 限制值（-1 表示无限制） */
  limitValue = column.number().default(-1)
  /** 描述 */
  description = column.string().nullable().default(null)
}
