/**
 * Template API Routes (Example implementation)
 * 
 * These endpoints would be implemented in your backend (Supabase Edge Functions, 
 * Express.js, or similar) to handle template CRUD operations.
 * 
 * For now, the useTemplates hook uses localStorage as fallback if API is unavailable.
 */

// GET /api/chart-templates
// Returns all available chart templates
export const GET_CHART_TEMPLATES = `
  SELECT id, name, description, chartType, category, defaultConfig
  FROM chart_templates
  WHERE public = true
  ORDER BY category, name
`;

// GET /api/slide-templates
// Returns user's saved slide templates
export const GET_SLIDE_TEMPLATES = `
  SELECT id, name, description, title, subtitle, blocks, createdAt, updatedAt
  FROM slide_templates
  WHERE userId = $1 OR public = true
  ORDER BY createdAt DESC
`;

// POST /api/slide-templates
// Save a new slide template
export const CREATE_SLIDE_TEMPLATE = `
  INSERT INTO slide_templates (userId, name, description, title, subtitle, blocks, createdAt, updatedAt, isPublic)
  VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), false)
  RETURNING *
`;

// DELETE /api/slide-templates/:templateId
// Delete a slide template (only owner can delete)
export const DELETE_SLIDE_TEMPLATE = `
  DELETE FROM slide_templates
  WHERE id = $1 AND userId = $2
  RETURNING id
`;

// ─── Database Schema ──────────────────────────────────────────

export const SCHEMA = `
-- Chart Templates (built-in, read-only)
CREATE TABLE IF NOT EXISTS chart_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  chartType TEXT NOT NULL,
  category TEXT,
  defaultConfig JSONB NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  public BOOLEAN DEFAULT true
);

-- Slide Templates (user-created or shared)
CREATE TABLE IF NOT EXISTS slide_templates (
  id TEXT PRIMARY KEY,
  userId TEXT,
  name TEXT NOT NULL,
  description TEXT,
  title TEXT,
  subtitle TEXT,
  blocks JSONB NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  isPublic BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_slide_templates_userId ON slide_templates(userId);
CREATE INDEX IF NOT EXISTS idx_slide_templates_createdAt ON slide_templates(createdAt DESC);
`;

// ─── Seed Data ──────────────────────────────────────────────

export const SEED_CHART_TEMPLATES = `
INSERT INTO chart_templates (id, name, description, chartType, category, defaultConfig) VALUES
  ('chart-sales-comparison', 'Sales Vergleich', 'Umsatzvergleich zwischen Perioden', 'bar', 'sales', '{...}'),
  ('chart-trend-line', 'Trend-Analyse', 'Entwicklung einer Kennzahl über Zeit', 'line', 'general', '{...}'),
  ('chart-market-share', 'Marktanteile', 'Verteilung nach Segmenten', 'pie', 'general', '{...}'),
  ('chart-distribution', 'Verteilung', 'Kreisdiagramm für Proportionen', 'donut', 'general', '{...}'),
  ('chart-area-trend', 'Liquiditäts-Trend', 'Kumulativer Trend mit Min/Max Bereich', 'area', 'financial', '{...}'),
  ('chart-waterfall', 'Waterfall / Brücke', 'Veränderungen und Zwischensummen', 'waterfall', 'financial', '{..}')
ON CONFLICT (id) DO NOTHING;
`;
