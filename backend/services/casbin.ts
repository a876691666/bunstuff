/**
 * Casbin 服务 - 基于硬编码策略文件的权限引擎
 *
 * 从各 API 模块的 policy.ts 收集策略定义，加载到 Casbin 引擎。
 * 策略只读，运行时不可修改。
 *
 * 策略格式 (4字段):
 *   p = sub, dom, obj, act
 *
 * 策略约定:
 *   - 权限授予:  p, <roleCode>, perm,  <permCode>,   allow,      allow
 *   - 数据域:    p, <roleCode>, scope, <tableName>,   <permCode>, <ssqlRule>
 */

import { newEnforcer, newModel, type Enforcer } from 'casbin'
import { allPolicies } from '@/_generated/policies.generated'
import { resolvePolicies, collectPermissions, type PermissionDef } from '@/core/policy'

// ============ Casbin 模型 ============

const CASBIN_MODEL = `
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act, eft

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.dom == p.dom && r.obj == p.obj && r.act == p.act
`

// ============ 内部状态 ============

let enforcer: Enforcer | null = null
let lastUpdated: Date | null = null

/** 所有权限定义（来自策略文件，只读） */
let allPermissionDefs: PermissionDef[] = []

function getEnforcer(): Enforcer {
  if (!enforcer) throw new Error('[Casbin] 未初始化，请先调用 init()')
  return enforcer
}

// ============ 初始化 ============

/** 初始化 Casbin enforcer 并从策略文件加载全部策略 */
export async function init(): Promise<void> {
  const m = newModel()
  m.loadModelFromText(CASBIN_MODEL)
  enforcer = await newEnforcer(m)
  await loadPolicies()
}

/** 重新加载全部策略（实际上是重新从静态策略文件解析） */
export async function reload(): Promise<void> {
  getEnforcer()
  await loadPolicies()
}

// ============ 从策略文件加载策略 ============

async function loadPolicies(): Promise<void> {
  const e = getEnforcer()
  console.log('[Casbin] 开始加载策略...')
  const start = Date.now()

  // 清空现有策略
  e.clearPolicy()

  // 从策略定义中解析出 Casbin 策略
  const policies = resolvePolicies(allPolicies)

  // 缓存所有权限定义
  allPermissionDefs = collectPermissions(allPolicies)

  if (policies.length > 0) {
    await e.addPolicies(policies)
  }

  lastUpdated = new Date()
  const elapsed = Date.now() - start
  console.log(
    `[Casbin] 策略加载完成: ${policies.length} 条策略 (来自 ${allPolicies.length} 个模块), 耗时 ${elapsed}ms`,
  )
}

// ============ 权限检查 ============

/** 检查角色是否拥有指定权限 */
export async function enforce(roleCode: string, permCode: string): Promise<boolean> {
  return getEnforcer().enforce(roleCode, 'perm', permCode, 'allow')
}

/** 检查角色是否拥有所有指定权限 */
export async function hasAllPermissions(roleCode: string, permCodes: string[]): Promise<boolean> {
  for (const code of permCodes) {
    if (!(await enforce(roleCode, code))) return false
  }
  return true
}

/** 检查角色是否拥有任一指定权限 */
export async function hasAnyPermission(roleCode: string, permCodes: string[]): Promise<boolean> {
  for (const code of permCodes) {
    if (await enforce(roleCode, code)) return true
  }
  return false
}

// ============ 权限查询 ============

/** 获取角色的所有权限编码 */
export async function getRolePermissionCodes(roleCode: string): Promise<string[]> {
  const policies = await getEnforcer().getFilteredPolicy(0, roleCode, 'perm')
  return policies.map((p) => p[2]!)
}

/** 获取所有已注册的权限定义（只读） */
export function getAllPermissionDefs(): PermissionDef[] {
  return allPermissionDefs
}

// ============ 数据域查询 (ssqlRule) ============

/** 获取角色在指定表上的所有 SSQL 规则，可按权限过滤 */
export async function getRoleSsqlRules(roleCode: string, tableName: string, permCode?: string): Promise<string[]> {
  if (permCode) {
    const policies = await getEnforcer().getFilteredPolicy(0, roleCode, 'scope', tableName, permCode)
    return policies.map((p) => p[4]!)
  }
  const policies = await getEnforcer().getFilteredPolicy(0, roleCode, 'scope', tableName)
  return policies.map((p) => p[4]!)
}

/** 获取角色的所有数据域规则，按表名和权限分组 */
export async function getRoleScopes(roleCode: string): Promise<Array<{ table: string; permission: string; rule: string }>> {
  const policies = await getEnforcer().getFilteredPolicy(0, roleCode, 'scope')
  return policies.map((p) => ({
    table: p[2]!,
    permission: p[3]!,
    rule: p[4]!,
  }))
}

// ============ 状态 ============

export async function getStatus() {
  if (!enforcer) {
    return { initialized: false, policyCount: 0, permCount: 0, scopeCount: 0, moduleCount: 0, lastUpdated: '' }
  }
  const allCasbinPolicies = await enforcer.getPolicy()
  return {
    initialized: true,
    lastUpdated: lastUpdated?.toISOString() ?? '',
    policyCount: allCasbinPolicies.length,
    permCount: allCasbinPolicies.filter((p: string[]) => p[1] === 'perm').length,
    scopeCount: allCasbinPolicies.filter((p: string[]) => p[1] === 'scope').length,
    moduleCount: allPolicies.length,
    permissionDefCount: allPermissionDefs.length,
  }
}
