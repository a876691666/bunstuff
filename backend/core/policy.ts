/**
 * 策略定义工具
 *
 * 每个 API 模块通过 definePolicy() 声明自己的权限、角色分配和数据域规则。
 * 所有策略在启动时由 policies/index.ts 收集并加载到 Casbin 引擎中。
 * 策略为只读，运行时不可修改。
 */

// ============ 类型定义 ============

/** 权限定义 */
export interface PermissionDef {
  /** 权限编码，如 'config:admin:list' */
  code: string
  /** 权限名称 */
  name: string
  /** 权限描述 */
  description?: string
}

/** 数据域规则 */
export interface ScopeDef {
  /** 适用角色编码 */
  role: string
  /** 关联表名 */
  table: string
  /** 关联权限编码，标识该规则适用于哪个操作 */
  permission: string
  /** SSQL 过滤规则，支持 $auth.userId 等变量 */
  rule: string
  /** 规则描述 */
  description?: string
}

/** 策略定义 */
export interface PolicyDefinition {
  /** 模块名称（用于日志和调试） */
  module: string
  /** 权限列表 */
  permissions: PermissionDef[]
  /** 角色权限分配：'*' 表示该模块所有权限，string[] 指定具体权限编码 */
  roles: Record<string, '*' | string[]>
  /** 数据域规则（可选） */
  scopes?: ScopeDef[]
}

// ============ 辅助函数 ============

/** 定义策略（类型辅助，原样返回） */
export function definePolicy(policy: PolicyDefinition): PolicyDefinition {
  return policy
}

/** 解析策略定义为 Casbin 策略数组 (sub, dom, obj, act) */
export function resolvePolicies(definitions: PolicyDefinition[]): string[][] {
  const policies: string[][] = []

  for (const def of definitions) {
    // 解析角色-权限分配
    for (const [roleCode, assignment] of Object.entries(def.roles)) {
      const permCodes =
        assignment === '*' ? def.permissions.map((p) => p.code) : assignment
      for (const permCode of permCodes) {
        policies.push([roleCode, 'perm', permCode, 'allow', 'allow'])
      }
    }

    // 解析数据域规则（5字段：role, 'scope', table, permission, rule）
    if (def.scopes) {
      for (const scope of def.scopes) {
        policies.push([scope.role, 'scope', scope.table, scope.permission, scope.rule])
      }
    }
  }

  return policies
}

/** 从策略定义列表中提取所有权限编码集合 */
export function collectPermissionCodes(definitions: PolicyDefinition[]): Set<string> {
  const codes = new Set<string>()
  for (const def of definitions) {
    for (const p of def.permissions) {
      codes.add(p.code)
    }
  }
  return codes
}

/** 从策略定义列表中提取所有权限定义 */
export function collectPermissions(definitions: PolicyDefinition[]): PermissionDef[] {
  return definitions.flatMap((d) => d.permissions)
}
