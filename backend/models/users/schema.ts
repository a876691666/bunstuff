import { TimestampSchema, column } from '../../packages/orm'

/** 用户表 Schema */
export default class UsersSchema extends TimestampSchema {
  /** 用户 ID */
  id = column.number().primaryKey().autoIncrement().description('用户ID')
  /** 用户名 */
  username = column.string().default('').description('用户名')
  /** 密码 */
  password = column
    .string()
    .default('')
    .description('密码')
    .deserialize((v) => Bun.password.hash(v))
  /** 昵称 */
  nickname = column.string().nullable().default(null).description('昵称')
  /** 电子邮件 */
  email = column.string().nullable().default(null).description('邮箱')
  /** 手机号 */
  phone = column.string().nullable().default(null).description('手机号')
  /** 头像 */
  avatar = column.string().nullable().default(null).description('头像URL')
  /** 状态: 0-禁用 1-启用 */
  status = UsersSchema.status(1).description('状态：1启用 0禁用')
  /** 角色ID (外键) */
  roleId = column.number().default(0).description('角色ID')
}
