import type { SeedDefinition } from '@/services/seed'
import { model } from '@/core/model'

export const noticeSeed: SeedDefinition = {
  name: 'notice-init',
  description: '初始化示例通知公告',
  async run() {
    await model.notice.create({
      title: '欢迎使用系统',
      content: '欢迎使用RBAC管理系统，如有问题请联系管理员。',
      type: '1',
      status: 1,
      createBy: 1,
      remark: '系统初始化公告',
    })
  },
}
