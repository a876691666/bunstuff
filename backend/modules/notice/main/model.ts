import { t } from 'elysia'

// ============ 通知公告模型 ============

/** 通知公告信息模型 */
export const NoticeSchema = t.Object({
  id: t.Number({ description: 'ID' }),
  title: t.String({ description: '公告标题' }),
  content: t.String({ description: '公告内容' }),
  type: t.String({ description: '公告类型（字典：sys_notice_type）' }),
  status: t.Number({ description: '状态：1正常 0关闭' }),
  createBy: t.Number({ description: '创建者ID' }),
  remark: t.Nullable(t.String({ description: '备注' })),
  createdAt: t.String({ description: '创建时间' }),
  updatedAt: t.String({ description: '更新时间' }),
})

/** 通知公告（带已读状态） */
export const NoticeWithReadSchema = t.Object({
  id: t.Number({ description: 'ID' }),
  title: t.String({ description: '公告标题' }),
  content: t.String({ description: '公告内容' }),
  type: t.String({ description: '公告类型' }),
  status: t.Number({ description: '状态' }),
  createBy: t.Number({ description: '创建者ID' }),
  remark: t.Nullable(t.String({ description: '备注' })),
  createdAt: t.String({ description: '创建时间' }),
  updatedAt: t.String({ description: '更新时间' }),
  isRead: t.Boolean({ description: '是否已读' }),
  readAt: t.Optional(t.Nullable(t.String({ description: '阅读时间' }))),
})

/** 创建通知公告请求 */
export const createNoticeBody = t.Object({
  title: t.String({ description: '公告标题', minLength: 1, maxLength: 200 }),
  content: t.String({ description: '公告内容' }),
  type: t.Optional(t.String({ description: '公告类型', default: '1' })),
  status: t.Optional(t.Number({ description: '状态', default: 1 })),
  remark: t.Optional(t.Nullable(t.String({ description: '备注', maxLength: 500 }))),
})

/** 更新通知公告请求 */
export const updateNoticeBody = t.Object({
  title: t.Optional(t.String({ description: '公告标题', minLength: 1, maxLength: 200 })),
  content: t.Optional(t.String({ description: '公告内容' })),
  type: t.Optional(t.String({ description: '公告类型' })),
  status: t.Optional(t.Number({ description: '状态' })),
  remark: t.Optional(t.Nullable(t.String({ description: '备注', maxLength: 500 }))),
})

/** 通知公告ID参数 */
export const noticeIdParams = t.Object({
  id: t.Numeric({ description: '通知公告ID' }),
})

/** 通知公告查询参数 */
export const noticeQueryParams = t.Object({
  page: t.Optional(t.Numeric({ description: '页码', default: 1, minimum: 1 })),
  pageSize: t.Optional(t.Numeric({ description: '每页条数', default: 10, minimum: 1 })),
  filter: t.Optional(t.String({ description: 'SSQL过滤条件' })),
})
