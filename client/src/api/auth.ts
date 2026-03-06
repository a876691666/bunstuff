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

export async function apiLogin(username: string, password: string): Promise<LoginResult> {
  const res = await http.post<{ code: number; message: string; data: LoginResult }>(
    '/auth/login',
    { username, password },
  )
  return res.data
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
  const res = await http.post<{ code: number; message: string; data: { userId: number } }>(
    '/auth/register',
    body,
  )
  return res.data
}
