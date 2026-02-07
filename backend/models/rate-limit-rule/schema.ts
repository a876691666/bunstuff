import { TimestampSchema, column } from '../../packages/orm'

/**
 * 限流规则表 Schema
 *
 * 限流模式说明:
 * - time_window: 时间窗口限流，在指定时间窗口内限制请求次数
 * - concurrent: 并发限流，限制同一IP同时进行的请求数
 * - sliding_window: 滑动窗口限流，更精确的时间窗口限流
 */
export default class RateLimitRuleSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 规则名称 */
  name = column.string().default('').description('规则名称')
  /** 规则编码（唯一标识） */
  code = column.string().unique().default('').description('规则编码')
  /** 限流模式: time_window-时间窗口 concurrent-并发限流 sliding_window-滑动窗口 */
  mode = column.string().default('time_window').description('限流模式：time_window/concurrent/sliding_window')
  /** 匹配路径（支持通配符，如 /api/admin/* 或精确匹配 /api/auth/login） */
  pathPattern = column.string().default('/**').description('匹配路径模式')
  /** 请求方法（*表示全部，或GET,POST等逗号分隔） */
  method = column.string().default('*').description('请求方法：*或GET,POST等')
  /** 限流维度: ip-按IP global-全局 user-按用户 */
  dimension = column.string().default('ip').description('限流维度：ip/global/user')
  /** 时间窗口（秒），用于 time_window 和 sliding_window 模式 */
  windowSeconds = column.number().default(60).description('时间窗口（秒）')
  /** 窗口内最大请求数 */
  maxRequests = column.number().default(100).description('最大请求数')
  /** 最大并发数，用于 concurrent 模式 */
  maxConcurrent = column.number().default(10).description('最大并发数')
  /** IP黑名单自动封禁阈值（0表示不自动封禁，>0表示连续触发N次后加入黑名单） */
  blacklistThreshold = column.number().default(0).description('黑名单自动封禁阈值')
  /** 触发限流后的响应码 */
  responseCode = column.number().default(429).description('响应状态码')
  /** 触发限流后的提示消息 */
  responseMessage = column.string().default('请求过于频繁，请稍后再试').description('响应消息')
  /** 优先级（越小越优先） */
  priority = column.number().default(100).description('优先级')
  /** 状态: 0-禁用 1-启用 */
  status = RateLimitRuleSchema.status(1).description('状态：1启用 0禁用')
  /** 备注 */
  remark = column.string().nullable().default(null).description('备注')
}
