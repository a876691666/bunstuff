import type { SeedDefinition } from '@/modules/seed/main/service'
import CrudTable from './index'

export const crudTableSeed: SeedDefinition = {
  name: 'crud-table-init',
  description: '初始化示例 CRUD 表配置',
  async run() {
    const existing = await CrudTable.findOne({ where: `tableName = 'example'` })
    if (existing) return

    await CrudTable.create({
      tableName: 'example',
      displayName: '示例表',
      columns: JSON.stringify([
        { name: 'id', type: 'number', primaryKey: true, autoIncrement: true, description: 'ID' },
        { name: 'name', type: 'string', required: true, description: '名称' },
        { name: 'status', type: 'number', default: 1, description: '状态' },
      ]),
      description: '系统自带的示例 CRUD 表',
      status: 1,
      createBy: 1,
      remark: '系统初始化创建',
    })

    console.log('✅ CRUD 表配置初始化完成')
  },
}

export default crudTableSeed
