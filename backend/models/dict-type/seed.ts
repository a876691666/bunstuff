import type { SeedDefinition } from '@/modules/seed/main/service'
import DictType from './index'

export const dictTypeSeed: SeedDefinition = {
  name: 'dict-type-init',
  description: '初始化基础字典类型',
  async run() {
    const types = [
      { name: '用户性别', type: 'sys_user_sex', status: 1, remark: '用户性别列表' },
      { name: '系统开关', type: 'sys_normal_disable', status: 1, remark: '系统开关列表' },
      { name: '系统是否', type: 'sys_yes_no', status: 1, remark: '系统是否列表' },
      { name: '通知类型', type: 'sys_notice_type', status: 1, remark: '通知类型列表' },
      { name: '通知状态', type: 'sys_notice_status', status: 1, remark: '通知状态列表' },
    ]

    for (const type of types) {
      await DictType.create(type)
    }
  },
}
