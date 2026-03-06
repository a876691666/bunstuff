const BASE_URL = '/api'

interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...init } = options

  let fullUrl = `${BASE_URL}${url}`
  if (params) {
    const query = new URLSearchParams(params).toString()
    fullUrl += `?${query}`
  }

  const headers = new Headers(init.headers)
  if (init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  const token = localStorage.getItem('auth_token')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(fullUrl, { ...init, headers })
  if (res.status === 401) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.location.href = '/login'
    throw new Error('登录已过期，请重新登录')
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export const http = {
  get<T = any>(url: string, params?: Record<string, string>) {
    return request<T>(url, { params })
  },
  post<T = any>(url: string, body?: unknown) {
    return request<T>(url, { method: 'POST', body: JSON.stringify(body) })
  },
  put<T = any>(url: string, body?: unknown) {
    return request<T>(url, { method: 'PUT', body: JSON.stringify(body) })
  },
  delete<T = any>(url: string) {
    return request<T>(url, { method: 'DELETE' })
  },
  upload<T = any>(url: string, formData: FormData) {
    return request<T>(url, { method: 'POST', body: formData })
  },
}
