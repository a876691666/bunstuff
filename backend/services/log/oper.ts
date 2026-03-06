import { model } from '@/core/model'
import { buildWhere, type CrudContext, type PageQuery } from '@/core/crud'

const OperLog = model.oper_log

export type OperType =
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'query'
  | 'clear'
  | 'other'

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return OperLog.page({
    where: buildWhere(OperLog.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return OperLog.findOne({ where: buildWhere(OperLog.tableName, `id = ${id}`, ctx) })
}

export async function remove(id: number, ctx?: CrudContext) {
  const w = buildWhere(OperLog.tableName, `id = ${id}`, ctx)
  return w ? (await OperLog.deleteMany(w)) > 0 : false
}

export async function clear() {
  return await OperLog.truncate()
}

export async function clearBefore(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return await OperLog.deleteMany(`operTime < '${date.toISOString()}'`)
}

export async function log(data: {
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

/** Schema 代理 */

