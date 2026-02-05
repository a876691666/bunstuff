import { TimestampSchema, column } from '../../packages/orm'

/** VIP 资源限制表 Schema */
export default class VipResourceLimitSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** VIP 等级 ID */
  vipTierId = column.number().default(0).description('VIP等级ID')
  /** 资源键（如：scene:create） */
  resourceKey = column.string().default('').description('资源键')
  /** 限制值（-1 表示无限制） */
  limitValue = column.number().default(-1).description('限制值,-1表示无限')
  /** 描述 */
  description = column.string().nullable().default(null).description('描述')
}
