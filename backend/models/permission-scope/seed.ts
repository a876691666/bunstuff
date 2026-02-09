import type { SeedDefinition } from '@/modules/seed'
import { where } from '@pkg/ssql'
import PermissionScope from './index'
import Permission from '../permission'

/** 数据过滤规则 Seed */
export const permissionScopeSeed: SeedDefinition = {
  name: 'permission-scope-default',
  description: '初始化数据过滤规则示例数据',
  async run() {
    // 获取用户列表权限
    const userListPermission = await Permission.findOne({
      where: where().eq('code', 'user:admin:list'),
    })
    if (!userListPermission) {
      throw new Error('user:admin:list 权限不存在，请先执行 permission-default seed')
    }

    // 创建示例数据过滤规则
    // ssqlRule 使用 SSQL 语法 + Velocity 变量，可用变量:
    //   $auth.userId, $auth.roleId, $auth.username, $auth.session.*
    //   $req.method, $req.url, $req.headers.*, $req.params.*, $req.query.*, $req.body.*
    const scopes = [
      {
        permissionId: userListPermission.id,
        name: '只能查看自己创建的用户',
        tableName: 'users',
        ssqlRule: 'created_by = $auth.userId',
        description: '限制用户只能查看自己创建的用户数据',
      },
      {
        permissionId: userListPermission.id,
        name: '只能查看同角色用户',
        tableName: 'users',
        ssqlRule: 'roleId = $auth.roleId',
        description: '限制用户只能查看相同角色的用户数据',
      },
    ]

    for (const scope of scopes) {
      await PermissionScope.create(scope)
    }
    console.log(`✅ 已创建 ${scopes.length} 个数据过滤规则示例`)
  },
}

export default permissionScopeSeed
