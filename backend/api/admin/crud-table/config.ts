import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'crud-table',
  permissions: [
    { code: 'crud:admin:list', name: '查看CRUD数据列表', description: '通用CRUD列表查询' },
    { code: 'crud:admin:read', name: '查看CRUD数据详情', description: '通用CRUD详情查询' },
    { code: 'crud:admin:create', name: '创建CRUD数据', description: '通用CRUD创建记录' },
    { code: 'crud:admin:update', name: '更新CRUD数据', description: '通用CRUD更新记录' },
    { code: 'crud:admin:delete', name: '删除CRUD数据', description: '通用CRUD删除记录' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
    'user': ['crud:admin:list', 'crud:admin:read'],
  },
  scopes: [
    { role: 'admin', table: 'crud_table', permission: 'crud:admin:update', rule: 'createBy = $auth.userId', description: '管理员只能更新自己的CRUD表' },
    { role: 'admin', table: 'crud_table', permission: 'crud:admin:delete', rule: 'createBy = $auth.userId', description: '管理员只能删除自己的CRUD表' },
    { role: 'user', table: 'crud_table', permission: 'crud:admin:list', rule: 'status = 1', description: '仅查看启用CRUD表' },
    { role: 'user', table: 'crud_table', permission: 'crud:admin:read', rule: 'status = 1', description: '仅查看启用CRUD表' },
  ],
  menus: [
    { name: 'CRUD管理', path: '/crud', icon: 'table', type: 1, sort: 9, redirect: '/crud/tables' },
    { name: '表配置', path: '/crud/tables', parent: '/crud', component: 'admin/crud/CrudTables', icon: 'setting', sort: 1, permCode: 'crud:admin:list' },
    { name: 'CRUD数据管理', path: '/crud/data', parent: '/crud', component: 'admin/crud/CrudData', icon: 'edit', sort: 2, permCode: 'crud:admin:list' },
  ],
})
