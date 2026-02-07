import { Schema, column } from '../../packages/orm'

/** 登录日志表 Schema */
export default class LoginLogSchema extends Schema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 用户ID */
  userId = column.number().nullable().default(null).description('用户ID')
  /** 用户名 */
  username = column.string().default('').description('用户名')
  /** IP地址 */
  ip = column.string().nullable().default(null).description('IP地址')
  /** 登录地点 */
  location = column.string().nullable().default(null).description('登录地点')
  /** 浏览器类型 */
  browser = column.string().nullable().default(null).description('浏览器类型')
  /** 操作系统 */
  os = column.string().nullable().default(null).description('操作系统')
  /** 登录状态: 0-失败 1-成功 */
  status = LoginLogSchema.status(1).description('登录状态：1成功 0失败')
  /** 操作类型: login-登录 logout-登出 kick-踢下线 */
  action = column.string().default('login').description('操作类型')
  /** 提示消息 */
  msg = column.string().nullable().default(null).description('提示消息')
  /** 登录时间 */
  loginTime = column
    .date()
    .default(() => new Date())
    .description('登录时间')
}
