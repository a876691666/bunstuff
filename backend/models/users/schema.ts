import { column } from "../../packages/orm";
import type { SchemaDefinition } from "../../packages/orm";

/** 用户表 Schema */
const schema = {
  /** 用户 ID */
  id: column.number().primaryKey().autoIncrement(),
  /** 用户名 */
  username: column.string(),
  /** 密码 */
  password: column.string(),
  /** 昵称 */
  nickname: column.string().nullable(),
  /** 电子邮件 */
  email: column.string().nullable(),
  /** 手机号 */
  phone: column.string().nullable(),
  /** 头像 */
  avatar: column.string().nullable(),
  /** 状态: 0-禁用 1-启用 */
  status: column.number().default(1),
  /** 角色ID (外键) */
  roleId: column.number(),
  /** 创建时间 */
  createdAt: column.date(),
  /** 更新时间 */
  updatedAt: column.date(),
} satisfies SchemaDefinition;

export default schema;
