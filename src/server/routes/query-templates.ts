import { Router, type Request, type Response } from "express";
import {
  createBlockTemplate,
  createQueryTemplate,
  deleteBlockTemplate,
  deleteQueryTemplate,
  getBlockTemplates,
  getQueryTemplates,
} from "../db/queries.js";
import type { BlockTemplate, QueryTemplate } from "../../types/slide.js";

const router = Router();

router.get("/query-templates", async (_req: Request, res: Response) => {
  try {
    const templates = await getQueryTemplates();
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch query templates",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

router.post("/query-templates", async (req: Request, res: Response) => {
  try {
    const template = req.body as QueryTemplate;
    if (!template.id || !template.name || !template.queryConfig) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: id, name, queryConfig",
      });
    }

    const created = await createQueryTemplate(template);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to create query template",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

router.delete("/query-templates/:id", async (req: Request, res: Response) => {
  try {
    const templateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await deleteQueryTemplate(templateId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Query template not found" });
    }
    res.json({ success: true, data: { id: templateId } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to delete query template",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

router.get("/block-templates", async (_req: Request, res: Response) => {
  try {
    const templates = await getBlockTemplates();
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch block templates",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

router.post("/block-templates", async (req: Request, res: Response) => {
  try {
    const template = req.body as BlockTemplate;
    if (!template.id || !template.name || !template.block || !template.blockType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: id, name, blockType, block",
      });
    }

    const created = await createBlockTemplate(template);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to create block template",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

router.delete("/block-templates/:id", async (req: Request, res: Response) => {
  try {
    const templateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await deleteBlockTemplate(templateId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Block template not found" });
    }
    res.json({ success: true, data: { id: templateId } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to delete block template",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;