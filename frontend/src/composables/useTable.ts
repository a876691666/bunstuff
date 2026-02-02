/**
 * useTable 组合式函数
 * 封装通用的表格、分页、加载逻辑
 */

import { shallowRef, computed, type Ref, type ComputedRef } from 'vue'
import type { PageResult } from '@/utils/http'
import { where, type Value, Op } from '@/utils/ssql'

// ============ 类型定义 ============

export interface UseTableOptions<T, Q extends Record<string, unknown> = Record<string, unknown>> {
  /** 获取数据的 API 函数 */
  api: (params: Record<string, unknown>) => Promise<PageResult<T>>
  /** 初始搜索参数 */
  defaultQuery?: Q
  /** 初始分页大小 */
  defaultPageSize?: number
  /** 是否立即加载 */
  immediate?: boolean
  /** 字段操作符映射（用于 SSQL） */
  opMap?: Record<string, Op>
  /** 数据转换函数 */
  transform?: (data: T[]) => T[]
}

export interface UseTableReturn<T, Q extends Record<string, unknown>> {
  // 状态
  loading: Ref<boolean>
  data: Ref<T[]>
  total: Ref<number>
  page: Ref<number>
  pageSize: Ref<number>
  query: Ref<Q>

  // 计算属性
  pageCount: ComputedRef<number>
  isEmpty: ComputedRef<boolean>
  hasData: ComputedRef<boolean>

  // 方法
  load: () => Promise<void>
  reload: () => Promise<void>
  search: () => Promise<void>
  reset: () => Promise<void>
  setPage: (p: number) => Promise<void>
  setPageSize: (ps: number) => Promise<void>
  setQuery: (q: Partial<Q>) => void
}

// ============ 组合式函数 ============

export function useTable<T, Q extends Record<string, unknown> = Record<string, unknown>>(
  options: UseTableOptions<T, Q>,
): UseTableReturn<T, Q> {
  const {
    api,
    defaultQuery = {} as Q,
    defaultPageSize = 10,
    immediate = true,
    opMap,
    transform,
  } = options

  // 状态
  const loading = shallowRef(false)
  const data = shallowRef<T[]>([])
  const total = shallowRef(0)
  const page = shallowRef(1)
  const pageSize = shallowRef(defaultPageSize)
  const query = shallowRef<Q>({ ...defaultQuery })

  // 计算属性
  const pageCount = computed(() => Math.ceil(total.value / pageSize.value) || 1)
  const isEmpty = computed(() => data.value.length === 0)
  const hasData = computed(() => data.value.length > 0)

  // 构建查询参数
  function buildParams(): Record<string, unknown> {
    const params: Record<string, unknown> = {
      page: page.value,
      pageSize: pageSize.value,
    }

    // 使用 SSQL 构建过滤条件
    const builder = where()
    for (const [key, value] of Object.entries(query.value)) {
      if (value === undefined || value === null || value === '') continue
      const op = opMap?.[key] ?? Op.Eq
      if (op === Op.Like) {
        builder.like(key, String(value))
      } else if (op === Op.In && Array.isArray(value)) {
        builder.in(key, value as Value[])
      } else {
        builder.eq(key, value as Value)
      }
    }

    const filter = builder.toString()
    if (filter) {
      params.filter = filter
    }

    return params
  }

  // 加载数据
  async function load(): Promise<void> {
    loading.value = true
    try {
      const params = buildParams()
      const res = await api(params)
      data.value = transform ? transform(res.data) : res.data
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  // 重新加载当前页
  async function reload(): Promise<void> {
    await load()
  }

  // 搜索（重置到第一页）
  async function search(): Promise<void> {
    page.value = 1
    await load()
  }

  // 重置搜索条件并加载
  async function reset(): Promise<void> {
    query.value = { ...defaultQuery }
    page.value = 1
    await load()
  }

  // 设置页码
  async function setPage(p: number): Promise<void> {
    page.value = p
    await load()
  }

  // 设置每页大小
  async function setPageSize(ps: number): Promise<void> {
    pageSize.value = ps
    page.value = 1
    await load()
  }

  // 设置查询条件
  function setQuery(q: Partial<Q>): void {
    query.value = { ...query.value, ...q }
  }

  // 立即加载
  if (immediate) {
    load()
  }

  return {
    // 状态
    loading,
    data: data as Ref<T[]>,
    total,
    page,
    pageSize,
    query: query as Ref<Q>,
    // 计算属性
    pageCount,
    isEmpty,
    hasData,
    // 方法
    load,
    reload,
    search,
    reset,
    setPage,
    setPageSize,
    setQuery,
  }
}
