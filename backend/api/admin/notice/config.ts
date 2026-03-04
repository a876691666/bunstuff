import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'notice',
  name: '管理 - 通知公告',
  description: '通知公告管理接口',
  permissions: [
    { code: 'notice:admin:list', name: '查看通知列表', description: '获取通知列表' },
    { code: 'notice:admin:read', name: '查看通知详情', description: '获取通知详情' },
    { code: 'notice:admin:create', name: '创建通知', description: '创建新通知' },
    { code: 'notice:admin:update', name: '更新通知', description: '更新通知内容' },
    { code: 'notice:admin:delete', name: '删除通知', description: '删除通知' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
  },
  scopes: [
    { role: 'admin', table: 'notice', permission: 'notice:admin:update', rule: 'createBy = $auth.userId', description: '管理员只能修改自己的通知' },
    { role: 'admin', table: 'notice', permission: 'notice:admin:delete', rule: 'createBy = $auth.userId', description: '管理员只能删除自己的通知' },
  ],
  menus: [
    { name: '通知公告', path: '/notice', icon: 'notice', type: 1, sort: 4, redirect: '/notice/list' },
    { name: '公告管理', path: '/notice/list', parent: '/notice', component: 'admin/notice/Notices', icon: 'message', sort: 1, permCode: 'notice:admin:list' },
  ],
})
