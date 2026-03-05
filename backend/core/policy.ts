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

/** 菜单定义（扁平结构，通过 parent 字段关联父菜单） */
export interface MenuDef {
  /** 菜单名称 */
  name: string
  /** 路由路径（唯一标识） */
  path: string
  /** 父菜单路径（为空或不填表示顶级菜单） */
  parent?: string | null
  /** 组件路径 */
  component?: string | null
  /** 图标 */
  icon?: string | null
  /** 菜单类型: 1-目录 2-菜单 3-按钮（默认 2） */
  type?: number
  /** 是否可见: 0-隐藏 1-显示（默认 1） */
  visible?: number
  /** 重定向地址 */
  redirect?: string | null
  /** 排序值（默认 0） */
  sort?: number
  /** 权限编码（关联权限，决定菜单可见性） */
  permCode?: string | null
}

/** 解析后的菜单（扁平结构，带自动分配的 ID） */
export interface ResolvedMenu {
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
}

/** 模块配置定义 */
export interface ModuleConfig {
  /** 模块名称（用于日志和调试） */
  module: string
  /** OpenAPI Tag 显示名称，如 '管理 - 用户' */
  name?: string
  /** OpenAPI Tag 描述 */
  description?: string
  /** 权限列表 */
  permissions: PermissionDef[]
  /** 角色权限分配：'*' 表示该模块所有权限，string[] 指定具体权限编码 */
  roles: Record<string, '*' | string[]>
  /** 数据域规则（可选） */
  scopes?: ScopeDef[]
  /** 菜单定义（可选，扁平结构，通过 parent 关联父菜单） */
  menus?: MenuDef[]
}

/** 分组配置定义（用于父级目录如 topology/config.ts） */
export interface GroupConfig {
  /** 分组显示名称（用于 OpenAPI Tag） */
  name: string
  /** 分组描述 */
  description?: string
  /** 菜单定义（可选，通常用于定义父级目录菜单） */
  menus?: MenuDef[]
}

/** 定义分组配置（类型辅助，原样返回） */
export function defineGroupConfig(config: GroupConfig): GroupConfig {
  return config
}

/** @deprecated 使用 ModuleConfig 代替 */
export type PolicyDefinition = ModuleConfig

// ============ 辅助函数 ============

/** 定义模块配置（类型辅助，原样返回） */
export function defineConfig(config: ModuleConfig): ModuleConfig {
  return config
}

/** @deprecated 使用 defineConfig 代替 */
export const definePolicy = defineConfig

/** 解析模块配置为 Casbin 策略数组 (sub, dom, obj, act) */
export function resolvePolicies(configs: ModuleConfig[]): string[][] {
  const policies: string[][] = []

  for (const def of configs) {
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

/** 从配置列表中提取所有权限编码集合 */
export function collectPermissionCodes(configs: ModuleConfig[]): Set<string> {
  const codes = new Set<string>()
  for (const def of configs) {
    for (const p of def.permissions) {
      codes.add(p.code)
    }
  }
  return codes
}

/** 从配置列表中提取所有权限定义 */
export function collectPermissions(configs: ModuleConfig[]): PermissionDef[] {
  return configs.flatMap((d) => d.permissions)
}

// ============ 菜单收集 ============

/**
 * 从所有模块配置中收集并合并菜单，返回扁平化的 ResolvedMenu 列表。
 * 同 path 的菜单自动去重（第一个定义的属性优先）。
 * parent 字段通过路径匹配解析为 parentId。
 */
export function collectAllMenus(configs: ModuleConfig[], groupConfigs?: GroupConfig[]): ResolvedMenu[] {
  // Step 1: 收集所有菜单，同 path 去重（先来的优先）
  const menuMap = new Map<string, MenuDef>()

  // 先收集分组配置中的菜单（父级目录菜单优先）
  if (groupConfigs) {
    for (const gc of groupConfigs) {
      if (!gc.menus?.length) continue
      for (const menu of gc.menus) {
        if (!menuMap.has(menu.path)) {
          menuMap.set(menu.path, menu)
        }
      }
    }
  }

  for (const config of configs) {
    if (!config.menus?.length) continue
    for (const menu of config.menus) {
      if (menuMap.has(menu.path)) {
        const existing = menuMap.get(menu.path)!
        // 目录菜单（type=1，无 component）允许多模块重复声明，自动合并缺失属性
        const isDir = (existing.type ?? 2) === 1 && !existing.component && !menu.component
        if (isDir) {
          // 合并：补充首次定义中缺失的 redirect / icon
          if (!existing.redirect && menu.redirect) existing.redirect = menu.redirect
          if (!existing.icon && menu.icon) existing.icon = menu.icon
        } else if ((existing.component ?? null) !== (menu.component ?? null) || (existing.redirect ?? null) !== (menu.redirect ?? null)) {
          console.warn(`[menu] 重复路径 "${menu.path}"：模块 "${config.module}" 的定义被忽略（首次定义优先）`)
        }
      } else {
        menuMap.set(menu.path, menu)
      }
    }
  }

  // Step 2: 按 sort 排序，分配 ID
  const allMenus = [...menuMap.values()].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  const pathToId = new Map<string, number>()
  let nextId = 1
  for (const menu of allMenus) {
    pathToId.set(menu.path, nextId++)
  }

  // Step 3: 解析 parent path → parentId，检测无效 parent
  return allMenus.map((menu) => {
    let parentId: number | null = null
    if (menu.parent) {
      const resolved = pathToId.get(menu.parent)
      if (resolved != null) {
        parentId = resolved
      } else {
        console.warn(`[menu] "${menu.path}" 的 parent "${menu.parent}" 未找到对应菜单，将作为顶级菜单处理`)
      }
    }
    return {
      id: pathToId.get(menu.path)!,
      parentId,
      name: menu.name,
      path: menu.path,
      component: menu.component ?? null,
      icon: menu.icon ?? null,
      type: menu.type ?? 2,
      visible: menu.visible ?? 1,
      status: 1,
      redirect: menu.redirect ?? null,
      sort: menu.sort ?? 0,
      permCode: menu.permCode ?? null,
    }
  })
}

// ============ OpenAPI Tags 收集 ============

/**
 * 从 configByDir 中收集有序的 OpenAPI Tags 列表。
 * 按目录路径排序，确保父分组在子模块之前：
 *   【admin/topology】  → 管理 - 拓扑图（父分组）
 *   【admin/topology/icons】  → 管理 - 拓扑图图标（子模块）
 */
export function collectOpenApiTags(
  configByDir: Record<string, ModuleConfig | GroupConfig>,
): { name: string; description?: string }[] {
  const tags: { name: string; description?: string }[] = []
  const seen = new Set<string>()

  // 按路径排序：短路径（父级）先于长路径（子级），同级按字母序
  const entries = Object.entries(configByDir).sort((a, b) => a[0].localeCompare(b[0]))
  const dirs = new Set(entries.map(([dir]) => dir))

  // 检测哪些目录是父级（有子目录存在于 configByDir 中）
  const parentDirs = new Set<string>()
  for (const dir of dirs) {
    for (const other of dirs) {
      if (other !== dir && other.startsWith(dir + '/')) {
        parentDirs.add(dir)
        break
      }
    }
  }

  for (const [dir, config] of entries) {
    if (!config.name) continue
    // 有子集的父级名称套【】括号，有父级的子集增加 >>>> 前缀
    const isParent = parentDirs.has(dir)
    const isChild = [...parentDirs].some((p) => dir.startsWith(p + '/'))
    const name = isParent ? `【${config.name}】` : isChild ? `${config.name}` : config.name
    if (!seen.has(name)) {
      tags.push({ name, description: config.description })
      seen.add(name)
    }
  }

  return tags
}
