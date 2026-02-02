import { Schema, column } from "../../packages/orm";

/** 登录日志表 Schema */
export default class LoginLogSchema extends Schema {
  /** ID */
  id = column.number().primaryKey().autoIncrement();
  /** 用户ID */
  userId = column.number().nullable().default(null);
  /** 用户名 */
  username = column.string().default("");
  /** IP地址 */
  ip = column.string().nullable().default(null);
  /** 登录地点 */
  location = column.string().nullable().default(null);
  /** 浏览器类型 */
  browser = column.string().nullable().default(null);
  /** 操作系统 */
  os = column.string().nullable().default(null);
  /** 登录状态: 0-失败 1-成功 */
  status = LoginLogSchema.status(1);
  /** 操作类型: login-登录 logout-登出 kick-踢下线 */
  action = column.string().default("login");
  /** 提示消息 */
  msg = column.string().nullable().default(null);
  /** 登录时间 */
  loginTime = column.date().default(() => new Date());
}
