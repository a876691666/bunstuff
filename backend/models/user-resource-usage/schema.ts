import { TimestampSchema, column } from '../../packages/orm'

/** 用户资源使用表 Schema */
export default class UserResourceUsageSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 用户 ID */
  userId = column.number().default(0).description('用户ID')
  /** 资源键 */
  resourceKey = column.string().default('').description('资源键')
  /** 已使用数量 */
  usageCount = column.number().default(0).description('已使用数量')
}
