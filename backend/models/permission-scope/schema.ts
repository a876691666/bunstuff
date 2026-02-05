import { TimestampSchema, column } from '../../packages/orm'

/** 数据过滤规则表 Schema */
export default class PermissionScopeSchema extends TimestampSchema {
  /** 规则 ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 权限ID (外键) */
  permissionId = column.number().default(0).description('权限ID')
  /** 规则名称 */
  name = column.string().default('').description('规则名称')
  /** 规则指向的表名 */
  tableName = column.string().default('').description('表名')
  /** SSQL过滤表达式，例如: dept_id == $user.dept_id */
  ssqlRule = column.string().default('').description('SSQL过滤表达式')
  /** 规则描述 */
  description = column.string().nullable().default(null).description('规则描述')
}
