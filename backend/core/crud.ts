import type { DataScope } from '@/plugins/rbac'
import { render } from 'velocityjs'
import {
  parse as parseSsql,
  Op,
  Logic,
  FieldExpr,
  LogicExpr,
  GroupExpr,
  LiteralExpr,
} from '@pkg/ssql'

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
 * 内部自动提取 request/params/body/query/cookie、auth 信息、dataScope
 * 并构建 Velocity 模板上下文进行 SSQL 参数注入。
 */
export interface CrudContext {
  request?: Request
  params?: Record<string, any>
  body?: any
  query?: Record<string, any>
  cookie?: Record<string, any>
  userId?: number | null
  roleId?: string | null
  session?: any
  dataScope?: DataScope | null
  [key: string]: any
}

// ============ Velocity 模板渲染 ============

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
  'dataScope',
  'vip',
  'file',
  'notice',
  'dict',
  'config',
  'loginLog',
])

/** 从 CrudContext 构建 Velocity 模板上下文 */
export function buildVelocityContext(ctx?: CrudContext): Record<string, any> {
  if (!ctx) return {}

  const request = ctx.request
  const headers: Record<string, string> = {}
  const cookies: Record<string, string> = {}

  if (request?.headers) {
    request.headers.forEach((value, key) => {
      headers[key] = value
    })
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      for (const part of cookieHeader.split(';')) {
        const [k, ...v] = part.trim().split('=')
        if (k) cookies[k.trim()] = v.join('=').trim()
      }
    }
  }

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
      roleCode: ctx.roleId ?? null,
      username: ctx.session?.username ?? null,
      session: ctx.session ?? null,
    },
  }

  for (const [key, value] of Object.entries(ctx)) {
    if (!ELYSIA_INTERNAL_KEYS.has(key) && !(key in velocityCtx)) {
      velocityCtx[key] = value
    }
  }
  return velocityCtx
}

/** 使用 Velocity 渲染 SSQL 规则模板 */
export function renderSsql(ssqlTemplate: string, velocityCtx: Record<string, any>): string {
  try {
    return render(ssqlTemplate, velocityCtx).trim()
  } catch {
    return ssqlTemplate
  }
}

// ============ SSQL 布尔求值 ============

type Expression = FieldExpr | LogicExpr | GroupExpr | LiteralExpr

function evalField(expr: FieldExpr, data: Record<string, any>): boolean {
  const fieldValue = data[expr.field]
  switch (expr.op) {
    case Op.Eq:
      return fieldValue == expr.value // eslint-disable-line eqeqeq
    case Op.Neq:
      return fieldValue != expr.value // eslint-disable-line eqeqeq
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
      return fieldValue.includes(expr.value.replace(/%/g, ''))
    }
    case Op.NotLike: {
      if (typeof fieldValue !== 'string' || typeof expr.value !== 'string') return false
      return !fieldValue.includes(expr.value.replace(/%/g, ''))
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

function evalExpr(expr: Expression, data: Record<string, any>): boolean {
  if (expr instanceof FieldExpr) return evalField(expr, data)
  if (expr instanceof LogicExpr) {
    return expr.logic === Logic.And
      ? expr.exprs.every((e) => evalExpr(e, data))
      : expr.exprs.some((e) => evalExpr(e, data))
  }
  if (expr instanceof GroupExpr) return evalExpr(expr.inner, data)
  if (expr instanceof LiteralExpr) {
    switch (expr.op) {
      case Op.Eq:
        return expr.left === expr.right
      case Op.Neq:
        return expr.left !== expr.right
      case Op.Gt:
        return (expr.left as number) > (expr.right as number)
      case Op.Gte:
        return (expr.left as number) >= (expr.right as number)
      case Op.Lt:
        return (expr.left as number) < (expr.right as number)
      case Op.Lte:
        return (expr.left as number) <= (expr.right as number)
      default:
        return true
    }
  }
  return true
}

/** 对渲染后的 SSQL 字符串进行布尔求值 */
export function evaluateSsql(ssql: string, data: Record<string, any>): boolean {
  const expr = parseSsql(ssql)
  if (!expr) return true
  return evalExpr(expr, data)
}

// ============ DataScope WHERE 构建 ============

/** 获取已渲染的 scope 规则列表 */
export function getScopeRules(tableName: string, ctx?: CrudContext): string[] {
  if (!ctx?.dataScope) return []
  const rawRules = ctx.dataScope.getSsqlRules(tableName)
  if (rawRules.length === 0) return []
  const velocityCtx = buildVelocityContext(ctx)
  return rawRules.map((r) => renderSsql(r, velocityCtx)).filter(Boolean)
}

/**
 * 构建带数据权限的 WHERE 条件
 *
 * 将用户的 filter 与 dataScope 中的 SSQL 规则合并为一个 WHERE 字符串。
 * 若无 scope 规则则直接返回 filter。
 */
export function buildWhere(
  tableName: string,
  filter?: string,
  ctx?: CrudContext,
): string | undefined {
  if (!ctx?.dataScope) return filter || undefined
  const rawRules = ctx.dataScope.getSsqlRules(tableName)
  if (rawRules.length === 0) return filter || undefined

  const velocityCtx = buildVelocityContext(ctx)
  const rendered = rawRules.map((r) => renderSsql(r, velocityCtx)).filter(Boolean)
  if (rendered.length === 0) return filter || undefined

  const scopeExpr = rendered.length === 1 ? rendered[0]! : `(${rendered.join(' || ')})`
  if (!filter) return scopeExpr
  return `(${filter}) && (${scopeExpr})`
}

/**
 * 数据权限校验：创建数据前检查是否满足 scope 规则
 *
 * @returns true 表示通过校验（无规则或满足至少一条规则）
 */
export function checkCreateScope(
  tableName: string,
  data: Record<string, any>,
  ctx?: CrudContext,
): boolean {
  const rules = getScopeRules(tableName, ctx)
  if (rules.length === 0) return true
  return rules.some((rule) => evaluateSsql(rule, data))
}
