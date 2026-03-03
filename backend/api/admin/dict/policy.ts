import { definePolicy } from '@/core/policy'

export default definePolicy({
  module: 'dict',
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
    'user': [
      'dict:admin:type:list', 'dict:admin:type:read',
      'dict:admin:data:list', 'dict:admin:data:read',
    ],
  },
  scopes: [
    { role: 'user', table: 'dict_type', permission: 'dict:admin:type:list', rule: 'status = 1', description: '仅查看启用字典类型' },
    { role: 'user', table: 'dict_type', permission: 'dict:admin:type:read', rule: 'status = 1', description: '仅查看启用字典类型' },
    { role: 'user', table: 'dict_data', permission: 'dict:admin:data:list', rule: 'status = 1', description: '仅查看启用字典数据' },
    { role: 'user', table: 'dict_data', permission: 'dict:admin:data:read', rule: 'status = 1', description: '仅查看启用字典数据' },
  ],
})
