import JobLog from '@/models/job-log'

/** 任务日志服务 */
export const jobLogService = {
  async findAll(query?: { page?: number; pageSize?: number; filter?: string }) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize

    const data = await JobLog.findMany({
      where: query?.filter,
      limit: pageSize,
      offset,
      orderBy: [{ column: 'id', order: 'DESC' }],
    })
    const total = await JobLog.count(query?.filter)

    return { data, total, page, pageSize }
  },

  async findById(id: number) {
    return await JobLog.findOne({ where: `id = ${id}` })
  },

  async delete(id: number) {
    return await JobLog.delete(id)
  },

  async clear(jobId?: number) {
    if (jobId) {
      return await JobLog.deleteMany(`jobId = ${jobId}`)
    }
    return await JobLog.truncate()
  },
}
