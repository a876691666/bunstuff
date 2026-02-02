import type { SeedDefinition } from '@/modules/seed/main/service'
import DictData from './index'

export const dictDataSeed: SeedDefinition = {
  name: 'dict-data-init',
  description: '初始化基础字典数据',
  async run() {
    const dataList = [
      // 用户性别
      { dictType: 'sys_user_sex', label: '男', value: '0', sort: 1, status: 1, isDefault: 1 },
      { dictType: 'sys_user_sex', label: '女', value: '1', sort: 2, status: 1, isDefault: 0 },
      { dictType: 'sys_user_sex', label: '未知', value: '2', sort: 3, status: 1, isDefault: 0 },
      // 系统开关
      {
        dictType: 'sys_normal_disable',
        label: '正常',
        value: '1',
        sort: 1,
        status: 1,
        isDefault: 1,
      },
      {
        dictType: 'sys_normal_disable',
        label: '停用',
        value: '0',
        sort: 2,
        status: 1,
        isDefault: 0,
      },
      // 系统是否
      { dictType: 'sys_yes_no', label: '是', value: '1', sort: 1, status: 1, isDefault: 1 },
      { dictType: 'sys_yes_no', label: '否', value: '0', sort: 2, status: 1, isDefault: 0 },
      // 通知类型
      { dictType: 'sys_notice_type', label: '通知', value: '1', sort: 1, status: 1, isDefault: 1 },
      { dictType: 'sys_notice_type', label: '公告', value: '2', sort: 2, status: 1, isDefault: 0 },
      // 通知状态
      {
        dictType: 'sys_notice_status',
        label: '正常',
        value: '1',
        sort: 1,
        status: 1,
        isDefault: 1,
      },
      {
        dictType: 'sys_notice_status',
        label: '关闭',
        value: '0',
        sort: 2,
        status: 1,
        isDefault: 0,
      },
    ]

    for (const data of dataList) {
      await DictData.create(data)
    }
  },
}
