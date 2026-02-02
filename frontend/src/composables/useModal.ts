/**
 * useModal 组合式函数
 * 封装通用的弹窗逻辑
 */

import { shallowRef, reactive, type Ref, type UnwrapRef } from 'vue'

// ============ 类型定义 ============

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseModalOptions<T extends Record<string, any>> {
  /** 初始表单数据 */
  defaultData: T
  /** 保存前验证 */
  validate?: (data: T, isEdit: boolean) => string | null
  /** 创建 API */
  createApi?: (data: T) => Promise<unknown>
  /** 更新 API */
  updateApi?: (id: number, data: Partial<T>) => Promise<unknown>
  /** 保存成功后回调 */
  onSuccess?: () => void
  /** 保存失败后回调 */
  onError?: (err: Error) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseModalReturn<T extends Record<string, any>> {
  // 状态
  visible: Ref<boolean>
  loading: Ref<boolean>
  title: Ref<string>
  editingId: Ref<number | null>
  formData: UnwrapRef<T>
  isEdit: Ref<boolean>

  // 方法
  open: (title?: string) => void
  edit: (id: number, data: Partial<T>, title?: string) => void
  close: () => void
  save: () => Promise<boolean>
  resetForm: () => void
}

// ============ 组合式函数 ============

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useModal<T extends Record<string, any>>(
  options: UseModalOptions<T>,
): UseModalReturn<T> {
  const { defaultData, validate, createApi, updateApi, onSuccess, onError } = options

  // 状态
  const visible = shallowRef(false)
  const loading = shallowRef(false)
  const title = shallowRef('')
  const editingId = shallowRef<number | null>(null)
  const formData = reactive<T>({ ...defaultData }) as UnwrapRef<T>
  const isEdit = shallowRef(false)

  // 重置表单
  function resetForm(): void {
    Object.assign(formData as object, { ...defaultData })
  }

  // 打开新增弹窗
  function open(modalTitle = '新增'): void {
    editingId.value = null
    isEdit.value = false
    title.value = modalTitle
    resetForm()
    visible.value = true
  }

  // 打开编辑弹窗
  function edit(id: number, data: Partial<T>, modalTitle = '编辑'): void {
    editingId.value = id
    isEdit.value = true
    title.value = modalTitle
    resetForm()
    Object.assign(formData as object, data)
    visible.value = true
  }

  // 关闭弹窗
  function close(): void {
    visible.value = false
    loading.value = false
  }

  // 保存
  async function save(): Promise<boolean> {
    // 验证
    if (validate) {
      const error = validate(formData as T, isEdit.value)
      if (error) {
        onError?.(new Error(error))
        return false
      }
    }

    loading.value = true
    try {
      if (isEdit.value && editingId.value !== null) {
        if (updateApi) {
          await updateApi(editingId.value, formData as Partial<T>)
        }
      } else {
        if (createApi) {
          await createApi(formData as T)
        }
      }

      close()
      onSuccess?.()
      return true
    } catch (err) {
      onError?.(err as Error)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    visible,
    loading,
    title,
    editingId,
    formData,
    isEdit,
    // 方法
    open,
    edit,
    close,
    save,
    resetForm,
  }
}
