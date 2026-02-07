import OperLog from '@/models/oper-log'

/** 操作类型 */
export type OperType =
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'query'
  | 'clear'
  | 'other'

/** 操作日志服务 */
export class OperLogService {
  /** 获取操作日志列表 */
  async findAll(query?: { page?: number; pageSize?: number; filter?: string }) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize

    const data = await OperLog.findMany({
      where: query?.filter,
      limit: pageSize,
      offset,
      orderBy: [{ column: 'operTime', order: 'DESC' }],
    })
    const total = await OperLog.count(query?.filter)

    return { data, total, page, pageSize }
  }

  /** 根据ID获取操作日志 */
  async findById(id: number) {
    return await OperLog.findOne({ where: `id = ${id}` })
  }

  /** 删除操作日志 */
  async delete(id: number) {
    return await OperLog.delete(id)
  }

  /** 清空操作日志 */
  async clear() {
    return await OperLog.truncate()
  }

  /** 清理N天前的操作日志 */
  async clearBefore(days: number) {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return await OperLog.deleteMany(`operTime < '${date.toISOString()}'`)
  }

  /** 记录操作日志 */
  async log(data: {
    title: string
    type?: OperType
    method?: string
    url?: string
    ip?: string | null
    params?: string | null
    result?: string | null
    status?: 0 | 1
    errorMsg?: string | null
    userId?: number | null
    username?: string
    costTime?: number
  }) {
    // 截断过长的参数和结果（最多2000字符）
    const params =
      data.params && data.params.length > 2000 ? data.params.slice(0, 2000) + '...' : data.params
    const result =
      data.result && data.result.length > 2000 ? data.result.slice(0, 2000) + '...' : data.result

    return await OperLog.create({
      title: data.title,
      type: data.type ?? 'other',
      method: data.method ?? '',
      url: data.url ?? '',
      ip: data.ip ?? null,
      params: params ?? null,
      result: result ?? null,
      status: data.status ?? 1,
      errorMsg: data.errorMsg ?? null,
      userId: data.userId ?? null,
      username: data.username ?? '',
      costTime: data.costTime ?? 0,
      operTime: new Date(),
    })
  }
}

export const operLogService = new OperLogService()
