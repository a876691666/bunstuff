import { http } from '@/utils'

/** Seed 执行日志 */
export interface SeedLog {
  id: number
  name: string
  status: string
  message: string | null
  executedAt: string
}

/** 已注册的 Seed */
export interface RegisteredSeed {
  name: string
  description?: string
}

/** 批量执行结果 */
export interface SeedRunAllResult {
  total: number
  success: number
  failed: number
  skipped: number
  results: Array<{
    name: string
    success: boolean
    message: string
  }>
}

/** 管理端 Seed API（路径前缀: /api/admin/seed） */
export const seedApi = {
  /** 获取 Seed 执行日志 */
  getLogs: () => http.get<SeedLog[]>('/admin/seed/logs'),

  /** 获取已注册的 Seeds */
  getRegistered: () => http.get<RegisteredSeed[]>('/admin/seed/registered'),

  /** 执行单个 Seed */
  run: (name: string, force?: boolean) => {
    const query = force ? '?force=true' : ''
    return http.post<void>(`/admin/seed/run/${name}${query}`)
  },

  /** 执行所有 Seeds */
  runAll: (force?: boolean) => {
    const query = force ? '?force=true' : ''
    return http.post<SeedRunAllResult>(`/admin/seed/run-all${query}`)
  },

  /** 重置 Seed 记录 */
  reset: (name: string) => http.delete(`/admin/seed/reset/${name}`),
}
