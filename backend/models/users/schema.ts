import { TimestampSchema, column } from "../../packages/orm";

/** 用户表 Schema */
export default class UsersSchema extends TimestampSchema {
  /** 用户 ID */
  id = column.number().primaryKey().autoIncrement();
  /** 用户名 */
  username = column.string().default("");
  /** 密码 */
  password = column.string().default("").deserialize((v) => Bun.password.hash(v));
  /** 昵称 */
  nickname = column.string().nullable().default(null);
  /** 电子邮件 */
  email = column.string().nullable().default(null);
  /** 手机号 */
  phone = column.string().nullable().default(null);
  /** 头像 */
  avatar = column.string().nullable().default(null);
  /** 状态: 0-禁用 1-启用 */
  status = UsersSchema.status(1);
  /** 角色ID (外键) */
  roleId = column.number().default(0);
}
