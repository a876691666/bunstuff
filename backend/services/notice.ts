/**
 * 通知公告服务 - 独立函数形式
 */

import type { Row, Insert, Update } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'

const Notice = model.notice
const NoticeRead = model.notice_read

// ============ SSE 连接管理 ============

const connections = new Map<number, Set<ReadableStreamDefaultController<any>>>()

/** 添加SSE连接 */
export function addConnection(userId: number, controller: ReadableStreamDefaultController<any>) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set())
  }
  connections.get(userId)!.add(controller)
}

/** 移除SSE连接 */
export function removeConnection(userId: number, controller: ReadableStreamDefaultController<any>) {
  connections.get(userId)?.delete(controller)
  if (connections.get(userId)?.size === 0) {
    connections.delete(userId)
  }
}

/** 广播新公告给所有用户 */
export function broadcast(notice: Row<typeof Notice>) {
  const data = `data: ${JSON.stringify({ type: 'new', notice })}\n\n`
  for (const [, controllers] of connections) {
    for (const controller of controllers) {
      try {
        controller.enqueue(new TextEncoder().encode(data))
      } catch {
        // 忽略已关闭的连接
      }
    }
  }
}

/** 发送给指定用户 */
export function sendToUser(userId: number, event: string, data: any) {
  const ctrls = connections.get(userId)
  if (!ctrls) return
  const message = `data: ${JSON.stringify({ type: event, ...data })}\n\n`
  for (const controller of ctrls) {
    try {
      controller.enqueue(new TextEncoder().encode(message))
    } catch {
      // 忽略已关闭的连接
    }
  }
}

// ============ CRUD 操作 ============

/** 获取通知列表 */
export function findAll(query?: PageQuery, ctx?: CrudContext) {
  return Notice.page({
    where: buildWhere(Notice.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

/** 获取通知详情 */
export function findById(id: number, ctx?: CrudContext) {
  return Notice.findOne({ where: buildWhere(Notice.tableName, `id = ${id}`, ctx) })
}

/** 创建通知公告（附加广播逻辑） */
export async function create(data: Insert<typeof Notice>, ctx?: CrudContext) {
  if (!checkCreateScope(Notice.tableName, data as Record<string, any>, ctx)) return null
  const result = await Notice.create(data)
  if (result && result.status === 1) {
    broadcast(result)
  }
  return result
}

/** 更新通知公告（状态变为正常时广播） */
export async function update(id: number, data: Update<typeof Notice>, ctx?: CrudContext) {
  const w = buildWhere(Notice.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await Notice.updateMany(w, data)
  if (n === 0) return null
  const result = await Notice.getOne(id as any)
  if (result && result.status === 1 && data.status === 1) {
    broadcast(result)
  }
  return result
}

/** 删除通知公告（同时删除关联已读记录） */
export async function remove(id: number, ctx?: CrudContext) {
  await NoticeRead.deleteMany(`noticeId = ${id}`)
  const w = buildWhere(Notice.tableName, `id = ${id}`, ctx)
  if (!w) return false
  return (await Notice.deleteMany(w)) > 0
}

// ============ 用户通知 ============

/** 获取用户的通知列表（带已读状态） */
export async function findAllForUser(
  userId: number,
  query?: { page?: number; pageSize?: number; isRead?: boolean },
) {
  const page = query?.page ?? 1
  const pageSize = query?.pageSize ?? 10
  const offset = (page - 1) * pageSize

  const notices = await Notice.findMany({
    where: `status = 1`,
    limit: pageSize,
    offset,
    orderBy: [{ column: 'createdAt', order: 'DESC' }],
  })

  const readRecords = await NoticeRead.findMany({
    where: `userId = ${userId}`,
  })
  const readMap = new Map(readRecords.map((r) => [r.noticeId, r.readAt]))

  const data = notices.map((notice) => ({
    ...notice,
    isRead: readMap.has(notice.id),
    readAt: readMap.get(notice.id)?.toISOString() || null,
  }))

  const total = await Notice.count(`status = 1`)

  return { data, total, page, pageSize }
}

/** 标记通知已读 */
export async function markAsRead(noticeId: number, userId: number) {
  const existing = await NoticeRead.findOne({
    where: `noticeId = ${noticeId} && userId = ${userId}`,
  })
  if (existing) return existing

  return await NoticeRead.create({
    noticeId,
    userId,
    readAt: new Date(),
  })
}

/** 批量标记已读 */
export async function markAllAsRead(userId: number) {
  const notices = await Notice.findMany({ where: `status = 1` })
  for (const notice of notices) {
    await markAsRead(notice.id, userId)
  }
  return { count: notices.length }
}

/** 获取未读数量 */
export async function getUnreadCount(userId: number): Promise<number> {
  const totalNotices = await Notice.count(`status = 1`)
  const readCount = await NoticeRead.count(`userId = ${userId}`)
  return Math.max(0, totalNotices - readCount)
}

/** Schema 代理 */
export const getSchema: (typeof Notice)['getSchema'] = Notice.getSchema.bind(Notice)
