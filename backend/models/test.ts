import { where } from '../packages/ssql'
import { model } from '../core/model'

const Role = model.role

// 或使用 SSQL 字符串
Role.findMany({
  where: where().eq('name', 'tester'),
}).then((ress) => {
  console.log(ress)
})
