import { TimestampSchema, column } from '../../packages/orm'

export const tableName = 'role'

/** 角色表 Schema (扁平结构, 无继承) */
export default class RoleSchema extends TimestampSchema {
  /** 角色编码（主键） */
  id = column.string().primaryKey().description('角色编码')
  /** 角色名称 */
  name = column.string().default('').description('角色名称')
  /** 状态: 0-禁用 1-启用 */
  status = RoleSchema.status(1).description('状态：1启用 0禁用')
  /** 排序 */
  sort = RoleSchema.sort(0).description('排序值')
  /** 角色描述 */
  description = column.string().nullable().default(null).description('角色描述')
}
