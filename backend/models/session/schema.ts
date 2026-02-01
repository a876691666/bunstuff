import { Schema, column } from "../../packages/orm";

/** 会话表 Schema */
export default class SessionSchema extends Schema {
  /** 会话 ID (主键) */
  id = column.number().primaryKey().autoIncrement();
  /** 会话令牌 (唯一索引) */
  token = column.string().unique().default("");
  /** 用户 ID */
  userId = column.number().default(0);
  /** 用户名 */
  username = column.string().default("");
  /** 角色 ID */
  roleId = column.number().default(0);
  /** IP 地址 */
  ip = column.string().nullable().default(null);
  /** User-Agent */
  userAgent = column.string().nullable().default(null);
  /** 创建时间 */
  createdAt = Schema.createdAt();
  /** 过期时间 */
  expiresAt = column.date().default(() => new Date());
  /** 最后活跃时间 */
  lastActiveAt = column.date().default(() => new Date());
}
