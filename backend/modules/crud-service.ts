/**
 * CrudService 基类
 *
 * 封装通用的 CRUD 操作，集成 Velocity 模板引擎进行 permission-scope SSQL 参数注入。
 *
 * 核心流程:
 * 1. 从 DataScope 获取原始 SSQL 规则（如 `created_by = $auth.userId`）
 * 2. 使用 Velocity 渲染模板，注入 req/auth/自定义上下文
 * 3. 将渲染后的 SSQL 用于数据库 WHERE 过滤
 *
 * @example
 * ```ts
 * import User from '@/models/users'
 * import { CrudService } from '@/modules/crud-service'
 *
 * class UserService extends CrudService<typeof User> {
 *   constructor() {
 *     super(User)
 *   }
 * }
 *
 * export const userService = new UserService()
 * ```
 *
 * 在路由中使用（直接传入 Elysia handler context）:
 * ```ts
 * .get('/', async (ctx) => {
 *   return R.page(await userService.findAll(ctx.query, ctx))
 * })
 * .post('/', async (ctx) => {
 *   return R.ok(await userService.create(ctx.body, ctx))
 * })
 * .put('/:id', async (ctx) => {
 *   const r = await userService.update(ctx.params.id, ctx.body, ctx)
 *   if (!r) return R.forbidden('无权操作该记录')
 *   return R.ok(r)
 * })
 * .delete('/:id', async (ctx) => {
 *   const ok = await userService.delete(ctx.params.id, ctx)
 *   if (!ok) return R.forbidden('无权操作该记录')
 *   return R.success('删除成功')
 * })
 * ```
 */

import type { SchemaDefinition, InferRow, InsertData, UpdateData } from '@/packages/orm'
import type { Model } from '@/packages/orm'
import type { DataScope } from '@/modules/rbac/main/plugin'
import { render } from 'velocityjs'
import { parse as parseSsql, Op, Logic, FieldExpr, LogicExpr, GroupExpr, LiteralExpr } from '@pkg/ssql'
import type { UserPermissionInfo } from './rbac'

// ============ 类型定义 ============

/** 分页查询参数 */
export interface PageQuery {
  page?: number
  pageSize?: number
  filter?: string
}

/** 分页查询结果 */
export interface PageResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * CRUD 上下文 — 直接传入 Elysia handler context 即可
 *
 * CrudService 会自动提取 request/params/body/query/cookie、auth 信息、dataScope
 * 并构建 Velocity 模板上下文进行 SSQL 参数注入。
 */
export interface CrudContext {
  /** Elysia Request 对象 */
  request?: Request
  params?: Record<string, any>
  body?: any
  query?: Record<string, any>
  cookie?: Record<string, any>

  /** Auth 信息 (from authPlugin) */
  userId?: number | null
  roleId?: number | null
  session?: any

  /** 数据权限 (from rbacPlugin) */
  dataScope?: DataScope | null

  rbac?: UserPermissionInfo | null

  /** 其他字段作为额外 Velocity 上下文 */
  [key: string]: any
}

// ============ Velocity 模板渲染 ============

/** 已知的 Elysia 内部字段，不注入到 Velocity extra 上下文 */
const ELYSIA_INTERNAL_KEYS = new Set([
  'request',
  'params',
  'body',
  'query',
  'cookie',
  'set',
  'path',
  'route',
  'store',
  'headers',
  'server',
  'redirect',
  'error',
  'userId',
  'roleId',
  'session',
  'rbac',
  'dataScope',
  'vip',
  'file',
  'notice',
  'dict',
  'config',
  'loginLog',
])

/**
 * 从 CrudContext 构建 Velocity 模板上下文
 *
 * 注入变量:
 * - $req.method, $req.url, $req.headers, $req.cookies, $req.body, $req.params, $req.query
 * - $auth.userId, $auth.roleId, $auth.username, $auth.session
 * - 外部自定义变量（ctx 中非 Elysia 内部字段的属性）
 */
function buildVelocityContext(ctx?: CrudContext): Record<string, any> {
  if (!ctx) return {}

  const request = ctx.request
  const headers: Record<string, string> = {}
  const cookies: Record<string, string> = {}

  if (request?.headers) {
    request.headers.forEach((value, key) => {
      headers[key] = value
    })
    // 解析 Cookie header
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      for (const part of cookieHeader.split(';')) {
        const [k, ...v] = part.trim().split('=')
        if (k) cookies[k.trim()] = v.join('=').trim()
      }
    }
  }

  // 也从 Elysia 的 cookie 对象提取
  if (ctx.cookie && typeof ctx.cookie === 'object') {
    for (const [k, v] of Object.entries(ctx.cookie)) {
      if (v && typeof v === 'object' && 'value' in v) {
        cookies[k] = String((v as any).value)
      } else if (typeof v === 'string') {
        cookies[k] = v
      }
    }
  }

  const velocityCtx: Record<string, any> = {
    req: {
      method: request?.method ?? '',
      url: request?.url ?? '',
      headers,
      cookies,
      body: ctx.body ?? {},
      params: ctx.params ?? {},
      query: ctx.query ?? {},
    },
    auth: {
      userId: ctx.userId ?? null,
      roleId: ctx.roleId ?? null,
      role: ctx.rbac?.role ?? null,
      username: ctx.session?.username ?? null,
      session: ctx.session ?? null,
    },
  }

  // 注入外部自定义上下文（非 Elysia 内部字段）
  for (const [key, value] of Object.entries(ctx)) {
    if (!ELYSIA_INTERNAL_KEYS.has(key) && !(key in velocityCtx)) {
      velocityCtx[key] = value
    }
  }

  return velocityCtx
}

/**
 * 使用 Velocity 渲染 SSQL 规则模板
 *
 * @param ssqlTemplate - 原始 SSQL 规则，可包含 Velocity 变量如 `$auth.userId`
 * @param velocityCtx - Velocity 上下文
 * @returns 渲染后的 SSQL 字符串
 */
function renderSsql(ssqlTemplate: string, velocityCtx: Record<string, any>): string {
  try {
    return render(ssqlTemplate, velocityCtx).trim()
  } catch {
    // 渲染失败返回原始字符串（会在 SSQL 解析时报错）
    return ssqlTemplate
  }
}

/**
 * 渲染 scope 规则并合并为 SSQL WHERE 条件
 *
 * 多条规则之间用 || 连接（满足任一即可访问），
 * 再与用户 filter 使用 && 连接。
 */
function renderAndMerge(
  filter: string | undefined,
  rules: string[],
  velocityCtx: Record<string, any>,
): string | undefined {
  if (rules.length === 0) return filter || undefined

  // 渲染所有规则
  const rendered = rules.map((r) => renderSsql(r, velocityCtx)).filter(Boolean)
  if (rendered.length === 0) return filter || undefined

  // 多条规则用 || 连接
  const scopeExpr = rendered.length === 1 ? rendered[0]! : `(${rendered.join(' || ')})`

  if (!filter) return scopeExpr
  return `(${filter}) && (${scopeExpr})`
}

// ============ SSQL 布尔求值（用于 create 权限校验） ============

type Expression = FieldExpr | LogicExpr | GroupExpr | LiteralExpr

/**
 * 对 FieldExpr 进行布尔求值
 */
function evalField(expr: FieldExpr, data: Record<string, any>): boolean {
  const fieldValue = data[expr.field]

  switch (expr.op) {
    case Op.Eq:
      // eslint-disable-next-line eqeqeq
      return fieldValue == expr.value
    case Op.Neq:
      // eslint-disable-next-line eqeqeq
      return fieldValue != expr.value
    case Op.Gt:
      return fieldValue > (expr.value ?? 0)
    case Op.Gte:
      return fieldValue >= (expr.value ?? 0)
    case Op.Lt:
      return fieldValue < (expr.value ?? 0)
    case Op.Lte:
      return fieldValue <= (expr.value ?? 0)
    case Op.Like: {
      if (typeof fieldValue !== 'string' || typeof expr.value !== 'string') return false
      // LIKE '%xxx%' 简单匹配
      const pattern = expr.value.replace(/%/g, '')
      return fieldValue.includes(pattern)
    }
    case Op.NotLike: {
      if (typeof fieldValue !== 'string' || typeof expr.value !== 'string') return false
      const pat = expr.value.replace(/%/g, '')
      return !fieldValue.includes(pat)
    }
    case Op.In:
      return Array.isArray(expr.value) ? expr.value.includes(fieldValue) : false
    case Op.NotIn:
      return Array.isArray(expr.value) ? !expr.value.includes(fieldValue) : true
    case Op.IsNull:
      return fieldValue === null || fieldValue === undefined
    case Op.NotNull:
      return fieldValue !== null && fieldValue !== undefined
    case Op.Between: {
      if (!Array.isArray(expr.value) || expr.value.length < 2) return false
      return fieldValue >= expr.value[0]! && fieldValue <= expr.value[1]!
    }
    default:
      return false
  }
}

/**
 * 递归求值 SSQL 表达式
 */
function evalExpr(expr: Expression, data: Record<string, any>): boolean {
  if (expr instanceof FieldExpr) {
    return evalField(expr, data)
  }
  if (expr instanceof LogicExpr) {
    if (expr.logic === Logic.And) {
      return expr.exprs.every((e) => evalExpr(e, data))
    }
    return expr.exprs.some((e) => evalExpr(e, data))
  }
  if (expr instanceof GroupExpr) {
    return evalExpr(expr.inner, data)
  }
  if (expr instanceof LiteralExpr) {
    // 字面量比较（如 1 = 1, 'get' = 'get'），直接比较 left/right
    switch (expr.op) {
      case Op.Eq: return expr.left === expr.right
      case Op.Neq: return expr.left !== expr.right
      case Op.Gt: return (expr.left as number) > (expr.right as number)
      case Op.Gte: return (expr.left as number) >= (expr.right as number)
      case Op.Lt: return (expr.left as number) < (expr.right as number)
      case Op.Lte: return (expr.left as number) <= (expr.right as number)
      default: return true
    }
  }
  return true
}

/**
 * 对渲染后的 SSQL 字符串进行布尔求值
 *
 * 将 SSQL 解析为 AST，然后对 data 对象逐字段比较。
 * 用于 create 操作的权限校验（无法用 WHERE 过滤）。
 *
 * @param ssql - 渲染后的 SSQL（如 `dept_id = 5`）
 * @param data - 待创建的数据
 * @returns 是否满足条件
 */
function evaluateSsql(ssql: string, data: Record<string, any>): boolean {
  const expr = parseSsql(ssql)
  if (!expr) return true // 空表达式 = 无限制
  return evalExpr(expr, data)
}

// ============ CrudService 基类 ============

/**
 * CRUD Service 基类
 *
 * 所有 CRUD 方法接收 `ctx`（Elysia handler context），内部自动:
 * 1. 构建 Velocity 上下文（req/auth/extra）
 * 2. 从 dataScope 获取原始 SSQL 规则
 * 3. Velocity 渲染注入参数
 * 4. 合并到查询 WHERE / 进行布尔求值
 *
 * @typeParam S - Schema 定义类型
 */
export class CrudService<S extends SchemaDefinition> {
  constructor(
    /** ORM Model 实例 */
    protected readonly model: Model<S, any>,
  ) {}

  /** Model 表名（匹配 permission-scope 的 tableName） */
  protected get tableName(): string {
    return this.model.tableName
  }

  // ============ 内部工具 ============

  /**
   * 获取渲染后的 scope SSQL 规则
   *
   * @returns [渲染后的规则数组, velocityCtx]
   */
  protected getScopeRules(ctx?: CrudContext): string[] {
    if (!ctx?.dataScope) return []
    const rawRules = ctx.dataScope.getSsqlRules(this.tableName)
    if (rawRules.length === 0) return []

    const velocityCtx = buildVelocityContext(ctx)
    return rawRules.map((r) => renderSsql(r, velocityCtx)).filter(Boolean)
  }

  /**
   * 将 scope 规则与用户 filter 合并为 WHERE 条件
   */
  protected buildWhere(filter?: string, ctx?: CrudContext): string | undefined {
    if (!ctx?.dataScope) return filter || undefined
    const rawRules = ctx.dataScope.getSsqlRules(this.tableName)
    if (rawRules.length === 0) return filter || undefined

    const velocityCtx = buildVelocityContext(ctx)
    return renderAndMerge(filter, rawRules, velocityCtx)
  }

  // ============ 查询方法 ============

  /**
   * 分页查询列表
   *
   * scope SSQL 作为 WHERE 条件合并到查询，由数据库过滤。
   */
  async findAll(query?: PageQuery, ctx?: CrudContext): Promise<PageResult<InferRow<S>>> {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize

    const where = this.buildWhere(query?.filter, ctx)

    const data = await this.model.findMany({ where, limit: pageSize, offset })
    const total = await this.model.count(where)

    return { data, total, page, pageSize }
  }

  /**
   * 根据 ID 查询单条记录
   *
   * scope 条件附加到 WHERE，不在权限范围内的记录返回 null。
   */
  async findById(id: number, ctx?: CrudContext): Promise<InferRow<S> | null> {
    const where = this.buildWhere(`id = ${id}`, ctx)
    const rows = await this.model.findMany({ where, limit: 1 })
    return rows[0] ?? null
  }

  /**
   * 条件查询单条
   */
  async findOne(filter: string, ctx?: CrudContext): Promise<InferRow<S> | null> {
    const where = this.buildWhere(filter, ctx)
    const rows = await this.model.findMany({ where, limit: 1 })
    return rows[0] ?? null
  }

  /**
   * 条件查询多条
   */
  async findMany(filter?: string, ctx?: CrudContext): Promise<InferRow<S>[]> {
    const where = this.buildWhere(filter, ctx)
    return await this.model.findMany({ where })
  }

  /**
   * 统计数量
   */
  async count(filter?: string, ctx?: CrudContext): Promise<number> {
    const where = this.buildWhere(filter, ctx)
    return await this.model.count(where)
  }

  /**
   * 检查是否存在
   */
  async exists(filter: string, ctx?: CrudContext): Promise<boolean> {
    const where = this.buildWhere(filter, ctx)
    return await this.model.exists(where!)
  }

  // ============ 写入方法 ============

  /**
   * 创建记录
   *
   * create 无法使用 WHERE 过滤，因此对渲染后的 scope SSQL 进行布尔求值:
   * 解析 SSQL AST，逐字段比对待创建数据，任一规则满足即放行。
   *
   * @returns 创建的记录，若不满足 scope 规则则返回 null
   */
  async create(data: InsertData<S>, ctx?: CrudContext): Promise<InferRow<S> | null> {
    const renderedRules = this.getScopeRules(ctx)

    if (renderedRules.length > 0) {
      // 多条规则取 OR：任一满足即可
      const allowed = renderedRules.some((rule) => evaluateSsql(rule, data as Record<string, any>))
      if (!allowed) return null
    }

    return await this.model.create(data)
  }

  // ============ 更新方法 ============

  /**
   * 更新记录
   *
   * scope 条件合并到 WHERE 交由数据库处理:
   * `UPDATE ... WHERE id = X AND (scope_conditions)`
   * 若影响行数为 0 则表示无权限或记录不存在，返回 null。
   */
  async update(id: number, data: UpdateData<S>, ctx?: CrudContext): Promise<InferRow<S> | null> {
    const where = this.buildWhere(`id = ${id}`, ctx)
    const affected = await this.model.updateMany(where!, data)
    if (affected === 0) return null
    return await this.model.getOne(id as any)
  }

  /**
   * 条件更新多条
   *
   * scope 合并到 WHERE，影响行数为 0 表示无权限/无匹配。
   */
  async updateMany(filter: string, data: UpdateData<S>, ctx?: CrudContext): Promise<number> {
    const where = this.buildWhere(filter, ctx)
    if (!where) return 0
    return await this.model.updateMany(where, data)
  }

  // ============ 删除方法 ============

  /**
   * 删除记录
   *
   * scope 条件合并到 WHERE 交由数据库处理:
   * `DELETE ... WHERE id = X AND (scope_conditions)`
   * 若影响行数为 0 则表示无权限，返回 false。
   */
  async delete(id: number, ctx?: CrudContext): Promise<boolean> {
    const scopeWhere = this.buildWhere(`id = ${id}`, ctx)
    const deleted = await this.model.deleteMany(scopeWhere!)
    return deleted > 0
  }

  /**
   * 条件删除多条
   *
   * scope 合并到 WHERE，返回实际删除的行数。
   */
  async deleteMany(filter: string, ctx?: CrudContext): Promise<number> {
    const where = this.buildWhere(filter, ctx)
    if (!where) return 0
    return await this.model.deleteMany(where)
  }
}

// ============ 导出工具函数（供高级用法） ============

export { buildVelocityContext, renderSsql, evaluateSsql }
