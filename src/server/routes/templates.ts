import { Router, type Request, type Response } from "express";
import {
  getSlideTemplates,
  getSlideTemplate,
  createSlideTemplate,
  updateSlideTemplate,
  deleteSlideTemplate,
} from "../db/queries.js";
import type { SlideTemplate } from "../../types/slide.js";

const router = Router();

/**
 * GET /api/slide-templates
 * Returns all public slide templates and user's private templates
 * Query params: userId (optional)
 */
router.get("/slide-templates", async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || undefined;
    const templates = await getSlideTemplates(userId);

    // Parse blocks if they're stored as JSON strings
    const parsed = templates.map((t) => ({
      ...t,
      blocks: typeof t.blocks === "string" ? JSON.parse(t.blocks) : t.blocks,
    }));

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error("[Route] GET /api/slide-templates error", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch slide templates",
      details: (err instanceof Error ? err.message : String(err)),
    });
  }
});

/**
 * GET /api/slide-templates/:id
 * Returns a single slide template by ID
 */
router.get("/slide-templates/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const template = await getSlideTemplate(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Slide template not found",
      });
    }

    // Parse blocks if stored as JSON string
    if (typeof template.blocks === "string") {
      template.blocks = JSON.parse(template.blocks);
    }

    res.json({ success: true, data: template });
  } catch (err) {
    console.error("[Route] GET /api/slide-templates/:id error", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch slide template",
      details: (err instanceof Error ? err.message : String(err)),
    });
  }
});

/**
 * POST /api/slide-templates
 * Create a new slide template
 * Body: SlideTemplate (without createdAt)
 */
router.post("/slide-templates", async (req: Request, res: Response) => {
  try {
    const template = req.body as Omit<SlideTemplate, "createdAt">;

    // Validate required fields
    if (!template.id || !template.title) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: id, title",
      });
    }

    const created = await createSlideTemplate(template);

    // Parse blocks if stored as JSON string
    if (typeof created.blocks === "string") {
      created.blocks = JSON.parse(created.blocks);
    }

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error("[Route] POST /api/slide-templates error", err);
    res.status(500).json({
      success: false,
      error: "Failed to create slide template",
      details: (err instanceof Error ? err.message : String(err)),
    });
  }
});

/**
 * PUT /api/slide-templates/:id
 * Update a slide template
 * Body: Partial<SlideTemplate>
 */
router.put("/slide-templates/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updates = req.body as Partial<SlideTemplate>;

    const updated = await updateSlideTemplate(id, updates);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Slide template not found",
      });
    }

    // Parse blocks if stored as JSON string
    if (typeof updated.blocks === "string") {
      updated.blocks = JSON.parse(updated.blocks);
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("[Route] PUT /api/slide-templates/:id error", err);
    res.status(500).json({
      success: false,
      error: "Failed to update slide template",
      details: (err instanceof Error ? err.message : String(err)),
    });
  }
});

/**
 * DELETE /api/slide-templates/:id
 * Delete a slide template
 * Query params: userId (optional, for ownership check)
 */
router.delete("/slide-templates/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = (req.query.userId as string) || undefined;

    const deleted = await deleteSlideTemplate(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Slide template not found or not authorized to delete",
      });
    }

    res.json({ success: true, data: { id } });
  } catch (err) {
    console.error("[Route] DELETE /api/slide-templates/:id error", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete slide template",
      details: (err instanceof Error ? err.message : String(err)),
    });
  }
});

export default router;
