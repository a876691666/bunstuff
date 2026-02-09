import OperLog from '@/models/oper-log'
import { CrudService } from '@/modules/crud-service'

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
export class OperLogService extends CrudService<typeof OperLog.schema> {
  constructor() {
    super(OperLog)
  }

  /** 清空操作日志 */
  async clear() {
    return await this.model.truncate()
  }

  /** 清理N天前的操作日志 */
  async clearBefore(days: number) {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return await this.model.deleteMany(`operTime < '${date.toISOString()}'`)
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
