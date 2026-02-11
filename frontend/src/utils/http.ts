import type { ApiResponse, PagedResponse } from '@/types'
import { createDiscreteApi } from 'naive-ui'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建独立的消息 API（可在非 setup 环境中使用）
const { message } = createDiscreteApi(['message'])

/** 显示错误消息 */
const showError = (msg: string) => {
  message.error(msg, { duration: 3000 })
}

/** 处理401未授权，跳转到登录页 */
const handleUnauthorized = () => {
  localStorage.removeItem('token')
  const currentPath = window.location.pathname
  const loginPath = `${import.meta.env.BASE_URL}login`
  if (!currentPath.endsWith('/login')) {
    window.location.href = `${loginPath}?redirect=${encodeURIComponent(currentPath)}`
  }
}

/** 分页结果（已解包） */
export interface PageResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

class HttpClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token')
    }
    return this.token
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
    })

    const json = await response.json()

    if (!response.ok) {
      // 处理401未授权
      if (response.status === 401 || json.code === 401) {
        handleUnauthorized()
        throw new Error('登录已过期，请重新登录')
      }
      const errorMsg = json.message || `HTTP ${response.status}`
      showError(errorMsg)
      throw new Error(errorMsg)
    }

    // 自动解包 ApiResponse
    if (json && typeof json === 'object' && 'code' in json) {
      if (json.code !== 0 && json.code !== 200) {
        const errorMsg = json.message || '请求失败'
        showError(errorMsg)
        throw new Error(errorMsg)
      }
      return json.data as T
    }

    return json as T
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    let queryString = ''
    if (params) {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      }
      queryString = searchParams.toString()
      if (queryString) {
        queryString = '?' + queryString
      }
    }
    return this.request<T>(`${url}${queryString}`, { method: 'GET' })
  }

  async getPage<T>(url: string, params?: Record<string, unknown>): Promise<PageResult<T>> {
    let queryString = ''
    if (params) {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      }
      queryString = searchParams.toString()
      if (queryString) {
        queryString = '?' + queryString
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${BASE_URL}${url}${queryString}`, {
      method: 'GET',
      headers,
    })

    const json = await response.json()

    if (!response.ok) {
      // 处理401未授权
      if (response.status === 401 || json.code === 401) {
        handleUnauthorized()
        throw new Error('登录已过期，请重新登录')
      }
      const errorMsg = json.message || `HTTP ${response.status}`
      showError(errorMsg)
      throw new Error(errorMsg)
    }

    // 处理分页响应
    if (json && typeof json === 'object' && 'code' in json) {
      if (json.code !== 0 && json.code !== 200) {
        const errorMsg = json.message || '请求失败'
        showError(errorMsg)
        throw new Error(errorMsg)
      }
      return {
        data: json.data as T[],
        total: json.total || 0,
        page: json.page || 1,
        pageSize: json.pageSize || 10,
      }
    }

    // 如果直接返回的是数组或分页结构
    if (Array.isArray(json)) {
      return { data: json as T[], total: json.length, page: 1, pageSize: json.length }
    }

    return json as PageResult<T>
  }

  async post<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T = void>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' })
  }
}

export const http = new HttpClient()
export default http
