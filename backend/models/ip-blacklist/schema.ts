import { TimestampSchema, column } from '../../packages/orm'

/**
 * IP黑名单表 Schema
 *
 * 记录被封禁的IP地址，支持手动和自动封禁
 */
export default class IpBlacklistSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** IP地址 */
  ip = column.string().default('').description('IP地址')
  /** 封禁原因 */
  reason = column.string().default('').description('封禁原因')
  /** 封禁来源: manual-手动 auto-自动（触发限流阈值） */
  source = column.string().default('manual').description('封禁来源：manual/auto')
  /** 触发的限流规则ID（自动封禁时记录） */
  ruleId = column.number().nullable().default(null).description('触发的限流规则ID')
  /** 触发次数（自动封禁时的累计触发次数） */
  triggerCount = column.number().default(0).description('触发次数')
  /** 封禁过期时间（null表示永久封禁） */
  expireAt = column.date().nullable().default(null).description('过期时间')
  /** 状态: 0-已解封 1-封禁中 */
  status = IpBlacklistSchema.status(1).description('状态：1封禁中 0已解封')
  /** 备注 */
  remark = column.string().nullable().default(null).description('备注')
}
