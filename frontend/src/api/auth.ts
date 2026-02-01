import { http } from '@/utils'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ChangePasswordRequest,
  User,
  OnlineStats,
  Session,
} from '@/types'

/** 客户端认证 API（路径前缀: /api/auth） */
export const authApi = {
  /** 登录 */
  login: (data: LoginRequest) => http.post<LoginResponse>('/auth/login', data),

  /** 注册 */
  register: (data: RegisterRequest) => http.post<{ userId: number }>('/auth/register', data),

  /** 登出 */
  logout: () => http.post('/auth/logout'),

  /** 获取当前用户信息 */
  me: () => http.get<User>('/auth/me'),

  /** 刷新令牌 */
  refresh: () => http.post<{ expiresAt: string }>('/auth/refresh'),

  /** 修改密码 */
  changePassword: (data: ChangePasswordRequest) => http.post('/auth/change-password', data),
}

/** 管理端认证 API（路径前缀: /api/admin/auth） */
export const authAdminApi = {
  /** 获取在线统计 */
  getOnlineStats: () => http.get<OnlineStats>('/admin/auth/admin/stats'),

  /** 获取会话列表 */
  getSessions: () => http.get<Session[]>('/admin/auth/admin/sessions'),

  /** 踢用户下线 */
  kickUser: (userId: number) => http.post('/admin/auth/admin/kick-user', { userId }),

  /** 踢会话下线 */
  kickSession: (token: string) => http.post('/admin/auth/admin/kick-session', { token }),
}
