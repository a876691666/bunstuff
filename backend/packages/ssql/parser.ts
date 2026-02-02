import { Op, Logic, TokenType, type Token, type Value, type Values } from './types'
import { FieldExpr, LogicExpr, GroupExpr, type Expression } from './expression'
import { tokenize } from './lexer'

// 语法分析器
export class Parser {
  private readonly tokens: Token[]
  private pos = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  parse(): Expression | null {
    return this.parseOr()
  }

  private cur(): Token {
    return this.tokens[this.pos] ?? { type: TokenType.EOF, value: '', pos: 0 }
  }

  private adv(): Token {
    return this.tokens[this.pos++] ?? { type: TokenType.EOF, value: '', pos: 0 }
  }

  private parseOr(): Expression | null {
    let left = this.parseAnd()

    while (this.cur().type === TokenType.Or) {
      this.adv()
      const right = this.parseAnd()
      if (!right) throw new Error('|| 后缺少表达式')

      if (left instanceof LogicExpr && left.logic === Logic.Or) {
        left = new LogicExpr(Logic.Or, [...left.exprs, right])
      } else if (left) {
        left = new LogicExpr(Logic.Or, [left, right])
      } else {
        left = right
      }
    }

    return left
  }

  private parseAnd(): Expression | null {
    let left = this.parsePrimary()

    while (this.cur().type === TokenType.And) {
      this.adv()
      const right = this.parsePrimary()
      if (!right) throw new Error('&& 后缺少表达式')

      if (left instanceof LogicExpr && left.logic === Logic.And) {
        left = new LogicExpr(Logic.And, [...left.exprs, right])
      } else if (left) {
        left = new LogicExpr(Logic.And, [left, right])
      } else {
        left = right
      }
    }

    return left
  }

  private parsePrimary(): Expression | null {
    const t = this.cur()

    switch (t.type) {
      case TokenType.LParen:
        return this.parseGroup()
      case TokenType.Field:
        return this.parseField()
      case TokenType.EOF:
        return null
      default:
        throw new Error(`意外的 token '${t.value}' 位置 ${t.pos}`)
    }
  }

  private parseGroup(): Expression | null {
    this.adv() // (
    const inner = this.parseOr()
    if (this.cur().type !== TokenType.RParen) throw new Error('缺少 )')
    this.adv()
    return inner ? new GroupExpr(inner) : null
  }

  private parseField(): FieldExpr {
    const field = this.adv().value
    const opTok = this.cur()
    if (opTok.type !== TokenType.Op) throw new Error(`字段 '${field}' 后缺少操作符`)
    this.adv()

    const op = this.strToOp(opTok.value)

    if (op === Op.IsNull || op === Op.NotNull) {
      return new FieldExpr(field, op)
    }

    if (op === Op.In || op === Op.NotIn || op === Op.Between) {
      return new FieldExpr(field, op, this.parseArray())
    }

    const valTok = this.cur()
    if (valTok.type !== TokenType.Value) throw new Error(`缺少值 位置 ${valTok.pos}`)
    this.adv()

    return new FieldExpr(field, op, this.convertVal(valTok.value))
  }

  private parseArray(): Values {
    if (this.cur().type !== TokenType.LBracket) throw new Error('数组需要 [')
    this.adv()

    const vals: Values = []

    while (this.cur().type !== TokenType.RBracket && this.cur().type !== TokenType.EOF) {
      if (this.cur().type === TokenType.Value) {
        vals.push(this.convertVal(this.cur().value))
        this.adv()
      }
      if (this.cur().type === TokenType.Comma) this.adv()
    }

    if (this.cur().type !== TokenType.RBracket) throw new Error('数组缺少 ]')
    this.adv()

    return vals
  }

  private strToOp(s: string): Op {
    switch (s) {
      case '=':
        return Op.Eq
      case '!=':
        return Op.Neq
      case '>':
        return Op.Gt
      case '>=':
        return Op.Gte
      case '<':
        return Op.Lt
      case '<=':
        return Op.Lte
      case '~':
        return Op.Like
      case '!~':
        return Op.NotLike
      case '?=':
        return Op.In
      case '?!=':
        return Op.NotIn
      case '?null':
        return Op.IsNull
      case '?!null':
        return Op.NotNull
      case '><':
        return Op.Between
      default:
        return Op.Eq
    }
  }

  private convertVal(s: string): Value {
    const low = s.toLowerCase()
    if (low === 'true') return true
    if (low === 'false') return false
    if (low === 'null') return null
    const n = Number(s)
    return Number.isNaN(n) ? s : n
  }
}

// 解析 SSQL 字符串
export function parse(input: string): Expression | null {
  const s = input.trim()
  if (!s) return null
  return new Parser(tokenize(s)).parse()
}
