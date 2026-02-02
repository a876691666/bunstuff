/**
 * useDict 组合式函数
 * 用于获取和缓存字典数据
 */

import { shallowRef, computed, type Ref, type ComputedRef } from 'vue'
import type { SelectOption } from 'naive-ui'
import { dictClientApi } from '@/api'
import type { DictData } from '@/types'

// 字典缓存
const dictCache = new Map<string, DictData[]>()

export interface UseDictReturn {
  data: Ref<DictData[]>
  loading: Ref<boolean>
  options: ComputedRef<SelectOption[]>
  getLabel: (value: string) => string
  getValue: (label: string) => string
  refresh: () => Promise<void>
}

/**
 * 获取字典数据
 * @param dictType 字典类型
 * @param immediate 是否立即加载
 */
export function useDict(dictType: string, immediate = true): UseDictReturn {
  const data = shallowRef<DictData[]>([])
  const loading = shallowRef(false)

  const options = computed<SelectOption[]>(() =>
    data.value.map((d) => ({
      label: d.label,
      value: d.value,
    })),
  )

  async function load(): Promise<void> {
    // 先检查缓存
    if (dictCache.has(dictType)) {
      data.value = dictCache.get(dictType)!
      return
    }

    loading.value = true
    try {
      const res = await dictClientApi.getByType(dictType)
      data.value = res
      dictCache.set(dictType, res)
    } catch (err) {
      console.error(`加载字典 ${dictType} 失败`, err)
      data.value = []
    } finally {
      loading.value = false
    }
  }

  async function refresh(): Promise<void> {
    dictCache.delete(dictType)
    await load()
  }

  function getLabel(value: string): string {
    return data.value.find((d) => d.value === value)?.label || value
  }

  function getValue(label: string): string {
    return data.value.find((d) => d.label === label)?.value || label
  }

  if (immediate) {
    load()
  }

  return {
    data,
    loading,
    options,
    getLabel,
    getValue,
    refresh,
  }
}

/**
 * 批量获取字典数据
 * @param dictTypes 字典类型数组
 */
export function useDicts(dictTypes: string[]): Record<string, UseDictReturn> {
  const result: Record<string, UseDictReturn> = {}
  for (const type of dictTypes) {
    result[type] = useDict(type)
  }
  return result
}

/**
 * 清除字典缓存
 */
export function clearDictCache(dictType?: string): void {
  if (dictType) {
    dictCache.delete(dictType)
  } else {
    dictCache.clear()
  }
}
