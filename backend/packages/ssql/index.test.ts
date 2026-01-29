import { describe, expect, test } from "bun:test";
import {
  where,
  whereOr,
  parse,
  toMySQL,
  toPostgres,
  Builder,
} from "./index";

describe("Builder", () => {
  test("simple eq", () => {
    const [raw, sql, params] = where().eq("name", "test").toMySQL();
    expect(sql).toBe("`name` = ?");
    expect(params).toEqual(["test"]);
    expect(raw).toBe("`name` = 'test'");
  });

  test("multiple conditions with AND", () => {
    const [raw, sql, params] = where()
      .eq("status", 1)
      .gt("age", 18)
      .like("name", "张")
      .toMySQL();
    expect(sql).toBe("(`status` = ? AND `age` > ? AND `name` LIKE ?)");
    expect(params).toEqual([1, 18, "%张%"]);
    expect(raw).toBe("(`status` = 1 AND `age` > 18 AND `name` LIKE '%张%')");
  });

  test("OR conditions", () => {
    const [raw, sql, params] = whereOr().eq("a", 1).eq("b", 2).toMySQL();
    expect(sql).toBe("(`a` = ? OR `b` = ?)");
    expect(params).toEqual([1, 2]);
    expect(raw).toBe("(`a` = 1 OR `b` = 2)");
  });

  test("IN operator", () => {
    const [raw, sql, params] = where().in("id", [1, 2, 3]).toMySQL();
    expect(sql).toBe("`id` IN (?, ?, ?)");
    expect(params).toEqual([1, 2, 3]);
    expect(raw).toBe("`id` IN (1, 2, 3)");
  });

  test("NOT IN operator", () => {
    const [raw, sql, params] = where().notIn("status", ["a", "b"]).toMySQL();
    expect(sql).toBe("`status` NOT IN (?, ?)");
    expect(params).toEqual(["a", "b"]);
    expect(raw).toBe("`status` NOT IN ('a', 'b')");
  });

  test("BETWEEN operator", () => {
    const [raw, sql, params] = where().between("age", 18, 60).toMySQL();
    expect(sql).toBe("`age` BETWEEN ? AND ?");
    expect(params).toEqual([18, 60]);
    expect(raw).toBe("`age` BETWEEN 18 AND 60");
  });

  test("IS NULL / NOT NULL", () => {
    const [raw1, sql1] = where().isNull("deleted_at").toMySQL();
    expect(sql1).toBe("`deleted_at` IS NULL");
    expect(raw1).toBe("`deleted_at` IS NULL");

    const [raw2, sql2] = where().notNull("name").toMySQL();
    expect(sql2).toBe("`name` IS NOT NULL");
    expect(raw2).toBe("`name` IS NOT NULL");
  });

  test("nested group", () => {
    const [raw, sql, params] = where()
      .eq("status", 1)
      .group((b: Builder) => b.or().eq("type", "a").eq("type", "b"))
      .toMySQL();
    expect(sql).toBe("(`status` = ? AND ((`type` = ? OR `type` = ?)))");
    expect(params).toEqual([1, "a", "b"]);
    expect(raw).toBe("(`status` = 1 AND ((`type` = 'a' OR `type` = 'b')))");
  });

  test("toString", () => {
    const str = where().eq("name", "test").gt("age", 18).toString();
    expect(str).toBe("(name = 'test' && age > 18)");
  });

  test("PostgreSQL dialect", () => {
    const [raw, sql, params] = where().eq("a", 1).eq("b", 2).toPostgres();
    expect(sql).toBe(`("a" = $1 AND "b" = $2)`);
    expect(params).toEqual([1, 2]);
    expect(raw).toBe(`("a" = 1 AND "b" = 2)`);
  });

  test("empty builder", () => {
    const [raw, sql, params] = where().toMySQL();
    expect(sql).toBe("");
    expect(params).toEqual([]);
    expect(raw).toBe("");
  });

  test("boolean values", () => {
    const [raw, sql, params] = where().eq("active", true).eq("deleted", false).toMySQL();
    expect(sql).toBe("(`active` = ? AND `deleted` = ?)");
    expect(params).toEqual([true, false]);
    expect(raw).toBe("(`active` = TRUE AND `deleted` = FALSE)");
  });

  test("null value", () => {
    const [raw, sql, params] = where().eq("data", null).toMySQL();
    expect(sql).toBe("`data` = ?");
    expect(params).toEqual([null]);
    expect(raw).toBe("`data` = NULL");
  });

  test("SQLite boolean as integer", () => {
    const [raw] = where().eq("active", true).toSQLite();
    expect(raw).toBe(`"active" = 1`);
  });
});

describe("Parser", () => {
  test("parse simple eq", () => {
    const [raw, sql, params] = toMySQL("name = 'test'");
    expect(sql).toBe("`name` = ?");
    expect(params).toEqual(["test"]);
    expect(raw).toBe("`name` = 'test'");
  });

  test("parse multiple AND", () => {
    const [raw, sql, params] = toMySQL("status = 1 && age > 18");
    expect(sql).toBe("(`status` = ? AND `age` > ?)");
    expect(params).toEqual([1, 18]);
    expect(raw).toBe("(`status` = 1 AND `age` > 18)");
  });

  test("parse OR", () => {
    const [raw, sql, params] = toMySQL("a = 1 || b = 2");
    expect(sql).toBe("(`a` = ? OR `b` = ?)");
    expect(params).toEqual([1, 2]);
    expect(raw).toBe("(`a` = 1 OR `b` = 2)");
  });

  test("parse IN", () => {
    const [raw, sql, params] = toMySQL("id ?= [1, 2, 3]");
    expect(sql).toBe("`id` IN (?, ?, ?)");
    expect(params).toEqual([1, 2, 3]);
    expect(raw).toBe("`id` IN (1, 2, 3)");
  });

  test("parse BETWEEN", () => {
    const [raw, sql, params] = toMySQL("age >< [18, 60]");
    expect(sql).toBe("`age` BETWEEN ? AND ?");
    expect(params).toEqual([18, 60]);
    expect(raw).toBe("`age` BETWEEN 18 AND 60");
  });

  test("parse IS NULL", () => {
    const [raw, sql] = toMySQL("deleted_at ?null");
    expect(sql).toBe("`deleted_at` IS NULL");
    expect(raw).toBe("`deleted_at` IS NULL");
  });

  test("parse NOT NULL", () => {
    const [raw, sql] = toMySQL("name ?!null");
    expect(sql).toBe("`name` IS NOT NULL");
    expect(raw).toBe("`name` IS NOT NULL");
  });

  test("parse LIKE", () => {
    const [raw, sql, params] = toMySQL("name ~ '张'");
    expect(sql).toBe("`name` LIKE ?");
    expect(params).toEqual(["%张%"]);
    expect(raw).toBe("`name` LIKE '%张%'");
  });

  test("parse grouped expression", () => {
    const [raw, sql, params] = toMySQL("status = 1 && (type = 'a' || type = 'b')");
    expect(sql).toBe("(`status` = ? AND ((`type` = ? OR `type` = ?)))");
    expect(params).toEqual([1, "a", "b"]);
    expect(raw).toBe("(`status` = 1 AND ((`type` = 'a' OR `type` = 'b')))");
  });

  test("parse boolean values", () => {
    const [raw, sql, params] = toMySQL("active = true && deleted = false");
    expect(sql).toBe("(`active` = ? AND `deleted` = ?)");
    expect(params).toEqual([true, false]);
    expect(raw).toBe("(`active` = TRUE AND `deleted` = FALSE)");
  });

  test("parse null value", () => {
    const [raw, sql, params] = toMySQL("data = null");
    expect(sql).toBe("`data` = ?");
    expect(params).toEqual([null]);
    expect(raw).toBe("`data` = NULL");
  });

  test("parse numbers", () => {
    const [raw, sql, params] = toMySQL("price >= 99.9 && count < -5");
    expect(sql).toBe("(`price` >= ? AND `count` < ?)");
    expect(params).toEqual([99.9, -5]);
    expect(raw).toBe("(`price` >= 99.9 AND `count` < -5)");
  });

  test("parse with PostgreSQL", () => {
    const [raw, sql, params] = toPostgres("a = 1 && b = 2 && c ?= [3, 4]");
    expect(sql).toBe(`("a" = $1 AND "b" = $2 AND "c" IN ($3, $4))`);
    expect(params).toEqual([1, 2, 3, 4]);
    expect(raw).toBe(`("a" = 1 AND "b" = 2 AND "c" IN (3, 4))`);
  });

  test("empty string", () => {
    const [raw, sql, params] = toMySQL("");
    expect(sql).toBe("");
    expect(params).toEqual([]);
    expect(raw).toBe("");
  });

  test("parse expression toString roundtrip", () => {
    const expr = parse("name = 'test' && age > 18");
    expect(expr?.toString()).toBe("(name = 'test' && age > 18)");
  });

  test("escape special characters in MySQL", () => {
    const [raw] = toMySQL("name = 'test\\'s value'");
    expect(raw).toBe("`name` = 'test\\'s value'");
  });
});

describe("Dialect assemble", () => {
  test("MySQL assemble", () => {
    const [raw] = where()
      .eq("name", "O'Brien")
      .eq("status", 1)
      .toMySQL();
    expect(raw).toBe("(`name` = 'O\\'Brien' AND `status` = 1)");
  });

  test("PostgreSQL assemble", () => {
    const [raw] = where()
      .eq("name", "O'Brien")
      .eq("status", 1)
      .toPostgres();
    expect(raw).toBe(`("name" = 'O''Brien' AND "status" = 1)`);
  });
});
