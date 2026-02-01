import { SQL } from "bun";
import type { SchemaDefinition, ModelConfig } from "./types";
import { 
  generateTempTableName, 
  columnToSql, 
  columnTypeToSql,
  sqlTypeToColumnType, 
  getTypeConversionExpr,
  parseTableColumns,
  type TableColumnInfo 
} from "./utils";
import { getDialectFromConnection, type Dialect } from "@pkg/ssql";
import { Model } from "./model";

/** 同步表选项 */
export interface SyncTableOptions {
  /** 是否在转换类型时保留数据（默认 true） */
  preserveData?: boolean;
}

/**
 * 同步表结构（内部实现）
 */
async function syncTableInternal<S extends SchemaDefinition>(
  db: SQL,
  dialect: Dialect,
  tableName: string,
  schema: S,
  options: SyncTableOptions = {}
): Promise<void> {
  const { preserveData = true } = options;

  // 检查表是否存在
  const existsResult = await db.unsafe(dialect.tableExistsSql(tableName));
  const exists = existsResult.length > 0;

  if (!exists) {
    // 表不存在，直接创建
    const columnDefs = Object.entries(schema).map(([name, column]) =>
      columnToSql(dialect, name, column)
    );
    await db.unsafe(dialect.createTableSql(tableName, columnDefs));
    return;
  }

  // 表存在，检查并同步结构
  const columnsResult = await db.unsafe(dialect.tableColumnsSql(tableName));
  const existingColumns = parseTableColumns(dialect.name, columnsResult);
  const existingColumnMap = new Map(existingColumns.map((c) => [c.name, c]));

  // 检查是否需要修改表结构
  let needsRebuild = false;
  const schemaEntries = Object.entries(schema);

  // 检查列变化
  for (const [name, column] of schemaEntries) {
    const existing = existingColumnMap.get(name);
    if (!existing) {
      needsRebuild = true;
      break;
    }

    const expectedType = columnTypeToSql(dialect.name, column._config.type);
    const existingType = existing.type.toUpperCase();

    if (expectedType.toUpperCase() !== existingType) {
      needsRebuild = true;
      break;
    }

    const expectedNotNull = !column._config.nullable && !column._config.primaryKey;
    if (existing.notnull !== expectedNotNull) {
      needsRebuild = true;
      break;
    }
  }

  // 检查是否有被删除的列
  for (const existing of existingColumns) {
    if (!schema[existing.name]) {
      needsRebuild = true;
      break;
    }
  }

  if (!needsRebuild) {
    return;
  }

  // 需要重建表（SQLite）或使用 ALTER（MySQL/PostgreSQL）
  // TODO: 对于 MySQL/PostgreSQL 实现 ALTER COLUMN 逻辑
  // 目前先使用重建表的方式

  // 重建表方式
  const tempTableName = generateTempTableName(tableName);

  // 1. 创建临时表
  const columnDefs = schemaEntries.map(([name, column]) => columnToSql(dialect, name, column));
  await db.unsafe(dialect.createTableSql(tempTableName, columnDefs));

  if (preserveData) {
    // 2. 复制数据，进行类型转换
    const commonColumns: string[] = [];
    const selectExprs: string[] = [];

    for (const [name, column] of schemaEntries) {
      const existing = existingColumnMap.get(name);
      if (existing) {
        commonColumns.push(dialect.quote(name));
        const existingColType = sqlTypeToColumnType(existing.type);
        const newColType = column._config.type;
        selectExprs.push(getTypeConversionExpr(dialect, name, existingColType, newColType));
      }
    }

    if (commonColumns.length > 0) {
      const insertSql = `INSERT INTO ${dialect.quote(tempTableName)} (${commonColumns.join(", ")}) SELECT ${selectExprs.join(", ")} FROM ${dialect.quote(tableName)}`;
      await db.unsafe(insertSql);
    }
  }

  // 3. 删除旧表
  await db.unsafe(dialect.dropTableSql(tableName));

  // 4. 重命名临时表
  await db.unsafe(dialect.renameTableSql(tempTableName, tableName));
}

export class DB {
  public sql: SQL;
  public dialect: Dialect;

  constructor(connectionString: string | URL) {
    this.sql = new SQL(connectionString);
    this.dialect = getDialectFromConnection(connectionString);
  }

  /**
   * 同步表结构
   * @param tableName 表名
   * @param schema 表结构定义
   * @param options 选项
   */
  async syncTable<S extends SchemaDefinition>(
    tableName: string,
    schema: S,
    options: SyncTableOptions = {}
  ): Promise<void> {
    return syncTableInternal(this.sql, this.dialect, tableName, schema, options);
  }

  /**
   * 创建 Model 实例
   * @param config Model 配置（schema 参数为 Schema 类）
   */
  async model<S extends SchemaDefinition>(config: ModelConfig<S>): Promise<Model<S>> {
    // 从 Schema 类获取定义
    const schemaDefinition = config.schema.getDefinition() as S;
    await this.syncTable(config.tableName, schemaDefinition);
    return new Model(this.sql, this.dialect, {
      ...config,
      schema: schemaDefinition,
    });
  }
}
