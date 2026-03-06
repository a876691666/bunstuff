import { model } from '@/core/model'
import { buildWhere, type CrudContext, type PageQuery } from '@/core/crud'

const JobLog = model.job_log

/** 获取日志列表 */
export function findAll(query?: PageQuery, ctx?: CrudContext) {
  return JobLog.page({
    where: buildWhere(JobLog.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

/** 获取日志详情 */
export function findById(id: number, ctx?: CrudContext) {
  return JobLog.findOne({ where: buildWhere(JobLog.tableName, `id = ${id}`, ctx) })
}

/** 删除日志 */
export async function remove(id: number, ctx?: CrudContext) {
  const w = buildWhere(JobLog.tableName, `id = ${id}`, ctx)
  return w ? (await JobLog.deleteMany(w)) > 0 : false
}

/** 清空任务日志 */
export async function clear(jobId?: number) {
  if (jobId) {
    return await JobLog.deleteMany(`jobId = ${jobId}`)
  }
  return await JobLog.truncate()
}

/** Schema 代理 */

