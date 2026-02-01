import { column } from "../../packages/orm";
import type { SchemaDefinition } from "../../packages/orm";

/** 会话表 Schema */
const schema = {
  /** 会话 ID (主键) */
  id: column.number().primaryKey().autoIncrement(),
  /** 会话令牌 (唯一索引) */
  token: column.string().unique(),
  /** 用户 ID */
  userId: column.number(),
  /** 用户名 */
  username: column.string(),
  /** 角色 ID */
  roleId: column.number(),
  /** IP 地址 */
  ip: column.string().nullable(),
  /** User-Agent */
  userAgent: column.string().nullable(),
  /** 创建时间 */
  createdAt: column.date(),
  /** 过期时间 */
  expiresAt: column.date(),
  /** 最后活跃时间 */
  lastActiveAt: column.date(),
} satisfies SchemaDefinition;

export default schema;
