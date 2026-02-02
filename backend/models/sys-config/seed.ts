import type { SeedDefinition } from '@/modules/seed/main/service'
import SysConfig from './index'

export const sysConfigSeed: SeedDefinition = {
  name: 'sys-config-init',
  description: '初始化系统参数配置',
  async run() {
    const configs = [
      {
        name: '系统名称',
        key: 'sys.name',
        value: 'RBAC管理系统',
        isBuiltin: 1,
        remark: '系统名称',
      },
      { name: '系统版本', key: 'sys.version', value: '1.0.0', isBuiltin: 1, remark: '系统版本号' },
      {
        name: '用户初始密码',
        key: 'sys.user.initPassword',
        value: '123456',
        isBuiltin: 1,
        remark: '用户初始密码',
      },
      {
        name: '验证码开关',
        key: 'sys.captcha.enabled',
        value: 'true',
        isBuiltin: 1,
        remark: '是否启用验证码',
      },
      {
        name: '文件上传路径',
        key: 'sys.file.uploadPath',
        value: './uploads',
        isBuiltin: 1,
        remark: '本地文件上传路径',
      },
    ]

    for (const config of configs) {
      await SysConfig.create(config)
    }
  },
}
