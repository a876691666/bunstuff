import { http } from '@/utils/http'

export interface LoginResult {
  token: string
  user: {
    id: number
    username: string
    nickname: string | null
    roleId: string
  }
}

export interface UserProfile {
  id: number
  username: string
  nickname: string | null
  email: string | null
  phone: string | null
  avatar: string | null
  roleId: string
  status: number
}

export interface UpdateProfileBody {
  nickname?: string
  email?: string | null
  phone?: string | null
  avatar?: string | null
}

export async function apiLogin(username: string, password: string): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/login', { username, password })
}

export async function apiLogout(): Promise<void> {
  await http.post('/auth/logout')
}

export interface RegisterBody {
  username: string
  password: string
  nickname?: string
  email?: string
}

export async function apiRegister(body: RegisterBody): Promise<{ userId: number }> {
  return http.post<{ userId: number }>('/auth/register', body)
}

export async function apiGetMe(): Promise<UserProfile> {
  return http.get<UserProfile>('/auth/me')
}

export async function apiUpdateProfile(body: UpdateProfileBody): Promise<UserProfile> {
  return http.put<UserProfile>('/auth/profile', body)
}

export async function apiChangePassword(oldPassword: string, newPassword: string): Promise<void> {
  await http.post('/auth/change-password', { oldPassword, newPassword })
}
