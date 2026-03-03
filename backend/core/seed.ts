import type { SeedDefinition } from '@/services/seed'
import * as seedService from '@/services/seed'

// 运行时 Seed 注册表（编译时生成）
import { seedModules } from '../_generated/seeds.generated'

/** 判断对象是否为 SeedDefinition */
function isSeedDefinition(obj: unknown): obj is SeedDefinition {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).name === 'string' &&
    typeof (obj as any).run === 'function'
  )
}

/** 从模块导出中提取所有 SeedDefinition（支持 default / named 导出） */
function extractSeeds(mod: Record<string, unknown>): SeedDefinition[] {
  const seeds: SeedDefinition[] = []
  const seen = new Set<string>()

  for (const value of Object.values(mod)) {
    if (isSeedDefinition(value) && !seen.has(value.name)) {
      seen.add(value.name)
      seeds.push(value)
    }
  }

  return seeds
}

/** 对 seeds 按 dependencies 进行拓扑排序 */
function topoSort(seeds: SeedDefinition[]): SeedDefinition[] {
  const map = new Map<string, SeedDefinition>()
  for (const s of seeds) map.set(s.name, s)

  const visited = new Set<string>()
  const result: SeedDefinition[] = []

  function visit(name: string) {
    if (visited.has(name)) return
    visited.add(name)
    const seed = map.get(name)
    if (!seed) return
    for (const dep of seed.dependencies ?? []) {
      visit(dep)
    }
    result.push(seed)
  }

  for (const s of seeds) visit(s.name)
  return result
}

// ─── 使用编译时生成的静态导入加载所有 Seed ───
const allSeeds: SeedDefinition[] = []

for (const mod of seedModules) {
  const seeds = extractSeeds(mod as Record<string, unknown>)
  allSeeds.push(...seeds)
}

// 拓扑排序后注册
const sorted = topoSort(allSeeds)
seedService.registerMany(sorted)
console.log(`✅ Seeds registered (${sorted.length} from registry)`)

/** Seed 模块配置 */
export interface SeedModuleOptions {
  /** 是否在初始化时自动执行所有未执行的 Seeds，默认 false */
  autoRun?: boolean
}

/**
 * 执行 Seeds（注册已在模块加载时通过 glob 自动完成）
 */
export async function runSeeds(options: SeedModuleOptions = {}) {
  if (options.autoRun) {
    try {
      await seedService.autoRun()
      console.log('✅ Seeds executed')
    } catch (err) {
      console.error('[Seed] 自动执行失败:', err)
    }
  }
}
