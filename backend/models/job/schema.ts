import { TimestampSchema, column } from '../../packages/orm'

/** 定时任务表 Schema */
export default class JobSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 任务名称 */
  name = column.string().default('').description('任务名称')
  /** 任务分组 */
  group = column.string().default('default').description('任务分组')
  /** 处理器标识（对应代码中注册的 handler key） */
  handler = column.string().default('').description('处理器标识')
  /** Cron 表达式 (分 时 日 月 周) */
  cron = column.string().default('').description('Cron表达式')
  /** 执行参数 (JSON) */
  params = column.string().nullable().default(null).description('执行参数(JSON)')
  /** 状态: 0-暂停 1-运行 */
  status = JobSchema.status(1).description('状态：1运行 0暂停')
  /** 备注 */
  remark = column.string().nullable().default(null).description('备注')
}
