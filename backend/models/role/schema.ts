import { TimestampSchema, column } from '../../packages/orm'

/** 角色表 Schema (树形结构) */
export default class RoleSchema extends TimestampSchema {
  /** 角色 ID */
  id = column.number().primaryKey().autoIncrement().description('角色ID')
  /** 父角色ID (自引用，用于树形结构) */
  parentId = column.number().nullable().default(null).description('父角色ID')
  /** 角色名称 */
  name = column.string().default('').description('角色名称')
  /** 角色编码 */
  code = column.string().unique().default('').description('角色编码')
  /** 状态: 0-禁用 1-启用 */
  status = RoleSchema.status(1).description('状态：1启用 0禁用')
  /** 排序 */
  sort = RoleSchema.sort(0).description('排序值')
  /** 角色描述 */
  description = column.string().nullable().default(null).description('角色描述')
}
