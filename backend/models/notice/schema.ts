import { TimestampSchema, column } from '../../packages/orm'

/** 通知公告表 Schema */
export default class NoticeSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 公告标题 */
  title = column.string().default('').description('公告标题')
  /** 公告内容 */
  content = column.string().default('').description('公告内容')
  /** 公告类型 (字典: sys_notice_type) */
  type = column.string().default('1').description('公告类型')
  /** 状态: 0-关闭 1-正常 */
  status = NoticeSchema.status(1).description('状态：1正常 0关闭')
  /** 创建者ID */
  createBy = column.number().default(0).description('创建者ID')
  /** 备注 */
  remark = column.string().nullable().default(null).description('备注')
}
