import { definePolicy } from '@/core/policy'

export default definePolicy({
  module: 'file',
  permissions: [
    { code: 'file:admin:list', name: '查看文件列表', description: '获取文件列表' },
    { code: 'file:admin:read', name: '查看文件详情', description: '获取文件详情' },
    { code: 'file:admin:upload', name: '上传文件', description: '上传新文件' },
    { code: 'file:admin:delete', name: '删除文件', description: '删除上传的文件' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
    'user': ['file:admin:list', 'file:admin:read'],
  },
  scopes: [
    { role: 'admin', table: 'sys_file', permission: 'file:admin:delete', rule: 'uploadBy = $auth.userId', description: '管理员只能删除自己的文件' },
    { role: 'user', table: 'sys_file', permission: 'file:admin:list', rule: 'uploadBy = $auth.userId', description: '仅查看本人文件' },
    { role: 'user', table: 'sys_file', permission: 'file:admin:read', rule: 'uploadBy = $auth.userId', description: '仅查看本人文件' },
  ],
})
