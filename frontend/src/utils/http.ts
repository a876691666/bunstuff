import type { ApiResponse, PagedResponse } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

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
      throw new Error(json.message || `HTTP ${response.status}`)
    }

    // 自动解包 ApiResponse
    if (json && typeof json === 'object' && 'code' in json) {
      if (json.code !== 0 && json.code !== 200) {
        throw new Error(json.message || '请求失败')
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
      throw new Error(json.message || `HTTP ${response.status}`)
    }

    // 处理分页响应
    if (json && typeof json === 'object' && 'code' in json) {
      if (json.code !== 0 && json.code !== 200) {
        throw new Error(json.message || '请求失败')
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
