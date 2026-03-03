# HTTP 客户端

## 🎯 概述

项目基于原生 `fetch` API 封装了 `HttpClient` 类，提供类型安全的请求方法、自动 Token 管理、统一错误处理和响应解包。

## 📦 核心设计

### HttpClient 类

```ts
class HttpClient {
  private baseURL: string

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T>
  async getPage<T>(url: string, params?: Record<string, any>): Promise<PagedResult<T>>
  async post<T>(url: string, body?: any): Promise<T>
  async put<T>(url: string, body?: any): Promise<T>
  async delete<T>(url: string): Promise<T>
}

// 单例导出
export const http = new HttpClient()
```

## 🔑 Token 管理

```ts
function getToken(): string | null {
  return localStorage.getItem('token')
}

function setToken(token: string) {
  if (token) {
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem('token')
  }
}
```

每个请求自动携带 Authorization Header：

```ts
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
}
const token = getToken()
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```

## 📤 请求方法

| 方法 | 用途 | 返回类型 |
|------|------|----------|
| `get<T>(url, params?)` | 获取单条/列表数据 | `Promise<T>` |
| `getPage<T>(url, params?)` | 获取分页数据 | `Promise<PagedResult<T>>` |
| `post<T>(url, body?)` | 创建资源 | `Promise<T>` |
| `put<T>(url, body?)` | 更新资源 | `Promise<T>` |
| `delete<T>(url)` | 删除资源 | `Promise<T>` |

### 分页响应结构

```ts
interface PagedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
```

## 🔄 响应解包

后端统一返回 `ApiResponse` 格式，HttpClient 自动解包：

```ts
// 后端返回结构
interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// HttpClient 内部自动解包
async function request<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(this.baseURL + url, options)
  const json: ApiResponse<T> = await response.json()

  if (json.code !== 0) {
    throw new Error(json.message)
  }

  return json.data  // 直接返回 data，调用方无需手动解包
}
```

:::tip
调用方只需关心业务数据，不再需要解构 `response.data`：
```ts
// ✅ 直接获得 User[]
const users = await http.get<User[]>('/user')

// ✅ 直接获得分页结果
const { data, total } = await http.getPage<User>('/user', { page: 1, pageSize: 10 })
```
:::

## ❌ 错误处理

### 401 未授权

```ts
if (response.status === 401) {
  setToken('')  // 清除无效 token
  router.push('/login')
  return
}
```

### 业务错误

通过 Naive UI 的 `discrete` API 显示错误消息：

```ts
import { createDiscreteApi } from 'naive-ui'
const { message } = createDiscreteApi(['message'])

// 请求失败时
if (json.code !== 0) {
  message.error(json.message || '请求失败')
  throw new Error(json.message)
}
```

### 网络错误

```ts
try {
  const response = await fetch(url, options)
  // ...
} catch (error) {
  message.error('网络异常，请检查网络连接')
  throw error
}
```

## 🔧 使用示例

```ts
import { http } from '@/utils/http'

// GET 请求
const user = await http.get<User>('/user/1')

// GET 分页
const page = await http.getPage<User>('/user', { page: 1, pageSize: 20 })

// POST 创建
const newUser = await http.post<User>('/user', { username: 'test', password: '123456' })

// PUT 更新
await http.put('/user/1', { nickname: '新昵称' })

// DELETE 删除
await http.delete('/user/1')
```

:::warning
`getPage` 方法会自动将 `page` 和 `pageSize` 追加到查询参数中，同时正确解析分页元数据。不要用 `get` 方法替代 `getPage` 来获取分页数据。
:::
