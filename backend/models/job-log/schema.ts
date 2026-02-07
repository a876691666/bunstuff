import { Schema, column } from '../../packages/orm'

/** 任务执行日志表 Schema */
export default class JobLogSchema extends Schema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 任务ID */
  jobId = column.number().default(0).description('任务ID')
  /** 任务名称 */
  jobName = column.string().default('').description('任务名称')
  /** 处理器标识 */
  handler = column.string().default('').description('处理器标识')
  /** 日志信息 */
  message = column.string().nullable().default(null).description('日志信息')
  /** 状态: 0-失败 1-成功 */
  status = JobLogSchema.status(1).description('状态：1成功 0失败')
  /** 错误消息 */
  errorMsg = column.string().nullable().default(null).description('错误消息')
  /** 开始时间 */
  startTime = column.string().default('').description('开始时间')
  /** 结束时间 */
  endTime = column.string().default('').description('结束时间')
  /** 耗时(ms) */
  costTime = column.number().default(0).description('耗时(ms)')
}
