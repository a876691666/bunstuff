import { Op, Logic, type Value, type Values, type SQLResult, type Dialect } from "./types";
import { FieldExpr, LogicExpr, GroupExpr, type Expression } from "./expression";
import { mysql, postgres, sqlite } from "./dialect";

// SQL 条件构建器
export class Builder {
  private readonly exprs: Expression[] = [];
  private logic: Logic = Logic.And;

  // 设置逻辑
  and(): this { this.logic = Logic.And; return this; }
  or(): this { this.logic = Logic.Or; return this; }

  // 比较操作
  eq(field: string, value?: Value): this { this.exprs.push(new FieldExpr(field, Op.Eq, value)); return this; }
  neq(field: string, value?: Value): this { this.exprs.push(new FieldExpr(field, Op.Neq, value)); return this; }
  gt(field: string, value?: Value): this { this.exprs.push(new FieldExpr(field, Op.Gt, value)); return this; }
  gte(field: string, value?: Value): this { this.exprs.push(new FieldExpr(field, Op.Gte, value)); return this; }
  lt(field: string, value?: Value): this { this.exprs.push(new FieldExpr(field, Op.Lt, value)); return this; }
  lte(field: string, value?: Value): this { this.exprs.push(new FieldExpr(field, Op.Lte, value)); return this; }

  // 模糊匹配
  like(field: string, value: string): this { this.exprs.push(new FieldExpr(field, Op.Like, value)); return this; }
  notLike(field: string, value: string): this { this.exprs.push(new FieldExpr(field, Op.NotLike, value)); return this; }

  // 集合操作
  in(field: string, values: Values): this { this.exprs.push(new FieldExpr(field, Op.In, values)); return this; }
  notIn(field: string, values: Values): this { this.exprs.push(new FieldExpr(field, Op.NotIn, values)); return this; }

  // 空值检查
  isNull(field: string): this { this.exprs.push(new FieldExpr(field, Op.IsNull)); return this; }
  notNull(field: string): this { this.exprs.push(new FieldExpr(field, Op.NotNull)); return this; }

  // 范围
  between(field: string, start: Value, end: Value): this {
    this.exprs.push(new FieldExpr(field, Op.Between, [start, end]));
    return this;
  }

  // 分组
  group(fn: (b: Builder) => void): this {
    const sub = new Builder();
    fn(sub);
    const expr = sub.build();
    if (expr) this.exprs.push(new GroupExpr(expr));
    return this;
  }

  // 添加表达式
  expr(e: Expression | null | undefined): this {
    if (e) this.exprs.push(e);
    return this;
  }

  // 构建
  build(): Expression | null {
    const len = this.exprs.length;
    if (len === 0) return null;
    if (len === 1) return this.exprs[0]!;
    return new LogicExpr(this.logic, this.exprs);
  }

  toString(): string {
    return this.build()?.toString() ?? "";
  }

  // 通用 SQL
  toSQL(dialect: Dialect = mysql): SQLResult {
    return this.build()?.toSQL(dialect) ?? ["", "", []];
  }

  // 生成 WHERE 子句 SQL（已转义，无参数占位符）
  toWhereSQL(dialect: Dialect = mysql): string {
    const [raw] = this.toSQL(dialect);
    return raw;
  }

  // 特定数据库
  toMySQL(): SQLResult { return this.toSQL(mysql); }
  toPostgres(): SQLResult { return this.toSQL(postgres); }
  toSQLite(): SQLResult { return this.toSQL(sqlite); }

  // 检查是否为空
  isEmpty(): boolean {
    return this.exprs.length === 0;
  }
}

// 快捷函数
export const where = () => new Builder().and();
export const whereOr = () => new Builder().or();
