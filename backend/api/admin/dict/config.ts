import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'dict',
  name: '管理 - 字典',
  description: '字典类型和数据管理接口',
  permissions: [
    { code: 'dict:admin:type:list', name: '查看字典类型列表', description: '获取字典类型列表' },
    { code: 'dict:admin:type:read', name: '查看字典类型详情', description: '获取字典类型详情' },
    { code: 'dict:admin:type:create', name: '创建字典类型', description: '创建字典类型' },
    { code: 'dict:admin:type:update', name: '更新字典类型', description: '更新字典类型' },
    { code: 'dict:admin:type:delete', name: '删除字典类型', description: '删除字典类型' },
    { code: 'dict:admin:data:list', name: '查看字典数据列表', description: '获取字典数据列表' },
    { code: 'dict:admin:data:read', name: '查看字典数据详情', description: '获取字典数据详情' },
    { code: 'dict:admin:data:create', name: '创建字典数据', description: '创建字典数据项' },
    { code: 'dict:admin:data:update', name: '更新字典数据', description: '更新字典数据项' },
    { code: 'dict:admin:data:delete', name: '删除字典数据', description: '删除字典数据项' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
  },
  menus: [
    { name: '系统管理', path: '/system', icon: 'setting', type: 1, sort: 1 },
    { name: '字典类型', path: '/system/dict-types', parent: '/system', component: 'admin/system/DictTypes', icon: 'dict', sort: 6, permCode: 'dict:admin:type:list' },
    { name: '字典数据', path: '/system/dict-data', parent: '/system', component: 'admin/system/DictData', icon: 'dict', sort: 7, permCode: 'dict:admin:data:list' },
  ],
})
