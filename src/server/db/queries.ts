import { executeQuery } from "./pool.js";
import type {
  BlockTemplate,
  ColumnMetadata,
  QueryTemplate,
  SlideTemplate,
  TableMetadata,
  BerichtInfo,
} from "../../types/slide.js";

/**
 * Database query functions for Slide Templates
 * All queries are parameterized to prevent SQL injection
 */

// MSSQL-safe schema for slide templates
export async function ensureSchema(): Promise<void> {
  const createTablesSQL = `
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'slide_templates')
    BEGIN
      CREATE TABLE slide_templates (
        id NVARCHAR(128) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(2000),
        title NVARCHAR(500),
        subtitle NVARCHAR(1000),
        blocks NVARCHAR(MAX) NOT NULL,
        userId NVARCHAR(128),
        createdAt DATETIME2 DEFAULT GETUTCDATE(),
        updatedAt DATETIME2 DEFAULT GETUTCDATE(),
        isPublic BIT DEFAULT 0
      );
      CREATE NONCLUSTERED INDEX idx_slide_templates_userId ON slide_templates(userId);
      CREATE NONCLUSTERED INDEX idx_slide_templates_createdAt ON slide_templates(createdAt DESC);
    END

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'query_templates')
    BEGIN
      CREATE TABLE query_templates (
        id NVARCHAR(128) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(2000),
        queryConfig NVARCHAR(MAX) NOT NULL,
        userId NVARCHAR(128),
        createdAt DATETIME2 DEFAULT GETUTCDATE(),
        updatedAt DATETIME2 DEFAULT GETUTCDATE(),
        isPublic BIT DEFAULT 1
      );
      CREATE NONCLUSTERED INDEX idx_query_templates_createdAt ON query_templates(createdAt DESC);
    END

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'block_templates')
    BEGIN
      CREATE TABLE block_templates (
        id NVARCHAR(128) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(2000),
        blockType NVARCHAR(50) NOT NULL,
        blockConfig NVARCHAR(MAX) NOT NULL,
        queryConfig NVARCHAR(MAX),
        userId NVARCHAR(128),
        createdAt DATETIME2 DEFAULT GETUTCDATE(),
        updatedAt DATETIME2 DEFAULT GETUTCDATE(),
        isPublic BIT DEFAULT 1
      );
      CREATE NONCLUSTERED INDEX idx_block_templates_createdAt ON block_templates(createdAt DESC);
    END
  `;

  try {
    await executeQuery(createTablesSQL);
    console.log("[DB] Ensured schema for slide_templates");
  } catch (err) {
    console.error("[DB Schema] Error ensuring schema", err);
    throw err;
  }
}

function parseSlideTemplateRecord(record: SlideTemplate): SlideTemplate {
  return {
    ...record,
    blocks: typeof record.blocks === "string" ? JSON.parse(record.blocks) : record.blocks,
  };
}

function parseQueryTemplateRecord(
  record: QueryTemplate & { queryConfig: string | QueryTemplate["queryConfig"] }
): QueryTemplate {
  return {
    ...record,
    queryConfig:
      typeof record.queryConfig === "string"
        ? JSON.parse(record.queryConfig)
        : record.queryConfig,
  };
}

function parseBlockTemplateRecord(
  record: BlockTemplate & { block: BlockTemplate["block"] | string; blockConfig?: string; queryConfig?: string | BlockTemplate["queryConfig"] }
): BlockTemplate {
  const blockPayload = (record as { blockConfig?: string }).blockConfig ?? record.block;
  return {
    ...record,
    block: typeof blockPayload === "string" ? JSON.parse(blockPayload) : blockPayload,
    queryConfig:
      typeof record.queryConfig === "string"
        ? JSON.parse(record.queryConfig)
        : record.queryConfig,
  };
}

/**
 * Get all slide templates (public or by userId)
 */
export async function getSlideTemplates(userId?: string): Promise<SlideTemplate[]> {
  let query = "SELECT * FROM slide_templates WHERE isPublic = 1";
  const params: Record<string, any> = { public: true };

  if (userId) {
    query += " OR userId = @userId";
    params.userId = userId;
  }

  query += " ORDER BY createdAt DESC";

  const result = await executeQuery<SlideTemplate>(query, params);
  return result.recordset.map(parseSlideTemplateRecord);
}

/**
 * Get a single slide template by ID
 */
export async function getSlideTemplate(templateId: string): Promise<SlideTemplate | null> {
  const result = await executeQuery<SlideTemplate>(
    "SELECT * FROM slide_templates WHERE id = @id",
    { id: templateId }
  );

  return result.recordset[0] ? parseSlideTemplateRecord(result.recordset[0]) : null;
}

/**
 * Create a new slide template
 */
export async function createSlideTemplate(
  template: Omit<SlideTemplate, "createdAt">
): Promise<SlideTemplate> {
  const query = `
    INSERT INTO slide_templates (id, name, description, title, subtitle, blocks, userId, isPublic, createdAt, updatedAt)
    VALUES (@id, @name, @description, @title, @subtitle, @blocks, @userId, @isPublic, GETUTCDATE(), GETUTCDATE());
    SELECT * FROM slide_templates WHERE id = @id;
  `;

  const params = {
    id: template.id,
    name: template.name,
    description: template.description || null,
    title: template.title,
    subtitle: template.subtitle || null,
    blocks: JSON.stringify(template.blocks),
    userId: template.userId || null,
    isPublic: template.ispublic ? 1 : 0,
  };

  const result = await executeQuery<SlideTemplate>(query, params);
  const record = result.recordset[0];
  return record ? parseSlideTemplateRecord(record) : (template as SlideTemplate);
}

/**
 * Update a slide template
 */
export async function updateSlideTemplate(
  templateId: string,
  updates: Partial<SlideTemplate>
): Promise<SlideTemplate | null> {
  const setClauses = [];
  const params: Record<string, any> = { id: templateId };

  if (updates.name !== undefined) {
    setClauses.push("name = @name");
    params.name = updates.name;
  }
  if (updates.description !== undefined) {
    setClauses.push("description = @description");
    params.description = updates.description;
  }
  if (updates.title !== undefined) {
    setClauses.push("title = @title");
    params.title = updates.title;
  }
  if (updates.subtitle !== undefined) {
    setClauses.push("subtitle = @subtitle");
    params.subtitle = updates.subtitle;
  }
  if (updates.blocks !== undefined) {
    setClauses.push("blocks = @blocks");
    params.blocks = JSON.stringify(updates.blocks);
  }
  if (updates.ispublic !== undefined) {
    setClauses.push("isPublic = @isPublic");
    params.isPublic = updates.ispublic ? 1 : 0;
  }

  if (setClauses.length === 0) {
    return getSlideTemplate(templateId);
  }

  setClauses.push("updatedAt = GETUTCDATE()");

  const query = `
    UPDATE slide_templates
    SET ${setClauses.join(", ")}
    WHERE id = @id;
    SELECT * FROM slide_templates WHERE id = @id;
  `;

  const result = await executeQuery<SlideTemplate>(query, params);
  const record = result.recordset[0];
  return record ? parseSlideTemplateRecord(record) : null;
}

/**
 * Delete a slide template (owner check)
 */
export async function deleteSlideTemplate(
  templateId: string,
  userId?: string
): Promise<boolean> {
  let query = "DELETE FROM slide_templates WHERE id = @id";
  const params: Record<string, any> = { id: templateId };

  if (userId) {
    query += " AND userId = @userId";
    params.userId = userId;
  }

  const result = await executeQuery(query, params);
  return (result.rowsAffected?.[0] ?? 0) > 0;
}

export async function getQueryTemplates(): Promise<QueryTemplate[]> {
  const result = await executeQuery<QueryTemplate & { queryConfig: string }>(
    "SELECT * FROM query_templates WHERE isPublic = 1 ORDER BY createdAt DESC"
  );
  return result.recordset.map(parseQueryTemplateRecord);
}

export async function createQueryTemplate(template: QueryTemplate): Promise<QueryTemplate> {
  const query = `
    INSERT INTO query_templates (id, name, description, queryConfig, createdAt, updatedAt, isPublic)
    VALUES (@id, @name, @description, @queryConfig, GETUTCDATE(), GETUTCDATE(), @isPublic);
    SELECT * FROM query_templates WHERE id = @id;
  `;

  const result = await executeQuery<QueryTemplate & { queryConfig: string }>(query, {
    id: template.id,
    name: template.name,
    description: template.description || null,
    queryConfig: JSON.stringify(template.queryConfig),
    isPublic: template.isPublic === false ? 0 : 1,
  });

  return parseQueryTemplateRecord(result.recordset[0]);
}

export async function deleteQueryTemplate(templateId: string): Promise<boolean> {
  const result = await executeQuery("DELETE FROM query_templates WHERE id = @id", { id: templateId });
  return (result.rowsAffected?.[0] ?? 0) > 0;
}

export async function getBlockTemplates(): Promise<BlockTemplate[]> {
  const result = await executeQuery<
    BlockTemplate & { blockConfig: string; queryConfig?: string }
  >("SELECT * FROM block_templates WHERE isPublic = 1 ORDER BY createdAt DESC");
  return result.recordset.map(parseBlockTemplateRecord);
}

export async function createBlockTemplate(template: BlockTemplate): Promise<BlockTemplate> {
  const query = `
    INSERT INTO block_templates (id, name, description, blockType, blockConfig, queryConfig, createdAt, updatedAt, isPublic)
    VALUES (@id, @name, @description, @blockType, @blockConfig, @queryConfig, GETUTCDATE(), GETUTCDATE(), @isPublic);
    SELECT * FROM block_templates WHERE id = @id;
  `;

  const result = await executeQuery<
    BlockTemplate & { blockConfig: string; queryConfig?: string }
  >(query, {
    id: template.id,
    name: template.name,
    description: template.description || null,
    blockType: template.blockType,
    blockConfig: JSON.stringify(template.block),
    queryConfig: template.queryConfig ? JSON.stringify(template.queryConfig) : null,
    isPublic: template.isPublic === false ? 0 : 1,
  });

  return parseBlockTemplateRecord(result.recordset[0]);
}

export async function deleteBlockTemplate(templateId: string): Promise<boolean> {
  const result = await executeQuery("DELETE FROM block_templates WHERE id = @id", { id: templateId });
  return (result.rowsAffected?.[0] ?? 0) > 0;
}

export async function getTableMetadata(): Promise<TableMetadata[]> {
  const result = await executeQuery<{
    schemaName: string;
    tableName: string;
  }>(`
    SELECT TABLE_SCHEMA AS schemaName, TABLE_NAME AS tableName
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW')
      AND TABLE_SCHEMA NOT IN ('INFORMATION_SCHEMA', 'sys')
    ORDER BY TABLE_SCHEMA, TABLE_NAME
  `);

  return result.recordset.map((row) => ({
    schema: row.schemaName,
    name: row.tableName,
    fullName: `${row.schemaName}.${row.tableName}`,
  }));
}

export async function getColumnMetadata(fullTableName: string): Promise<ColumnMetadata[]> {
  const [schema = "dbo", table] = fullTableName.includes(".")
    ? fullTableName.split(".")
    : ["dbo", fullTableName];

  const result = await executeQuery<{
    columnName: string;
    dataType: string;
    isNullable: string;
  }>(
    `
      SELECT COLUMN_NAME AS columnName, DATA_TYPE AS dataType, IS_NULLABLE AS isNullable
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @tableName
      ORDER BY ORDINAL_POSITION
    `,
    {
      schemaName: schema,
      tableName: table,
    }
  );

  const numericTypes = new Set([
    "bigint",
    "decimal",
    "float",
    "int",
    "money",
    "numeric",
    "real",
    "smallint",
    "smallmoney",
    "tinyint",
  ]);

  return result.recordset.map((row) => ({
    name: row.columnName,
    sqlType: row.dataType,
    nullable: row.isNullable === "YES",
    isNumeric: numericTypes.has(row.dataType.toLowerCase()),
  }));
}

export async function getBerichte(): Promise<BerichtInfo[]> {
  const result = await executeQuery<BerichtInfo>(
    "SELECT Berichts_ID, Berichtsname FROM dbo.[9200] ORDER BY Berichtsname"
  );
  return result.recordset;
}
