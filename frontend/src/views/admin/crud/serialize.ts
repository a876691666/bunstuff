import type { ColumnDef } from '@/types'

/**
 * CRUD 前端校验工具
 *
 * 序列化/反序列化已由后端 ORM Model 层处理（boolean ↔ 0/1, date ↔ ISO string）。
 * 前端只负责：
 * - 表单数据校验
 * - 构建表单默认值
 * - 单元格展示格式化
 */

// ============ 表单校验 ============

/**
 * 校验一行表单数据是否符合列定义
 * @returns 错误信息字符串，null 表示通过
 */
export function validateRow(
  data: Record<string, unknown>,
  columns: ColumnDef[],
): string | null {
  for (const col of columns) {
    if (col.primaryKey && col.autoIncrement) continue
    const val = data[col.name]

    // 非空校验（非 nullable 且无默认值的列）
    if (!col.nullable && col.default === undefined) {
      if (val === null || val === undefined || val === '') {
        if (col.type !== 'boolean' && col.type !== 'number') {
          return `${col.description || col.name} 不能为空`
        }
      }
    }

    // 类型校验
    if (val !== null && val !== undefined && val !== '') {
      switch (col.type) {
        case 'number':
          if (typeof val !== 'number' && isNaN(Number(val))) {
            return `${col.description || col.name} 必须为数字`
          }
          break
        case 'boolean':
          if (val !== 0 && val !== 1 && typeof val !== 'boolean') {
            return `${col.description || col.name} 必须为布尔值`
          }
          break
        case 'date':
          if (typeof val === 'string' && val.length > 0) {
            const d = new Date(val)
            if (isNaN(d.getTime())) {
              return `${col.description || col.name} 日期格式无效`
            }
          }
          break
      }
    }
  }
  return null
}

// ============ 表单默认值 ============

/**
 * 根据列定义生成表单的默认值
 * @param mode 'create' 时过滤 showInCreate，'update' 时过滤 showInUpdate
 */
export function buildFormDefaults(columns: ColumnDef[], mode: 'create' | 'update' = 'create'): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const col of columns) {
    if (col.primaryKey && col.autoIncrement) continue
    if (mode === 'create' && col.showInCreate === false) continue
    if (mode === 'update' && col.showInUpdate === false) continue

    if (col.default !== undefined && col.default !== null) {
      switch (col.type) {
        case 'boolean':
          data[col.name] = (col.default === 1 || col.default === true || col.default === '1') ? 1 : 0
          break
        case 'number':
          data[col.name] = Number(col.default)
          break
        default:
          data[col.name] = String(col.default)
      }
    } else {
      switch (col.type) {
        case 'boolean':
          data[col.name] = 0
          break
        case 'number':
          data[col.name] = 0
          break
        case 'date':
          data[col.name] = null
          break
        default:
          data[col.name] = ''
      }
    }
  }
  return data
}

// ============ 显示格式化 ============

/**
 * 将单个字段值格式化为表格展示字符串
 * 后端已完成类型转换，此处仅做展示格式化
 */
export function formatCellValue(value: unknown, col: ColumnDef): string {
  if (value === null || value === undefined) return '-'

  switch (col.type) {
    case 'boolean':
      return value === 1 || value === true ? '是' : '否'
    case 'date':
      if (!value) return '-'
      try {
        const d = new Date(value as string)
        if (isNaN(d.getTime())) return String(value)
        return d.toLocaleString('zh-CN')
      } catch {
        return String(value)
      }
    case 'number':
      return String(value)
    default:
      return String(value)
  }
}
