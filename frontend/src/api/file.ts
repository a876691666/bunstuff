import { http } from '@/utils'
import type { SysFile, PageParams } from '@/types'

export interface FileQueryParams extends PageParams {
  originalName?: string
  mimeType?: string
  storageType?: string
}

export interface UploadResponse {
  id: number
  url: string
  originalName: string
  storageName: string
  size: number
  mimeType: string | null
}

/** 管理端文件 API（路径前缀: /api/admin/file） */
export const fileApi = {
  /** 获取文件列表 */
  list: (params?: FileQueryParams) =>
    http.getPage<SysFile>('/admin/file', params as Record<string, unknown>),

  /** 获取文件详情 */
  get: (id: number) => http.get<SysFile>(`/admin/file/${id}`),

  /** 删除文件 */
  delete: (id: number) => http.delete(`/admin/file/${id}`),

  /** 上传文件 */
  upload: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/admin/file/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const json = await res.json()
    if (!res.ok || (json.code !== 0 && json.code !== 200)) {
      throw new Error(json.message || '上传失败')
    }
    return json.data
  },
}

/** 客户端文件 API（路径前缀: /api/file） */
export const fileClientApi = {
  /** 上传文件 */
  upload: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/file/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const json = await res.json()
    if (!res.ok || (json.code !== 0 && json.code !== 200)) {
      throw new Error(json.message || '上传失败')
    }
    return json.data
  },

  /** 获取文件访问链接（使用静态文件服务） */
  getFileUrl: (storagePath: string) =>
    `${import.meta.env.VITE_API_BASE_URL || ''}/uploads/${storagePath}`,

  /** 获取文件下载链接 */
  getDownloadUrl: (storagePath: string) =>
    `${import.meta.env.VITE_API_BASE_URL || ''}/uploads/${storagePath}`,

  /** 获取文件预览链接 */
  getPreviewUrl: (storagePath: string) =>
    `${import.meta.env.VITE_API_BASE_URL || ''}/uploads/${storagePath}`,
}
