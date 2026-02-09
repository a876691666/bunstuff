/**
 * 定时任务服务 - 核心调度器
 * 支持：全局注册任务处理函数、Cron调度、手动触发
 */

import { Cron } from 'croner'
import Job from '@/models/job'
import JobLog from '@/models/job-log'
import type { Insert } from '@/packages/orm'
import { CrudService, type CrudContext, type PageQuery, type PageResult } from '@/modules/crud-service'

/** 任务处理函数类型 */
export type JobHandler = (params?: unknown) => Promise<void> | void

/** Cron任务定义 */
export interface CronJobDefinition {
  /** 唯一标识（handler+group） */
  handler: string
  group?: string
  /** 任务名称 */
  name: string
  /** Cron表达式 */
  cron: string
  /** 默认参数 */
  params?: unknown
  /** 备注 */
  remark?: string
}

/** 任务执行结果 */
export interface JobResult {
  success: boolean
  message?: string
  error?: string
}

class JobService extends CrudService<typeof Job.schema> {
  /** 已注册的处理函数 */
  private handlers = new Map<string, JobHandler>()
  /** 运行中的Cron实例 */
  private cronInstances = new Map<number, Cron>()
  /** 待同步的Cron任务定义 */
  private pendingCrons: CronJobDefinition[] = []
  /** 是否已启动 */
  private started = false

  constructor() {
    super(Job)
  }

  /** 注册任务处理函数 */
  register(handler: string, fn: JobHandler) {
    this.handlers.set(handler, fn)
    return this
  }

  /** 注册Cron任务（启动时自动同步入库） */
  registerCron(def: CronJobDefinition) {
    this.pendingCrons.push(def)
    return this
  }

  /** 获取处理函数 */
  getHandler(handler: string): JobHandler | undefined {
    return this.handlers.get(handler)
  }

  /** 获取所有已注册的handler名称 */
  getHandlerNames(): string[] {
    return Array.from(this.handlers.keys())
  }

  /** 启动调度器 */
  async start() {
    if (this.started) return
    this.started = true

    // 同步pendingCrons到数据库
    await this.syncCronsToDb()

    // 从数据库加载所有任务并启动
    const jobs = await Job.findMany({ where: `status = 1` })
    for (const job of jobs) {
      this.scheduleJob(job)
    }
    console.log(`✅ Job scheduler started: ${jobs.length} jobs`)
  }

  /** 停止调度器 */
  stop() {
    for (const cron of this.cronInstances.values()) {
      cron.stop()
    }
    this.cronInstances.clear()
    this.started = false
  }

  /** 同步注册的Cron任务到数据库 */
  private async syncCronsToDb() {
    for (const def of this.pendingCrons) {
      const group = def.group || 'default'
      const existing = await Job.findOne({
        where: `handler = '${def.handler}' && group = '${group}'`,
      })

      if (existing) {
        // 更新cron表达式和名称（如果代码有变更）
        if (existing.cron !== def.cron || existing.name !== def.name) {
          await Job.update(existing.id, {
            cron: def.cron,
            name: def.name,
            remark: def.remark || existing.remark,
          })
        }
      } else {
        // 创建新任务
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private scheduleJob(job: any) {
    if (this.cronInstances.has(job.id)) {
      this.cronInstances.get(job.id)!.stop()
    }

    const cron = new Cron(job.cron, async () => {
      await this.executeJob(job.id)
    })

    this.cronInstances.set(job.id, cron)
  }

  /** 执行任务 */
  async executeJob(jobId: number, manualParams?: unknown): Promise<JobResult> {
    const job = await Job.findOne({ where: `id = ${jobId}` })
    if (!job) return { success: false, error: '任务不存在' }

    const handler = this.handlers.get(job.handler)
    if (!handler) return { success: false, error: `处理函数 ${job.handler} 未注册` }

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

      return { success: false, error: errorMsg }
    }
  }

  /** 触发任务（by handler） */
  async trigger(handler: string, params?: unknown): Promise<JobResult> {
    const job = await Job.findOne({ where: `handler = '${handler}'` })
    if (!job) return { success: false, error: `任务 ${handler} 不存在` }
    return this.executeJob(job.id, params)
  }

  /** 启用任务 */
  async enable(jobId: number) {
    await Job.update(jobId, { status: 1 })
    const job = await Job.findOne({ where: `id = ${jobId}` })
    if (job) this.scheduleJob(job)
  }

  /** 禁用任务 */
  async disable(jobId: number) {
    await Job.update(jobId, { status: 0 })
    if (this.cronInstances.has(jobId)) {
      this.cronInstances.get(jobId)!.stop()
      this.cronInstances.delete(jobId)
    }
  }

  /** 重新加载单个任务 */
  async reload(jobId: number) {
    const job = await Job.findOne({ where: `id = ${jobId}` })
    if (!job) return

    if (job.status === 1) {
      this.scheduleJob(job)
    } else {
      if (this.cronInstances.has(jobId)) {
        this.cronInstances.get(jobId)!.stop()
        this.cronInstances.delete(jobId)
      }
    }
  }

  // ============ CRUD 操作 ============

  override async findAll(query?: PageQuery, ctx?: CrudContext) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize
    const where = this.buildWhere(query?.filter, ctx)

    const data = await Job.findMany({
      where,
      limit: pageSize,
      offset,
      orderBy: [{ column: 'id', order: 'DESC' }],
    })
    const total = await Job.count(where)

    return { data, total, page, pageSize }
  }

  override async findById(id: number, ctx?: CrudContext) {
    return await super.findById(id, ctx)
  }

  override async create(data: Insert<typeof Job>, ctx?: CrudContext) {
    const result = await super.create(data, ctx)
    if (result && data.status === 1) {
      this.scheduleJob(result)
    }
    return result
  }

  override async update(id: number, data: Partial<Insert<typeof Job>>, ctx?: CrudContext) {
    const result = await super.update(id, data, ctx)
    if (result) await this.reload(id)
    return result
  }

  override async delete(id: number, ctx?: CrudContext) {
    if (this.cronInstances.has(id)) {
      this.cronInstances.get(id)!.stop()
      this.cronInstances.delete(id)
    }
    return await super.delete(id, ctx)
  }
}

export const jobService = new JobService()

// ============ 注册默认任务处理函数 ============

import { sessionStore } from '@/modules/auth'

// 清理过期会话
jobService.register('clearExpiredSessions', async () => {
  await sessionStore.cleanup()
  console.log('✅ Cleared expired sessions')
})

// 注册默认Cron任务
jobService.registerCron({
  handler: 'clearExpiredSessions',
  group: 'system',
  name: '清理过期会话',
  cron: '0 2 * * *',
  remark: '每天凌晨2点清理过期会话',
})
