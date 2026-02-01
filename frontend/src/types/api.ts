/** API 响应基础类型 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页响应 */
export interface PagedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  pageSize: number
}

/** 分页请求参数 */
export interface PageParams {
  page?: number
  pageSize?: number
  [key: string]: unknown
}

/** 用户类型 */
export interface User {
  id: number
  username: string
  nickname: string | null
  email: string | null
  phone: string | null
  roleId: number
  status: number
  createdAt?: string
  updatedAt?: string
}

/** 角色类型 */
export interface Role {
  id: number
  name: string
  code: string
  parentId: number | null
  description: string | null
  status: number
  createdAt?: string
  updatedAt?: string
}

/** 角色树类型 */
export interface RoleTree extends Role {
  children?: RoleTree[]
}

/** 权限类型 */
export interface Permission {
  id: number
  name: string
  code: string
  resource: string | null
  description: string | null
  createdAt?: string
  updatedAt?: string
}

/** 权限范围类型 */
export interface PermissionScope {
  id: number
  permissionId: number
  name: string
  tableName: string
  ssqlRule: string
  description: string | null
  createdAt?: string
  updatedAt?: string
}

/** 菜单类型 */
export interface Menu {
  id: number
  name: string
  code: string
  path: string | null
  component: string | null
  icon: string | null
  sort: number
  parentId: number | null
  isHidden: boolean
  isCache: boolean
  createdAt?: string
  updatedAt?: string
}

/** 菜单树类型 */
export interface MenuTree extends Menu {
  children?: MenuTree[]
}

/** 角色菜单关联 */
export interface RoleMenu {
  id: number
  roleId: number
  menuId: number
  createdAt?: string
}

/** 角色权限关联 */
export interface RolePermission {
  id: number
  roleId: number
  permissionId: number
  permissionScopeId: number | null
  createdAt?: string
}

/** VIP 等级 */
export interface VipTier {
  id: number
  name: string
  code: string
  roleId: number | null
  price: number
  durationDays: number
  status: number
  description: string | null
  createdAt?: string
  updatedAt?: string
}

/** VIP 资源限制 */
export interface VipResourceLimit {
  id: number
  vipTierId: number
  resourceKey: string
  limitValue: number
  description: string | null
  createdAt?: string
  updatedAt?: string
}

/** 用户 VIP */
export interface UserVip {
  id: number
  userId: number
  vipTierId: number
  expireTime: string | null
  status: number
  bindingStatus: number
  originalRoleId: number | null
  createdAt?: string
  updatedAt?: string
}

/** 资源检查结果（checkResource/incrementResource/decrementResource 返回） */
export interface ResourceCheckResult {
  resourceKey: string
  currentUsage: number
  limitValue: number
  available: number
  canUse: boolean
}

/** 用户资源使用详情（getUserResourceUsage 返回） */
export interface UserResourceUsageInfo {
  resourceKey: string
  description: string | null
  currentUsage: number
  limitValue: number
  available: number
  canUse: boolean
}

/** 用户资源使用记录（数据库记录） */
export interface UserResourceUsage {
  id: number
  userId: number
  resourceKey: string
  usageCount: number
  createdAt?: string
  updatedAt?: string
}

/** 会话信息 */
export interface Session {
  id: number
  token: string
  tokenPrefix: string
  userId: number
  username: string
  roleId: number
  createdAt: string
  expiresAt: string
  lastActiveAt: string
  ip?: string
  userAgent?: string
}

/** 在线统计 */
export interface OnlineStats {
  onlineUsers: number
  activeSessions: number
  activeUsers: number
  todayNewSessions: number
  expiringSessions: number
  totalSessions: number
}

/** 登录请求 */
export interface LoginRequest {
  username: string
  password: string
}

/** 登录响应 */
export interface LoginResponse {
  token: string
  user: {
    id: number
    username: string
    nickname: string | null
    roleId: number
  }
}

/** 注册请求 */
export interface RegisterRequest {
  username: string
  password: string
  nickname?: string
  email?: string
  phone?: string
}

/** 修改密码请求 */
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

/** 创建用户请求 */
export interface CreateUserRequest {
  username: string
  password: string
  nickname?: string
  email?: string
  phone?: string
  roleId?: number
  status?: number
}

/** 更新用户请求 */
export interface UpdateUserRequest {
  nickname?: string
  email?: string
  phone?: string
  roleId?: number
  status?: number
  password?: string
}

/** 创建角色请求 */
export interface CreateRoleRequest {
  name: string
  code: string
  parentId?: number | null
  description?: string
  status?: number
}

/** 更新角色请求 */
export interface UpdateRoleRequest {
  name?: string
  code?: string
  parentId?: number | null
  description?: string
  status?: number
}

/** 创建权限请求 */
export interface CreatePermissionRequest {
  name: string
  code: string
  resource?: string
  description?: string
}

/** 更新权限请求 */
export interface UpdatePermissionRequest {
  name?: string
  code?: string
  resource?: string
  description?: string
}

/** 创建权限范围请求 */
export interface CreatePermissionScopeRequest {
  permissionId: number
  name: string
  tableName: string
  ssqlRule: string
  description?: string
}

/** 更新权限范围请求 */
export interface UpdatePermissionScopeRequest {
  name?: string
  tableName?: string
  ssqlRule?: string
  description?: string
}

/** 创建菜单请求 */
export interface CreateMenuRequest {
  name: string
  code: string
  path?: string
  component?: string
  icon?: string
  sort?: number
  parentId?: number | null
  isHidden?: boolean
  isCache?: boolean
}

/** 更新菜单请求 */
export interface UpdateMenuRequest {
  name?: string
  code?: string
  path?: string
  component?: string
  icon?: string
  sort?: number
  parentId?: number | null
  isHidden?: boolean
  isCache?: boolean
}

/** 创建VIP等级请求 */
export interface CreateVipTierRequest {
  name: string
  code: string
  roleId?: number | null
  price?: number
  durationDays?: number
  status?: number
  description?: string
}

/** 更新VIP等级请求 */
export interface UpdateVipTierRequest {
  name?: string
  code?: string
  roleId?: number | null
  price?: number
  durationDays?: number
  status?: number
  description?: string
}

/** 创建资源限制请求 */
export interface CreateVipResourceLimitRequest {
  vipTierId: number
  resourceKey: string
  limitValue: number
  description?: string
}

/** 更新资源限制请求 */
export interface UpdateVipResourceLimitRequest {
  resourceKey?: string
  limitValue?: number
  description?: string
}

/** 升级VIP请求 */
export interface UpgradeVipRequest {
  userId: number
  vipTierCode: string
  expireTime?: string
}

/** RBAC 缓存状态 */
export interface RbacCacheStatus {
  roleCount: number
  permissionCount: number
  menuCount: number
  scopeCount: number
  lastUpdated: string
}
