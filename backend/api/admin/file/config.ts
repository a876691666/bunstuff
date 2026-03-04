import { defineConfig } from '@/core/policy'

export default defineConfig({
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
  },
  scopes: [
    { role: 'admin', table: 'sys_file', permission: 'file:admin:delete', rule: 'uploadBy = $auth.userId', description: '管理员只能删除自己的文件' },
  ],
  menus: [
    { name: '文件管理', path: '/file', icon: 'file', type: 1, sort: 5, redirect: '/file/list' },
    { name: '文件列表', path: '/file/list', parent: '/file', component: 'admin/file/Files', icon: 'folder', sort: 1, permCode: 'file:admin:list' },
  ],
})
