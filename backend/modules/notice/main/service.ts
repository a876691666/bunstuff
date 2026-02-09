import type { Row, Insert, Update } from '@/packages/orm'
import Notice from '@/models/notice'
import NoticeRead from '@/models/notice-read'
import { CrudService, type CrudContext } from '@/modules/crud-service'

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
  broadcast(notice: Row<typeof Notice>) {
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
export class NoticeService extends CrudService<typeof Notice.schema> {
  constructor() {
    super(Notice)
  }

  /** 创建通知公告（覆盖基类，附加广播逻辑） */
  override async create(data: Insert<typeof Notice>, ctx?: CrudContext) {
    const result = await super.create(data, ctx)
    // 广播新公告
    if (result && result.status === 1) {
      noticeSSE.broadcast(result)
    }
    return result
  }

  /** 删除通知公告（覆盖基类，同时删除关联已读记录） */
  override async delete(id: number, ctx?: CrudContext) {
    await NoticeRead.deleteMany(`noticeId = ${id}`)
    return await super.delete(id, ctx)
  }

  /** 更新通知公告（覆盖基类，状态变为正常时广播） */
  override async update(id: number, data: Update<typeof Notice>, ctx?: CrudContext) {
    const result = await super.update(id, data, ctx)
    if (result && result.status === 1 && data.status === 1) {
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
    const notices = await this.model.findMany({
      where: `status = 1`,
      limit: pageSize,
      offset,
      orderBy: [{ column: 'createdAt', order: 'DESC' }],
    })

    // 获取用户的已读记录
    const readRecords = await NoticeRead.findMany({
      where: `userId = ${userId}`,
    })
    const readMap = new Map(readRecords.map((r) => [r.noticeId, r.readAt]))

    // 组合数据
    const data = notices.map((notice) => ({
      ...notice,
      isRead: readMap.has(notice.id),
      readAt: readMap.get(notice.id)?.toISOString() || null,
    }))

    const total = await this.model.count(`status = 1`)

    return { data, total, page, pageSize }
  }

  /** 标记通知已读 */
  async markAsRead(noticeId: number, userId: number) {
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
  async markAllAsRead(userId: number) {
    const notices = await this.model.findMany({ where: `status = 1` })
    for (const notice of notices) {
      await this.markAsRead(notice.id, userId)
    }
    return { count: notices.length }
  }

  /** 获取未读数量 */
  async getUnreadCount(userId: number): Promise<number> {
    const totalNotices = await this.model.count(`status = 1`)
    const readCount = await NoticeRead.count(`userId = ${userId}`)
    return Math.max(0, totalNotices - readCount)
  }
}

export const noticeService = new NoticeService()
