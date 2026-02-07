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
  parentId: number | null
  name: string
  path: string
  component: string | null
  icon: string | null
  type: number
  visible: number
  status: number
  redirect: string | null
  sort: number
  permCode: string | null
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
  path: string
  parentId?: number | null
  component?: string | null
  icon?: string | null
  type?: number
  visible?: number
  status?: number
  redirect?: string | null
  sort?: number
  permCode?: string | null
}

/** 更新菜单请求 */
export interface UpdateMenuRequest {
  name?: string
  path?: string
  parentId?: number | null
  component?: string | null
  icon?: string | null
  type?: number
  visible?: number
  status?: number
  redirect?: string | null
  sort?: number
  permCode?: string | null
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

// ============ 系统管理类型 ============

/** 字典类型 */
export interface DictType {
  id: number
  name: string
  type: string
  status: number
  remark: string | null
  createdAt?: string
  updatedAt?: string
}

/** 字典数据 */
export interface DictData {
  id: number
  dictType: string
  label: string
  value: string
  cssClass: string | null
  listClass: string | null
  sort: number
  status: number
  isDefault: number
  remark: string | null
  createdAt?: string
  updatedAt?: string
}

/** 系统配置 */
export interface SysConfig {
  id: number
  name: string
  key: string
  value: string
  isBuiltin: number
  remark: string | null
  createdAt?: string
  updatedAt?: string
}

/** 登录日志 */
export interface LoginLog {
  id: number
  userId: number | null
  username: string
  ip: string | null
  location: string | null
  browser: string | null
  os: string | null
  status: number
  action: string
  msg: string | null
  loginTime: string
}

/** 操作日志 */
export interface OperLog {
  id: number
  title: string
  type: string
  method: string
  url: string
  ip: string | null
  params: string | null
  result: string | null
  status: number
  errorMsg: string | null
  userId: number | null
  username: string
  costTime: number
  operTime: string
}

/** 创建字典类型请求 */
export interface CreateDictTypeRequest {
  name: string
  type: string
  status?: number
  remark?: string
}

/** 更新字典类型请求 */
export interface UpdateDictTypeRequest {
  name?: string
  type?: string
  status?: number
  remark?: string
}

/** 创建字典数据请求 */
export interface CreateDictDataRequest {
  dictType: string
  label: string
  value: string
  cssClass?: string
  listClass?: string
  sort?: number
  status?: number
  isDefault?: number
  remark?: string
}

/** 更新字典数据请求 */
export interface UpdateDictDataRequest {
  dictType?: string
  label?: string
  value?: string
  cssClass?: string
  listClass?: string
  sort?: number
  status?: number
  isDefault?: number
  remark?: string
}

/** 创建系统配置请求 */
export interface CreateSysConfigRequest {
  name: string
  key: string
  value: string
  isBuiltin?: number
  remark?: string
}

/** 更新系统配置请求 */
export interface UpdateSysConfigRequest {
  name?: string
  key?: string
  value?: string
  remark?: string
}

// ============ 通知公告类型 ============

/** 通知公告 */
export interface Notice {
  id: number
  title: string
  content: string
  type: string
  status: number
  createBy: number
  remark: string | null
  createdAt?: string
  updatedAt?: string
}

/** 通知公告（带已读状态） */
export interface NoticeWithRead extends Notice {
  isRead: boolean
  readAt: string | null
}

/** 创建通知公告请求 */
export interface CreateNoticeRequest {
  title: string
  content: string
  type?: string
  status?: number
  remark?: string
}

/** 更新通知公告请求 */
export interface UpdateNoticeRequest {
  title?: string
  content?: string
  type?: string
  status?: number
  remark?: string
}

// ============ 文件管理类型 ============

/** 系统文件 */
export interface SysFile {
  id: number
  originalName: string
  storageName: string
  storagePath: string
  size: number
  mimeType: string | null
  extension: string | null
  storageType: string
  s3Bucket: string | null
  uploadBy: number
  md5: string | null
  createdAt?: string
  updatedAt?: string
}

// ============ 定时任务类型 ============

/** 定时任务 */
export interface Job {
  id: number
  name: string
  group: string
  handler: string
  cron: string
  params: string | null
  status: number
  remark: string | null
  createdAt?: string
  updatedAt?: string
}

/** 任务执行日志 */
export interface JobLog {
  id: number
  jobId: number
  jobName: string
  handler: string
  message: string | null
  status: number
  errorMsg: string | null
  startTime: string
  endTime: string
  costTime: number
}

/** 创建任务请求 */
export interface CreateJobRequest {
  name: string
  group?: string
  handler: string
  cron: string
  params?: string
  status?: number
  remark?: string
}

/** 更新任务请求 */
export interface UpdateJobRequest {
  name?: string
  group?: string
  handler?: string
  cron?: string
  params?: string
  status?: number
  remark?: string
}

// ============ 限流规则类型 ============

/** 限流规则 */
export interface RateLimitRule {
  id: number
  /** 规则名称 */
  name: string
  /** 规则编码（唯一标识） */
  code: string
  /** 限流模式: time_window-时间窗口 concurrent-并发限流 sliding_window-滑动窗口 */
  mode: 'time_window' | 'concurrent' | 'sliding_window'
  /** 匹配路径模式 */
  pathPattern: string
  /** 请求方法：*或GET,POST等 */
  method: string
  /** 限流维度: ip-按IP global-全局 user-按用户 */
  dimension: 'ip' | 'global' | 'user'
  /** 时间窗口（秒） */
  windowSeconds: number
  /** 最大请求数 */
  maxRequests: number
  /** 最大并发数 */
  maxConcurrent: number
  /** 黑名单自动封禁阈值 */
  blacklistThreshold: number
  /** 响应状态码 */
  responseCode: number
  /** 响应消息 */
  responseMessage: string
  /** 优先级 */
  priority: number
  /** 状态：1启用 0禁用 */
  status: number
  /** 备注 */
  remark: string | null
  createdAt?: string
  updatedAt?: string
}

/** 创建限流规则请求 */
export interface CreateRateLimitRuleRequest {
  name: string
  code: string
  mode: string
  pathPattern: string
  method?: string
  dimension?: string
  windowSeconds?: number
  maxRequests?: number
  maxConcurrent?: number
  blacklistThreshold?: number
  responseCode?: number
  responseMessage?: string
  priority?: number
  status?: number
  remark?: string
}

/** 更新限流规则请求 */
export interface UpdateRateLimitRuleRequest {
  name?: string
  code?: string
  mode?: string
  pathPattern?: string
  method?: string
  dimension?: string
  windowSeconds?: number
  maxRequests?: number
  maxConcurrent?: number
  blacklistThreshold?: number
  responseCode?: number
  responseMessage?: string
  priority?: number
  status?: number
  remark?: string
}

// ============ IP黑名单类型 ============

/** IP黑名单 */
export interface IpBlacklist {
  id: number
  /** IP地址 */
  ip: string
  /** 封禁原因 */
  reason: string
  /** 封禁来源: manual-手动 auto-自动 */
  source: 'manual' | 'auto'
  /** 触发的限流规则ID */
  ruleId: number | null
  /** 触发次数 */
  triggerCount: number
  /** 过期时间 */
  expireAt: string | null
  /** 状态：1封禁中 0已解封 */
  status: number
  /** 备注 */
  remark: string | null
  createdAt?: string
  updatedAt?: string
}

/** 创建IP黑名单请求 */
export interface CreateIpBlacklistRequest {
  ip: string
  reason?: string
  expireAt?: string | null
  status?: number
  remark?: string
}

/** 更新IP黑名单请求 */
export interface UpdateIpBlacklistRequest {
  ip?: string
  reason?: string
  expireAt?: string | null
  status?: number
  remark?: string
}
