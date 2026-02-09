import { describe, test, expect } from 'bun:test'
import { column } from './index'
import type { SchemaDefinition, InferRow, InsertData, UpdateData } from './types'

// ============ Schema 定义测试 ============

describe('Column Definition - 链式调用', () => {
  test('column.string() - 字符串列', () => {
    const col = column.string()
    expect(col._type).toBe('string')
    expect(col._nullable).toBe(false)
    expect(col._config.type).toBe('string')
  })

  test('column.number() - 数字列', () => {
    const col = column.number()
    expect(col._type).toBe('number')
    expect(col._nullable).toBe(false)
  })

  test('column.boolean() - 布尔列', () => {
    const col = column.boolean()
    expect(col._type).toBe('boolean')
  })

  test('column.date() - 日期列', () => {
    const col = column.date()
    expect(col._type).toBe('date')
  })

  test('column.blob() - 二进制列', () => {
    const col = column.blob()
    expect(col._type).toBe('blob')
  })

  test('.nullable() - 可空列', () => {
    const col = column.string().nullable()
    expect(col._nullable).toBe(true)
    expect(col._config.nullable).toBe(true)
  })

  test('.primaryKey() - 主键', () => {
    const col = column.number().primaryKey()
    expect(col._config.primaryKey).toBe(true)
  })

  test('.autoIncrement() - 自增', () => {
    const col = column.number().autoIncrement()
    expect(col._config.autoIncrement).toBe(true)
  })

  test('.unique() - 唯一约束', () => {
    const col = column.string().unique()
    expect(col._config.unique).toBe(true)
  })

  test('.default() - 默认值', () => {
    const col = column.boolean().default(true)
    expect(col._config.default).toBe(true)
  })

  test('链式调用组合', () => {
    const col = column.number().primaryKey().autoIncrement()
    expect(col._config.primaryKey).toBe(true)
    expect(col._config.autoIncrement).toBe(true)
  })

  test('复杂链式调用', () => {
    const col = column.string().nullable().unique().default('test')
    expect(col._nullable).toBe(true)
    expect(col._config.nullable).toBe(true)
    expect(col._config.unique).toBe(true)
    expect(col._config.default).toBe('test')
  })
})

// ============ 类型推断测试 ============

describe('Type Inference', () => {
  // 定义测试 Schema - 使用链式调用
  const userSchema = {
    id: column.number().primaryKey().autoIncrement(),
    name: column.string(),
    email: column.string().nullable(),
    age: column.number().nullable(),
    active: column.boolean().default(true),
    score: column.number(),
  } satisfies SchemaDefinition

  test('InferRow - 行类型推断', () => {
    type UserRow = InferRow<typeof userSchema>

    // 类型断言测试 - 如果类型不正确会编译失败
    const user: UserRow = {
      id: 1,
      name: '张三',
      email: 'test@example.com', // 可以是 string
      age: null, // 可以是 null
      active: true,
      score: 100,
    }

    expect(user.id).toBe(1)
    expect(user.name).toBe('张三')
    expect(user.email).toBe('test@example.com')
    expect(user.age).toBeNull()
    expect(user.active).toBe(true)
    expect(user.score).toBe(100)
  })

  test('InferRow - nullable 字段可以为 null', () => {
    type UserRow = InferRow<typeof userSchema>

    const user: UserRow = {
      id: 1,
      name: '测试',
      email: null, // email 是 nullable
      age: null, // age 是 nullable
      active: false,
      score: 0,
    }

    expect(user.email).toBeNull()
    expect(user.age).toBeNull()
  })

  test('InsertData - 插入数据类型', () => {
    type UserInsert = InsertData<typeof userSchema>

    // id 是可选的（autoIncrement）
    // active 是可选的（有默认值）
    const insert: UserInsert = {
      name: '新用户',
      score: 50,
    }

    expect(insert.name).toBe('新用户')
    expect(insert.score).toBe(50)
    expect((insert as any).id).toBeUndefined() // id 没有提供
  })

  test('InsertData - 可以提供可选字段', () => {
    type UserInsert = InsertData<typeof userSchema>

    const insert: UserInsert = {
      id: 100, // 可以手动指定 id
      name: '用户',
      email: 'user@test.com',
      age: 25,
      active: false, // 覆盖默认值
      score: 80,
    }

    expect(insert.id).toBe(100)
    expect(insert.active).toBe(false)
  })

  test('UpdateData - 更新数据类型', () => {
    type UserUpdate = UpdateData<typeof userSchema>

    // 所有字段都是可选的
    const update: UserUpdate = {
      name: '新名字',
    }

    expect(update.name).toBe('新名字')
    expect((update as any).id).toBeUndefined()
  })

  test('UpdateData - 可以更新多个字段', () => {
    type UserUpdate = UpdateData<typeof userSchema>

    const update: UserUpdate = {
      name: '更新名字',
      email: 'new@email.com',
      age: 30,
      active: true,
    }

    expect(update.name).toBe('更新名字')
    expect(update.email).toBe('new@email.com')
    expect(update.age).toBe(30)
    expect(update.active).toBe(true)
  })
})

// ============ 复杂 Schema 测试 ============

describe('Complex Schema', () => {
  test('完整的用户表 Schema - 链式调用', () => {
    const userSchema = {
      id: column.number().primaryKey().autoIncrement(),
      username: column.string().unique(),
      email: column.string().nullable().unique(),
      passwordHash: column.string(),
      avatar: column.string().nullable(),
      role: column.string().default('user'),
      score: column.number().default(0),
      isActive: column.boolean().default(true),
      createdAt: column.date(),
      updatedAt: column.date().nullable(),
      deletedAt: column.date().nullable(),
    } satisfies SchemaDefinition

    type UserRow = InferRow<typeof userSchema>
    type UserInsert = InsertData<typeof userSchema>

    // 插入时只需要必填字段
    const insert: UserInsert = {
      username: 'testuser',
      passwordHash: 'hash123',
      createdAt: new Date(),
    }

    expect(insert.username).toBe('testuser')

    // 完整的行数据
    const row: UserRow = {
      id: 1,
      username: 'testuser',
      email: null,
      passwordHash: 'hash123',
      avatar: null,
      role: 'user',
      score: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    }

    expect(row.id).toBe(1)
    expect(row.email).toBeNull()
    expect(row.role).toBe('user')
  })

  test('订单表 Schema - 链式调用', () => {
    const orderSchema = {
      id: column.number().primaryKey().autoIncrement(),
      userId: column.number(),
      orderNo: column.string().unique(),
      totalAmount: column.number(),
      status: column.string().default('pending'),
      paidAt: column.date().nullable(),
      createdAt: column.date().default(() => new Date()),
    } satisfies SchemaDefinition

    type OrderInsert = InsertData<typeof orderSchema>

    const insert: OrderInsert = {
      userId: 1,
      orderNo: 'ORD-001',
      totalAmount: 99.99,
    }

    expect(insert.userId).toBe(1)
    expect(insert.orderNo).toBe('ORD-001')
    expect(insert.totalAmount).toBe(99.99)
    // status 和 createdAt 有默认值，可以不提供
  })
})

// ============ 边界情况测试 ============

describe('Edge Cases', () => {
  test('空 Schema', () => {
    const emptySchema = {} satisfies SchemaDefinition
    type EmptyRow = InferRow<typeof emptySchema>

    const row: EmptyRow = {}
    expect(Object.keys(row)).toHaveLength(0)
  })

  test('只有一个字段的 Schema', () => {
    const singleSchema = {
      value: column.string(),
    } satisfies SchemaDefinition

    type SingleRow = InferRow<typeof singleSchema>
    const row: SingleRow = { value: 'test' }
    expect(row.value).toBe('test')
  })

  test('所有字段都 nullable 的 Schema', () => {
    const allNullableSchema = {
      a: column.string().nullable(),
      b: column.number().nullable(),
      c: column.boolean().nullable(),
    } satisfies SchemaDefinition

    type Row = InferRow<typeof allNullableSchema>
    const row: Row = { a: null, b: null, c: null }

    expect(row.a).toBeNull()
    expect(row.b).toBeNull()
    expect(row.c).toBeNull()
  })

  test('所有字段都有默认值的 Schema', () => {
    const allDefaultSchema = {
      a: column.string().default('default'),
      b: column.number().default(0),
      c: column.boolean().default(false),
    } satisfies SchemaDefinition

    type Insert = InsertData<typeof allDefaultSchema>

    // 所有字段都是可选的
    const insert: Insert = {}
    expect(Object.keys(insert)).toHaveLength(0)
  })
})
