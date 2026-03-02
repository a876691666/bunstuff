/**
 * Seed 自动注册 - 基于 glob 扫描 models 下的 seed.ts
 * 替代原先 services/seed-register.ts 中的硬编码导入
 */

import { Glob } from 'bun'
import { join } from 'path'
import type { SeedDefinition } from '@/services/seed'
import * as seedService from '@/services/seed'

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

// ─── 使用 glob 自动扫描 models/*/seed.ts ───
const glob = new Glob('*/seed.ts')
const modelsPath = join(import.meta.dir, '../models')
const allSeeds: SeedDefinition[] = []

for await (const file of glob.scan({ cwd: modelsPath })) {
  const mod = await import(join(modelsPath, file))
  const seeds = extractSeeds(mod)
  allSeeds.push(...seeds)
}

// 拓扑排序后注册
const sorted = topoSort(allSeeds)
seedService.registerMany(sorted)
console.log(`✅ Seeds registered (${sorted.length} from glob)`)

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
