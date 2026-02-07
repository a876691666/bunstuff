import { http } from '@/utils'
import type { Job, JobLog, CreateJobRequest, UpdateJobRequest, PageParams } from '@/types'

export interface JobQueryParams extends PageParams {
  name?: string
  group?: string
  handler?: string
  status?: number
}

export interface JobLogQueryParams extends PageParams {
  jobId?: number
  handler?: string
  status?: number
}

/** 定时任务管理 API */
export const jobApi = {
  /** 获取任务列表 */
  list: (params?: JobQueryParams) =>
    http.getPage<Job>('/admin/job', params as Record<string, unknown>),

  /** 获取任务详情 */
  get: (id: number) => http.get<Job>(`/admin/job/${id}`),

  /** 创建任务 */
  create: (data: CreateJobRequest) => http.post<Job>('/admin/job', data),

  /** 更新任务 */
  update: (id: number, data: UpdateJobRequest) => http.put<Job>(`/admin/job/${id}`, data),

  /** 删除任务 */
  delete: (id: number) => http.delete(`/admin/job/${id}`),

  /** 执行任务 */
  run: (id: number) => http.post(`/admin/job/${id}/run`),

  /** 启用任务 */
  enable: (id: number) => http.post(`/admin/job/${id}/enable`),

  /** 禁用任务 */
  disable: (id: number) => http.post(`/admin/job/${id}/disable`),

  /** 获取已注册处理函数 */
  getHandlers: () => http.get<string[]>('/admin/job/handlers'),
}

/** 任务日志管理 API */
export const jobLogApi = {
  /** 获取日志列表 */
  list: (params?: JobLogQueryParams) =>
    http.getPage<JobLog>('/admin/job-log', params as Record<string, unknown>),

  /** 获取日志详情 */
  get: (id: number) => http.get<JobLog>(`/admin/job-log/${id}`),

  /** 删除日志 */
  delete: (id: number) => http.delete(`/admin/job-log/${id}`),

  /** 清空日志 */
  clear: (jobId?: number) =>
    http.delete(jobId ? `/admin/job-log/clear?jobId=${jobId}` : '/admin/job-log/clear'),
}
