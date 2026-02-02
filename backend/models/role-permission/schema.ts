import { Schema, column } from '../../packages/orm'

/** 角色权限关联表 Schema */
export default class RolePermissionSchema extends Schema {
  /** 关联 ID */
  id = column.number().primaryKey().autoIncrement()
  /** 角色ID (外键) */
  roleId = column.number().default(0)
  /** 权限ID (外键) */
  permissionId = column.number().default(0)
  /** 创建时间 */
  createdAt = Schema.createdAt()
}
