import { Elysia } from 'elysia'
import * as jobService from '@/services/job'
import type { JobResult } from '@/services/job'

/** 任务上下文 */
export interface JobContext {
  /** 触发任务（by handler） */
  trigger: (handler: string, params?: unknown) => Promise<JobResult>
  /** 执行任务（by id） */
  execute: (jobId: number, params?: unknown) => Promise<JobResult>
  /** 获取所有已注册的handler */
  getHandlers: () => string[]
}

/**
 * 定时任务插件
 *
 * @example
 * ```ts
 * app
 *   .use(jobPlugin())
 *   .post("/trigger-cleanup", async ({ job }) => {
 *     const result = await job.trigger("clearExpiredSessions");
 *     return result;
 *   })
 * ```
 */
export function jobPlugin() {
  return new Elysia({ name: 'job-plugin' }).derive({ as: 'global' }, () => {
    const job: JobContext = {
      trigger: (handler, params) => jobService.trigger(handler, params),
      execute: (jobId, params) => jobService.executeJob(jobId, params),
      getHandlers: () => jobService.getHandlerNames(),
    }
    return { job }
  })
}
