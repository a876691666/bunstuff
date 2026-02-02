import { Schema, column } from '../../packages/orm'

/** 通知已读记录表 Schema */
export default class NoticeReadSchema extends Schema {
  /** ID */
  id = column.number().primaryKey().autoIncrement()
  /** 公告ID */
  noticeId = column.number().default(0)
  /** 用户ID */
  userId = column.number().default(0)
  /** 阅读时间 */
  readAt = column.date().default(() => new Date())
}
