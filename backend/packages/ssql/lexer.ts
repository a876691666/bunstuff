import { TokenType, type Token } from './types'

// 词法分析器
export class Lexer {
  private readonly input: string
  private readonly len: number
  private pos = 0

  constructor(input: string) {
    this.input = input
    this.len = input.length
  }

  tokenize(): Token[] {
    const tokens: Token[] = []

    while (this.pos < this.len) {
      this.skipWhitespace()
      if (this.pos >= this.len) break
      tokens.push(this.nextToken())
    }

    tokens.push({ type: TokenType.EOF, value: '', pos: this.pos })
    return tokens
  }

  private char(): string {
    return this.input[this.pos] ?? ''
  }

  private peek(offset = 1): string {
    return this.input[this.pos + offset] ?? ''
  }

  private advance(): string {
    return this.input[this.pos++] ?? ''
  }

  private skipWhitespace(): void {
    while (this.pos < this.len) {
      const c = this.char()
      if (c !== ' ' && c !== '\t' && c !== '\n' && c !== '\r') break
      this.pos++
    }
  }

  private nextToken(): Token {
    const p = this.pos
    const c = this.char()

    // 单字符 token
    switch (c) {
      case '(':
        this.pos++
        return { type: TokenType.LParen, value: '(', pos: p }
      case ')':
        this.pos++
        return { type: TokenType.RParen, value: ')', pos: p }
      case '[':
        this.pos++
        return { type: TokenType.LBracket, value: '[', pos: p }
      case ']':
        this.pos++
        return { type: TokenType.RBracket, value: ']', pos: p }
      case ',':
        this.pos++
        return { type: TokenType.Comma, value: ',', pos: p }
    }

    // && ||
    if (c === '&' && this.peek() === '&') {
      this.pos += 2
      return { type: TokenType.And, value: '&&', pos: p }
    }
    if (c === '|' && this.peek() === '|') {
      this.pos += 2
      return { type: TokenType.Or, value: '||', pos: p }
    }

    // 字符串
    if (c === "'" || c === '"') return this.readString()

    // 操作符
    if ('=!><~?'.includes(c)) return this.readOperator()

    // 数字
    if (this.isDigit(c) || (c === '-' && this.isDigit(this.peek()))) return this.readNumber()

    // 标识符
    if (this.isLetter(c) || c === '_') return this.readIdentifier()

    throw new Error(`意外字符 '${c}' 位置 ${p}`)
  }

  private readString(): Token {
    const p = this.pos
    const quote = this.advance()
    let value = ''

    while (this.pos < this.len && this.char() !== quote) {
      if (this.char() === '\\') {
        this.pos++
        const esc = this.char()
        value += esc === 'n' ? '\n' : esc === 't' ? '\t' : esc === 'r' ? '\r' : esc
      } else {
        value += this.char()
      }
      this.pos++
    }

    if (this.pos >= this.len) throw new Error(`未闭合的字符串 位置 ${p}`)
    this.pos++
    return { type: TokenType.Value, value, pos: p }
  }

  private readOperator(): Token {
    const p = this.pos
    let op = this.advance()

    switch (op) {
      case '!':
        if (this.char() === '=' || this.char() === '~') op += this.advance()
        break
      case '>':
        if (this.char() === '=' || this.char() === '<') op += this.advance()
        break
      case '<':
        if (this.char() === '=') op += this.advance()
        break
      case '=':
        if (this.char() === '=') this.advance() // == 当作 =
        break
      case '?':
        if (this.char() === '=') {
          op += this.advance()
        } else if (this.char() === '!') {
          op += this.advance()
          if (this.char() === '=') {
            op += this.advance()
          } else {
            while (this.pos < this.len && this.isLetter(this.char())) op += this.advance()
          }
        } else {
          while (this.pos < this.len && this.isLetter(this.char())) op += this.advance()
        }
        break
    }

    return { type: TokenType.Op, value: op, pos: p }
  }

  private readNumber(): Token {
    const p = this.pos
    let value = this.advance()

    while (this.pos < this.len && this.isDigit(this.char())) value += this.advance()

    if (this.char() === '.' && this.isDigit(this.peek())) {
      value += this.advance()
      while (this.pos < this.len && this.isDigit(this.char())) value += this.advance()
    }

    return { type: TokenType.Value, value, pos: p }
  }

  private readIdentifier(): Token {
    const p = this.pos
    let value = ''

    while (this.pos < this.len && this.isIdent(this.char())) value += this.advance()

    const lower = value.toLowerCase()
    if (lower === 'true' || lower === 'false' || lower === 'null') {
      return { type: TokenType.Value, value, pos: p }
    }

    return { type: TokenType.Field, value, pos: p }
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9'
  }

  private isLetter(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
  }

  private isIdent(c: string): boolean {
    return this.isLetter(c) || this.isDigit(c) || c === '_' || c === '.'
  }
}

export function tokenize(input: string): Token[] {
  return new Lexer(input).tokenize()
}
