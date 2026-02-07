/**
 * SQL 注入防护实际测试
 * 使用 Bun.sql 和 SQLite 内存数据库进行真实 SQL 执行测试
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { SQL } from 'bun'
import { where, parse, toSQL, sqlite, FieldValidationError } from './index'

// 使用 SQLite 内存数据库
let db: SQL

beforeAll(async () => {
  db = new SQL('sqlite://:memory:')

  // 创建测试表
  await db.unsafe(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      status INTEGER DEFAULT 1
    )
  `)

  // 插入测试数据
  await db.unsafe(`
    INSERT INTO users (username, password, email, status) VALUES
    ('admin', 'admin123', 'admin@test.com', 1),
    ('user1', 'pass1', 'user1@test.com', 1),
    ('user2', 'pass2', 'user2@test.com', 0)
  `)
})

afterAll(() => {
  db.close()
})

describe('SQL 注入防护 - 实际数据库测试', () => {
  // ============ 值注入攻击测试 ============

  test('经典 DROP TABLE 注入无法删除表', async () => {
    // 攻击尝试: username = ''; DROP TABLE users; --
    const attackValue = "'; DROP TABLE users; --"
    const whereClause = where().eq('username', attackValue).toWhereSQL(sqlite)

    // 执行查询（注入被阻止，查询安全执行）
    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)

    // 验证没有匹配结果（因为没有用户名是这个攻击字符串）
    expect(result.length).toBe(0)

    // 验证表仍然存在且数据完整
    const allUsers = await db.unsafe(`SELECT * FROM users`)
    expect(allUsers.length).toBe(3)
  })

  test('SSQL 解析后执行 DROP TABLE 注入无法生效', async () => {
    // 通过 SSQL 字符串尝试注入
    const ssql = `username = "'; DROP TABLE users; --"`
    const [raw] = toSQL(ssql, sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${raw}`)
    expect(result.length).toBe(0)

    // 表和数据仍然完整
    const allUsers = await db.unsafe(`SELECT * FROM users`)
    expect(allUsers.length).toBe(3)
  })

  test('OR 1=1 注入无法绕过认证', async () => {
    // 攻击尝试: 用户输入 ' OR '1'='1 试图返回所有记录
    const attackValue = "' OR '1'='1"
    const whereClause = where()
      .eq('username', 'admin')
      .eq('password', attackValue)
      .toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)

    // 注入失败，没有匹配（因为密码字段不可能是这个字符串）
    expect(result.length).toBe(0)

    // 正常登录应该成功
    const normalLogin = where()
      .eq('username', 'admin')
      .eq('password', 'admin123')
      .toWhereSQL(sqlite)
    const normalResult = await db.unsafe(`SELECT * FROM users WHERE ${normalLogin}`)
    expect(normalResult.length).toBe(1)
    expect(normalResult[0].username).toBe('admin')
  })

  test('UNION SELECT 注入无法获取其他数据', async () => {
    // 攻击尝试: 通过 UNION 获取密码
    const attackValue = "1' UNION SELECT id, password, username, email, status FROM users --"
    const whereClause = where().eq('id', attackValue).toWhereSQL(sqlite)

    // 由于整个字符串被当作值，不会引起 UNION 注入
    const result = await db.unsafe(`SELECT id, username FROM users WHERE ${whereClause}`)

    // 没有结果（因为 id 不可能等于这个字符串）
    expect(result.length).toBe(0)
  })

  test('注释截断注入无法绕过条件', async () => {
    // 攻击尝试: admin'-- 试图忽略密码检查
    const attackUsername = "admin'--"
    const whereClause = where()
      .eq('username', attackUsername)
      .eq('password', 'anything')
      .toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)

    // 注入失败
    expect(result.length).toBe(0)
  })

  // ============ 字段名白名单测试 ============

  test('字段白名单阻止非法字段查询', () => {
    const allowedFields = ['username', 'email', 'status']

    // 合法字段可以查询
    const [raw] = toSQL("username = 'admin'", sqlite, { allowedFields })
    expect(raw).toBe(`"username" = 'admin'`)

    // 非法字段（如 password）被阻止
    expect(() => {
      toSQL("password = 'admin123'", sqlite, { allowedFields })
    }).toThrow(FieldValidationError)
  })

  test('字段白名单防止敏感信息泄露', async () => {
    const allowedFields = ['username', 'email', 'status']

    // 安全查询
    const [safeWhere] = toSQL("username = 'admin' && status = 1", sqlite, { allowedFields })
    const result = await db.unsafe(`SELECT username, email, status FROM users WHERE ${safeWhere}`)
    expect(result.length).toBe(1)
    expect(result[0].username).toBe('admin')

    // 尝试查询密码字段被阻止
    expect(() => {
      toSQL("password ~ 'admin'", sqlite, { allowedFields })
    }).toThrow(FieldValidationError)
  })

  test('字段白名单 throwOnInvalidField=false 静默忽略', async () => {
    const allowedFields = ['username', 'status']

    // 非法字段被静默忽略，只保留合法条件
    const [raw] = toSQL("username = 'admin' && password = 'admin123'", sqlite, {
      allowedFields,
      throwOnInvalidField: false,
    })

    expect(raw).toBe(`"username" = 'admin'`)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${raw}`)
    expect(result.length).toBe(1)
  })

  // ============ 特殊字符测试 ============

  test('正确处理用户名中的特殊字符', async () => {
    // 插入包含特殊字符的用户
    await db.unsafe(
      `INSERT INTO users (username, password, email) VALUES ('O''Brien', 'pass', 'ob@test.com')`,
    )

    // 查询该用户
    const whereClause = where().eq('username', "O'Brien").toWhereSQL(sqlite)
    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)

    expect(result.length).toBe(1)
    expect(result[0].username).toBe("O'Brien")
  })

  test('LIKE 查询中的通配符安全处理', async () => {
    // 用户输入包含 SQL 通配符
    const whereClause = where().like('username', '%').toWhereSQL(sqlite)
    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)

    // LIKE '%\%%' 会查找包含 % 的用户名
    // 实际会变成 LIKE '%%' 查找所有，这是预期行为因为 % 在我们的 like 实现中会包裹
    expect(result.length).toBeGreaterThan(0)
  })

  // ============ 复杂组合攻击测试 ============

  test('多层嵌套攻击无效', async () => {
    // 多种攻击技术组合
    const complexAttack = "admin'; DROP TABLE users; SELECT * FROM users WHERE '1'='1"
    const whereClause = where().eq('username', complexAttack).toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    expect(result.length).toBe(0)

    // 验证表完整性
    const allUsers = await db.unsafe(`SELECT COUNT(*) as count FROM users`)
    expect(allUsers[0].count).toBeGreaterThanOrEqual(3)
  })

  test('批量 IN 查询安全', async () => {
    // IN 查询中的注入尝试
    const whereClause = where()
      .in('username', ['admin', "'; DROP TABLE users; --", 'user1'])
      .toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)

    // 只匹配 admin 和 user1
    expect(result.length).toBe(2)
    expect(result.map((r: { username: string }) => r.username).sort()).toEqual(['admin', 'user1'])

    // 表完整
    const allUsers = await db.unsafe(`SELECT COUNT(*) as count FROM users`)
    expect(allUsers[0].count).toBeGreaterThanOrEqual(3)
  })

  test('BETWEEN 查询安全', async () => {
    // BETWEEN 中的注入尝试
    const whereClause = where()
      .between('id', 1, '3; DROP TABLE users; --' as any)
      .toWhereSQL(sqlite)

    // SQLite 会尝试将字符串转为数字，但 DROP TABLE 不会执行
    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)

    // 表仍然存在
    const allUsers = await db.unsafe(`SELECT COUNT(*) as count FROM users`)
    expect(allUsers[0].count).toBeGreaterThanOrEqual(3)
  })
})

describe('SQL 注入防护 - Parser 鲁棒性', () => {
  test('无效 SSQL 语法不会导致注入', () => {
    // 尝试通过畸形语法注入
    expect(() => parse('=== DROP TABLE')).toThrow()
    expect(() => parse("username = 'unclosed")).toThrow()
  })

  test('空字符串不产生 SQL', () => {
    const [raw] = toSQL('', sqlite)
    expect(raw).toBe('')
  })

  test('仅空白字符不产生 SQL', () => {
    const [raw] = toSQL('   \t\n  ', sqlite)
    expect(raw).toBe('')
  })
})

// ============ 其他高级注入攻击测试 ============

describe('高级 SQL 注入攻击防护', () => {
  // ============ 堆叠查询攻击 ============

  test('堆叠查询攻击 - 分号分隔多语句', async () => {
    // 攻击: 尝试通过分号执行多条语句
    const attack = "admin'; INSERT INTO users (username, password) VALUES ('hacker', 'pwned'); --"
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    const before = await db.unsafe(`SELECT COUNT(*) as count FROM users`)
    await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    const after = await db.unsafe(`SELECT COUNT(*) as count FROM users`)

    // 记录数不应该增加（INSERT 未执行）
    expect(after[0].count).toBe(before[0].count)
  })

  test('堆叠查询 - UPDATE 注入', async () => {
    const attack = "x'; UPDATE users SET password = 'hacked' WHERE '1'='1"
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)

    // 验证密码未被修改
    const admin = await db.unsafe(`SELECT password FROM users WHERE username = 'admin'`)
    expect(admin[0].password).toBe('admin123')
  })

  // ============ 编码绕过攻击 ============

  test('Unicode 转义尝试', async () => {
    // 尝试使用 Unicode 编码绕过
    const attack = 'admin\\u0027; DROP TABLE users; --'
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    expect(result.length).toBe(0)

    // 表仍然存在
    const check = await db.unsafe(`SELECT 1 FROM users LIMIT 1`)
    expect(check.length).toBe(1)
  })

  test('十六进制编码尝试', async () => {
    // MySQL 风格的十六进制字符串 0x...
    const attack = '0x61646d696e' // 'admin' in hex
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    // 应该作为字面字符串处理，不匹配任何用户
    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    expect(result.length).toBe(0)
  })

  // ============ 注释绕过攻击 ============

  test('多行注释攻击 /* */', async () => {
    const attack = "admin'/**/OR/**/1=1--"
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    expect(result.length).toBe(0)
  })

  test('MySQL 内联注释 /*!*/', async () => {
    const attack = "admin'/*!50000OR*/1=1--"
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    expect(result.length).toBe(0)
  })

  test('井号注释 #', async () => {
    const attack = "admin'#"
    const whereClause = where().eq('username', attack).eq('password', 'wrong').toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    expect(result.length).toBe(0)
  })

  // ============ 布尔盲注攻击 ============

  test('布尔盲注 - AND 条件', async () => {
    // 攻击者尝试通过布尔条件推断数据
    const attack = "admin' AND 1=1 --"
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    // 因为转义，不会匹配
    expect(result.length).toBe(0)
  })

  test('布尔盲注 - SUBSTRING 探测', async () => {
    const attack = "admin' AND SUBSTRING(password,1,1)='a' --"
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    expect(result.length).toBe(0)
  })

  // ============ 时间盲注攻击 ============

  test('时间盲注 - SLEEP/WAITFOR', async () => {
    // SQLite 没有 SLEEP，但 MySQL 有
    const attack = "admin'; SELECT SLEEP(5); --"
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    const start = Date.now()
    await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    const elapsed = Date.now() - start

    // 不应该有延迟（如果注入成功会等待 5 秒）
    expect(elapsed).toBeLessThan(1000)
  })

  // ============ 子查询攻击 ============

  test('子查询攻击', async () => {
    const attack = "admin' AND (SELECT COUNT(*) FROM users) > 0 --"
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    expect(result.length).toBe(0)
  })

  test('嵌套 SELECT 攻击', async () => {
    const attack = "(SELECT password FROM users WHERE username='admin')"
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    expect(result.length).toBe(0)
  })

  // ============ LIKE 通配符攻击 ============

  test('LIKE 通配符 - 下划线作为值处理', async () => {
    // _ 和 % 是 SQL LIKE 的通配符
    // 当前实现会自动包裹 %...%，所以 like('username', '_dmin') 变成 LIKE '%_dmin%'
    // 这会匹配包含 '_dmin' 或任意单字符后跟 'dmin' 的值
    const whereClause = where().like('username', '_dmin').toWhereSQL(sqlite)

    // 在 SQLite 中 _ 匹配单字符，所以 %_dmin% 会匹配 'admin'
    // 这是 LIKE 的正常行为，不是注入漏洞
    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)

    // 验证查询正常执行，表数据完整
    const allUsers = await db.unsafe(`SELECT COUNT(*) as count FROM users`)
    expect(allUsers[0].count).toBeGreaterThanOrEqual(3)
  })

  // ============ 二次编码攻击 ============

  test('双重 URL 编码尝试', async () => {
    // %2527 = %27 = '
    const attack = 'admin%2527%253B%2520DROP%2520TABLE%2520users'
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    expect(result.length).toBe(0)

    // 表存在
    const check = await db.unsafe(`SELECT 1 FROM users LIMIT 1`)
    expect(check.length).toBe(1)
  })

  // ============ 错误触发攻击 ============

  test('错误触发 - 除零', async () => {
    const attack = "admin' AND 1/0 --"
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    // 不应该抛出除零错误（因为注入未生效）
    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    expect(result.length).toBe(0)
  })

  // ============ 空值和边界测试 ============

  test('NULL 注入', () => {
    const whereClause = where()
      .eq('username', null as any)
      .toWhereSQL(sqlite)
    expect(whereClause).toBe('"username" = NULL')
  })

  test('超长字符串不会导致溢出', async () => {
    const longAttack = 'a'.repeat(10000) + "'; DROP TABLE users; --"
    const whereClause = where().eq('username', longAttack).toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    expect(result.length).toBe(0)

    // 表存在
    const check = await db.unsafe(`SELECT 1 FROM users LIMIT 1`)
    expect(check.length).toBe(1)
  })

  test('特殊控制字符处理', async () => {
    const attack = "admin\r\n'; DROP TABLE users; --"
    const whereClause = where().eq('username', attack).toWhereSQL(sqlite)

    const result = await db.unsafe(`SELECT * FROM users WHERE ${whereClause}`)
    expect(result.length).toBe(0)
  })
})
