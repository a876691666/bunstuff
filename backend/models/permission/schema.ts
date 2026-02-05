import { TimestampSchema, column } from '../../packages/orm'

/** 权限表 Schema */
export default class PermissionSchema extends TimestampSchema {
  /** 权限 ID */
  id = column.number().primaryKey().autoIncrement().description('权限ID')
  /** 权限名称 */
  name = column.string().default('').description('权限名称')
  /** 权限编码 */
  code = column.string().unique().default('').description('权限编码')
  /** 资源标识 */
  resource = column.string().nullable().default(null).description('资源标识')
  /** 权限描述 */
  description = column.string().nullable().default(null).description('权限描述')
}
