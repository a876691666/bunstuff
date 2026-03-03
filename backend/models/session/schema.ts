import { Schema, column } from '../../packages/orm'

export const tableName = 'session'

/** 会话表 Schema */
export default class SessionSchema extends Schema {
  /** 会话 ID (主键) */
  id = column.number().primaryKey().autoIncrement()
  /** 会话令牌 (唯一索引) */
  token = column.string().unique().default('')
  /** 用户 ID */
  userId = column.number().default(0)
  /** 用户名 */
  username = column.string().default('')
  /** 角色 ID（角色编码） */
  roleId = column.string().default('')
  /** IP 地址 */
  ip = column.string().nullable().default(null)
  /** User-Agent */
  userAgent = column.string().nullable().default(null)
  /** 创建时间 */
  createdAt = Schema.createdAt()
  /** 过期时间 */
  expiresAt = column.date().default(() => new Date())
  /** 最后活跃时间 */
  lastActiveAt = column.date().default(() => new Date())
}
