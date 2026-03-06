import { Cron } from 'croner'
import { model } from '@/core/model'
import type { Insert } from '@/packages/orm'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'

const Job = model.job
const JobLog = model.job_log

// ============ 类型定义 ============

/** 任务处理函数类型 */
export type JobHandler = (params?: unknown) => Promise<void> | void

/** Cron任务定义 */
export interface CronJobDefinition {
  handler: string
  group?: string
  name: string
  cron: string
  params?: unknown
  remark?: string
}

/** 任务执行结果 */
export interface JobResult {
  success: boolean
  message?: string
  error?: string
}

// ============ 内部状态 ============

const handlers = new Map<string, JobHandler>()
const cronInstances = new Map<number, Cron>()
const pendingCrons: CronJobDefinition[] = []
let started = false

// ============ CRUD 操作 ============

/** 获取任务列表 */
export async function findAll(query?: PageQuery, ctx?: CrudContext) {
  const page = query?.page ?? 1
  const pageSize = query?.pageSize ?? 10
  const offset = (page - 1) * pageSize
  const where = buildWhere(Job.tableName, query?.filter, ctx)

  const data = await Job.findMany({
    where,
    limit: pageSize,
    offset,
    orderBy: [{ column: 'id', order: 'DESC' }],
  })
  const total = await Job.count(where)

  return { data, total, page, pageSize }
}

/** 获取任务详情 */
export async function findById(id: number, ctx?: CrudContext) {
  return Job.findOne({ where: buildWhere(Job.tableName, `id = ${id}`, ctx) })
}

/** 创建任务 */
export async function create(data: Insert<typeof Job>, ctx?: CrudContext) {
  if (!checkCreateScope(Job.tableName, data as Record<string, any>, ctx)) return null
  const result = await Job.create(data)
  if (result && data.status === 1) {
    scheduleJob(result)
  }
  return result
}

/** 更新任务 */
export async function update(id: number, data: Partial<Insert<typeof Job>>, ctx?: CrudContext) {
  const w = buildWhere(Job.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await Job.updateMany(w, data)
  if (n === 0) return null
  const result = await Job.getOne(id as any)
  if (result) await reload(id)
  return result
}

/** 删除任务 */
export async function remove(id: number, ctx?: CrudContext) {
  if (cronInstances.has(id)) {
    cronInstances.get(id)!.stop()
    cronInstances.delete(id)
  }
  const w = buildWhere(Job.tableName, `id = ${id}`, ctx)
  if (!w) return false
  return (await Job.deleteMany(w)) > 0
}

// ============ 注册 ============

/** 注册任务处理函数 */
export function register(handler: string, fn: JobHandler) {
  handlers.set(handler, fn)
}

/** 注册Cron任务（启动时自动同步入库） */
export function registerCron(def: CronJobDefinition) {
  pendingCrons.push(def)
}

/** 获取处理函数 */
export function getHandler(handler: string): JobHandler | undefined {
  return handlers.get(handler)
}

/** 获取所有已注册的handler名称 */
export function getHandlerNames(): string[] {
  return Array.from(handlers.keys())
}

// ============ 调度器 ============

/** 初始化调度器 */
export async function init() {
  if (started) return
  started = true

  await syncCronsToDb()

  const jobs = await Job.findMany({ where: `status = 1` })
  for (const job of jobs) {
    scheduleJob(job)
  }
}

/** 停止调度器 */
export function stop() {
  for (const cron of cronInstances.values()) {
    cron.stop()
  }
  cronInstances.clear()
  started = false
}

/** 同步注册的Cron任务到数据库 */
async function syncCronsToDb() {
  for (const def of pendingCrons) {
    const group = def.group || 'default'
    const existing = await Job.findOne({
      where: `handler = '${def.handler}' && group = '${group}'`,
    })

    if (existing) {
      if (existing.cron !== def.cron || existing.name !== def.name) {
        await Job.update(existing.id, {
          cron: def.cron,
          name: def.name,
          remark: def.remark || existing.remark,
        })
      }
    } else {
      await Job.create({
        handler: def.handler,
        group,
        name: def.name,
        cron: def.cron,
        params: def.params ? JSON.stringify(def.params) : null,
        remark: def.remark || null,
        status: 1,
      })
    }
  }
}

/** 调度单个任务 */
function scheduleJob(job: any) {
  if (cronInstances.has(job.id)) {
    cronInstances.get(job.id)!.stop()
  }

  const cron = new Cron(job.cron, async () => {
    await executeJob(job.id)
  })

  cronInstances.set(job.id, cron)
}

/** 执行任务 */
export async function executeJob(jobId: number, manualParams?: unknown): Promise<JobResult> {
  const job = await Job.findOne({ where: `id = ${jobId}` })
  if (!job) throw new Error('任务不存在')

  const handler = handlers.get(job.handler)
  if (!handler) throw new Error(`处理函数 ${job.handler} 未注册`)

  const startTime = new Date()
  const params = manualParams ?? (job.params ? JSON.parse(job.params) : undefined)

  try {
    await handler(params)
    const endTime = new Date()
    const costTime = endTime.getTime() - startTime.getTime()

    await JobLog.create({
      jobId: job.id,
      jobName: job.name,
      handler: job.handler,
      message: '执行成功',
      status: 1,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      costTime,
    })

    return { success: true, message: '执行成功' }
  } catch (err) {
    const endTime = new Date()
    const costTime = endTime.getTime() - startTime.getTime()
    const errorMsg = err instanceof Error ? err.message : String(err)

    await JobLog.create({
      jobId: job.id,
      jobName: job.name,
      handler: job.handler,
      message: '执行失败',
      status: 0,
      errorMsg,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      costTime,
    })

    throw new Error(errorMsg)
  }
}

/** 触发任务（by handler） */
export async function trigger(handler: string, params?: unknown): Promise<JobResult> {
  const job = await Job.findOne({ where: `handler = '${handler}'` })
  if (!job) throw new Error(`任务 ${handler} 不存在`)
  return executeJob(job.id, params)
}

/** 启用任务 */
export async function enable(jobId: number) {
  await Job.update(jobId, { status: 1 })
  const job = await Job.findOne({ where: `id = ${jobId}` })
  if (job) scheduleJob(job)
}

/** 禁用任务 */
export async function disable(jobId: number) {
  await Job.update(jobId, { status: 0 })
  if (cronInstances.has(jobId)) {
    cronInstances.get(jobId)!.stop()
    cronInstances.delete(jobId)
  }
}

/** 重新加载单个任务 */
export async function reload(jobId: number) {
  const job = await Job.findOne({ where: `id = ${jobId}` })
  if (!job) return

  if (job.status === 1) {
    scheduleJob(job)
  } else {
    if (cronInstances.has(jobId)) {
      cronInstances.get(jobId)!.stop()
      cronInstances.delete(jobId)
    }
  }
}

// ============ 注册默认任务处理函数 ============

import * as session from '@/services/session'

// 清理过期会话
register('clearExpiredSessions', async () => {
  await session.cleanup()
  console.log('✅ Cleared expired sessions')
})

// 注册默认Cron任务
registerCron({
  handler: 'clearExpiredSessions',
  group: 'system',
  name: '清理过期会话',
  cron: '0 2 * * *',
  remark: '每天凌晨2点清理过期会话',
})
/** Schema 代理 */

export const getLogSchema: (typeof JobLog)['getSchema'] = JobLog.getSchema.bind(JobLog)
