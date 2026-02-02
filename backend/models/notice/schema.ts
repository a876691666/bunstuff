import { TimestampSchema, column } from '../../packages/orm'

/** 通知公告表 Schema */
export default class NoticeSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement()
  /** 公告标题 */
  title = column.string().default('')
  /** 公告内容 */
  content = column.string().default('')
  /** 公告类型 (字典: sys_notice_type) */
  type = column.string().default('1')
  /** 状态: 0-关闭 1-正常 */
  status = NoticeSchema.status(1)
  /** 创建者ID */
  createBy = column.number().default(0)
  /** 备注 */
  remark = column.string().nullable().default(null)
}
