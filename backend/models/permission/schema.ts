import { TimestampSchema, column } from '../../packages/orm'

/** 权限表 Schema */
export default class PermissionSchema extends TimestampSchema {
  /** 权限 ID */
  id = column.number().primaryKey().autoIncrement()
  /** 权限名称 */
  name = column.string().default('')
  /** 权限编码 */
  code = column.string().unique().default('')
  /** 资源标识 */
  resource = column.string().nullable().default(null)
  /** 权限描述 */
  description = column.string().nullable().default(null)
}
