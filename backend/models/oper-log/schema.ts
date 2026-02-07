import { Schema, column } from '../../packages/orm'

/** 操作日志表 Schema */
export default class OperLogSchema extends Schema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 模块标题 */
  title = column.string().default('').description('模块标题')
  /** 操作类型: create/update/delete/export/import/query/clear/other */
  type = column.string().default('other').description('操作类型')
  /** 请求方法 (GET/POST/PUT/DELETE) */
  method = column.string().default('').description('请求方法')
  /** 请求URL */
  url = column.string().default('').description('请求URL')
  /** 操作IP */
  ip = column.string().nullable().default(null).description('操作IP')
  /** 请求参数 (JSON) */
  params = column.string().nullable().default(null).description('请求参数')
  /** 返回结果 (JSON, 截断) */
  result = column.string().nullable().default(null).description('返回结果')
  /** 状态: 0-失败 1-成功 */
  status = OperLogSchema.status(1).description('状态：1成功 0失败')
  /** 错误消息 */
  errorMsg = column.string().nullable().default(null).description('错误消息')
  /** 操作者ID */
  userId = column.number().nullable().default(null).description('操作者ID')
  /** 操作者用户名 */
  username = column.string().default('').description('操作者用户名')
  /** 耗时(ms) */
  costTime = column.number().default(0).description('耗时(ms)')
  /** 操作时间 */
  operTime = column
    .date()
    .default(() => new Date())
    .description('操作时间')
}
