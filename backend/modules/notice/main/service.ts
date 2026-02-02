import { where, parse } from '@pkg/ssql'
import Notice from '@/models/notice'
import NoticeRead from '@/models/notice-read'
import type { NoticeInsert, NoticeUpdate, NoticeRow } from '@/models/notice'

/** SSE 连接管理 */
class NoticeSSE {
  private connections = new Map<number, Set<ReadableStreamDefaultController<any>>>()

  /** 添加连接 */
  addConnection(userId: number, controller: ReadableStreamDefaultController<any>) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set())
    }
    this.connections.get(userId)!.add(controller)
  }

  /** 移除连接 */
  removeConnection(userId: number, controller: ReadableStreamDefaultController<any>) {
    this.connections.get(userId)?.delete(controller)
    if (this.connections.get(userId)?.size === 0) {
      this.connections.delete(userId)
    }
  }

  /** 广播新公告给所有用户 */
  broadcast(notice: NoticeRow) {
    const data = `data: ${JSON.stringify({ type: 'new', notice })}\n\n`
    for (const [, controllers] of this.connections) {
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
  sendToUser(userId: number, event: string, data: any) {
    const controllers = this.connections.get(userId)
    if (!controllers) return
    const message = `data: ${JSON.stringify({ type: event, ...data })}\n\n`
    for (const controller of controllers) {
      try {
        controller.enqueue(new TextEncoder().encode(message))
      } catch {
        // 忽略已关闭的连接
      }
    }
  }
}

export const noticeSSE = new NoticeSSE()

/** 通知公告服务 */
export class NoticeService {
  /** 获取通知公告列表 */
  async findAll(query?: {
    page?: number
    pageSize?: number
    filter?: string
  }) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize

    // 解析 ssql 过滤条件
    const whereClause = query?.filter ? where().expr(parse(query.filter)) : where()

    const data = await Notice.findMany({
      where: whereClause,
      limit: pageSize,
      offset,
      orderBy: [{ column: 'createdAt', order: 'DESC' }],
    })
    const total = await Notice.count(whereClause)

    return { data, total, page, pageSize }
  }

  /** 根据ID获取通知公告 */
  async findById(id: number) {
    return await Notice.findOne({ where: where().eq('id', id) })
  }

  /** 创建通知公告 */
  async create(data: NoticeInsert, createBy: number) {
    const result = await Notice.create({ ...data, createBy })
    // 广播新公告
    if (result.status === 1) {
      noticeSSE.broadcast(result)
    }
    return result
  }

  /** 更新通知公告 */
  async update(id: number, data: NoticeUpdate) {
    return await Notice.update(id, data)
  }

  /** 删除通知公告 */
  async delete(id: number) {
    // 删除关联的已读记录
    await NoticeRead.deleteMany(where().eq('noticeId', id))
    return await Notice.delete(id)
  }

  /** 发布通知（状态改为正常并广播） */
  async publish(id: number) {
    const notice = await this.findById(id)
    if (!notice) return null
    const result = await Notice.update(id, { status: 1 })
    if (result) {
      noticeSSE.broadcast(result)
    }
    return result
  }

  /** 获取用户的通知列表（带已读状态） */
  async findAllForUser(
    userId: number,
    query?: { page?: number; pageSize?: number; isRead?: boolean },
  ) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize

    // 获取正常状态的公告
    const notices = await Notice.findMany({
      where: where().eq('status', 1),
      limit: pageSize,
      offset,
      orderBy: [{ column: 'createdAt', order: 'DESC' }],
    })

    // 获取用户的已读记录
    const readRecords = await NoticeRead.findMany({
      where: where().eq('userId', userId),
    })
    const readMap = new Map(readRecords.map((r) => [r.noticeId, r.readAt]))

    // 组合数据
    const data = notices.map((notice) => ({
      ...notice,
      isRead: readMap.has(notice.id),
      readAt: readMap.get(notice.id)?.toISOString() || null,
    }))

    const total = await Notice.count(where().eq('status', 1))

    return { data, total, page, pageSize }
  }

  /** 标记通知已读 */
  async markAsRead(noticeId: number, userId: number) {
    // 检查是否已读
    const existing = await NoticeRead.findOne({
      where: where().eq('noticeId', noticeId).and().eq('userId', userId),
    })
    if (existing) return existing

    return await NoticeRead.create({
      noticeId,
      userId,
      readAt: new Date(),
    })
  }

  /** 批量标记已读 */
  async markAllAsRead(userId: number) {
    const notices = await Notice.findMany({ where: where().eq('status', 1) })
    for (const notice of notices) {
      await this.markAsRead(notice.id, userId)
    }
    return { count: notices.length }
  }

  /** 获取未读数量 */
  async getUnreadCount(userId: number): Promise<number> {
    const totalNotices = await Notice.count(where().eq('status', 1))
    const readCount = await NoticeRead.count(where().eq('userId', userId))
    return Math.max(0, totalNotices - readCount)
  }
}

export const noticeService = new NoticeService()
