import JobLog from '@/models/job-log'
import { CrudService } from '@/modules/crud-service'

/** 任务日志服务 */
export class JobLogService extends CrudService<typeof JobLog.schema> {
  constructor() {
    super(JobLog)
  }

  /** 清空任务日志 */
  async clear(jobId?: number) {
    if (jobId) {
      return await this.model.deleteMany(`jobId = ${jobId}`)
    }
    return await this.model.truncate()
  }
}

export const jobLogService = new JobLogService()
