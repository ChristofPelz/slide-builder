import { useState, useCallback } from "react";
import type {
  BlockTemplate,
  ChartTemplate,
  QueryTemplate,
  SlideTemplate,
} from "../types/slide";
import { CHART_TEMPLATES } from "../data/chartTemplates";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T> | T;
  if (typeof payload === "object" && payload !== null && "success" in payload) {
    if (!payload.success) {
      throw new Error(payload.error ?? "API request failed");
    }
    return payload.data;
  }

  return payload as T;
}

/**
 * Hook for managing templates (chart templates + slide templates)
 * - Loads built-in chart templates immediately
 * - Fetches user-saved slide templates from API
 * - Provides functions to save/delete slide templates
 */
export function useTemplates() {
  // Built-in chart templates
  const [chartTemplates] = useState<ChartTemplate[]>(CHART_TEMPLATES);

  // User-saved slide templates
  const [slideTemplates, setSlideTemplates] = useState<SlideTemplate[]>([]);
  const [queryTemplates, setQueryTemplates] = useState<QueryTemplate[]>([]);
  const [blockTemplates, setBlockTemplates] = useState<BlockTemplate[]>([]);
  const [isLoadingSlideTemplates, setIsLoadingSlideTemplates] =
    useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all slide templates for current user
   */
  const fetchSlideTemplates = useCallback(async () => {
    setIsLoadingSlideTemplates(true);
    setError(null);
    try {
      // TODO: Replace with actual API endpoint when backend is ready
      // For now, return empty array (templates will be saved with localStorage fallback)
      const response = await fetch("/api/slide-templates");
      if (response.ok) {
        const data = await parseApiResponse<SlideTemplate[]>(response);
        setSlideTemplates(data);
      } else {
        // Fallback: try localStorage
        const stored = localStorage.getItem("slide-templates");
        if (stored) {
          setSlideTemplates(JSON.parse(stored));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch slide templates, using localStorage", err);
      // Fallback to localStorage
      const stored = localStorage.getItem("slide-templates");
      if (stored) {
        setSlideTemplates(JSON.parse(stored));
      }
      setError(`${err}`);
    } finally {
      setIsLoadingSlideTemplates(false);
    }
  }, []);

  /**
   * Save a new slide template
   */
  const saveSlideTemplate = useCallback(
    async (template: SlideTemplate) => {
      try {
        // Try API first
        const response = await fetch("/api/slide-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(template),
        });

        if (response.ok) {
          const saved = await parseApiResponse<SlideTemplate>(response);
          setSlideTemplates((prev) => [...prev, saved]);
          return saved;
        } else {
          // Fallback: save to localStorage
          const stored = localStorage.getItem("slide-templates");
          const existing = stored ? JSON.parse(stored) : [];
          const updated = [...existing, template];
          localStorage.setItem("slide-templates", JSON.stringify(updated));
          setSlideTemplates(updated);
          return template;
        }
      } catch (err) {
        console.warn("Failed to save to API, using localStorage", err);
        // Save to localStorage as fallback
        const stored = localStorage.getItem("slide-templates");
        const existing = stored ? JSON.parse(stored) : [];
        const updated = [...existing, template];
        localStorage.setItem("slide-templates", JSON.stringify(updated));
        setSlideTemplates(updated);
        return template;
      }
    },
    []
  );

  const fetchQueryTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/query-templates");
      if (response.ok) {
        const data = await parseApiResponse<QueryTemplate[]>(response);
        setQueryTemplates(data);
        return;
      }

      const stored = localStorage.getItem("query-templates");
      if (stored) {
        setQueryTemplates(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Failed to fetch query templates, using localStorage", err);
      const stored = localStorage.getItem("query-templates");
      if (stored) {
        setQueryTemplates(JSON.parse(stored));
      }
    }
  }, []);

  const saveQueryTemplate = useCallback(async (template: QueryTemplate) => {
    try {
      const response = await fetch("/api/query-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        const saved = await parseApiResponse<QueryTemplate>(response);
        setQueryTemplates((prev) => [saved, ...prev.filter((entry) => entry.id !== saved.id)]);
        return saved;
      }
    } catch (err) {
      console.warn("Failed to save query template, using localStorage", err);
    }

    const stored = localStorage.getItem("query-templates");
    const existing = stored ? (JSON.parse(stored) as QueryTemplate[]) : [];
    const updated = [template, ...existing.filter((entry) => entry.id !== template.id)];
    localStorage.setItem("query-templates", JSON.stringify(updated));
    setQueryTemplates(updated);
    return template;
  }, []);

  const fetchBlockTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/block-templates");
      if (response.ok) {
        const data = await parseApiResponse<BlockTemplate[]>(response);
        setBlockTemplates(data);
        return;
      }

      const stored = localStorage.getItem("block-templates");
      if (stored) {
        setBlockTemplates(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Failed to fetch block templates, using localStorage", err);
      const stored = localStorage.getItem("block-templates");
      if (stored) {
        setBlockTemplates(JSON.parse(stored));
      }
    }
  }, []);

  const saveBlockTemplate = useCallback(async (template: BlockTemplate) => {
    try {
      const response = await fetch("/api/block-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        const saved = await parseApiResponse<BlockTemplate>(response);
        setBlockTemplates((prev) => [saved, ...prev.filter((entry) => entry.id !== saved.id)]);
        return saved;
      }
    } catch (err) {
      console.warn("Failed to save block template, using localStorage", err);
    }

    const stored = localStorage.getItem("block-templates");
    const existing = stored ? (JSON.parse(stored) as BlockTemplate[]) : [];
    const updated = [template, ...existing.filter((entry) => entry.id !== template.id)];
    localStorage.setItem("block-templates", JSON.stringify(updated));
    setBlockTemplates(updated);
    return template;
  }, []);

  /**
   * Delete a slide template
   */
  const deleteSlideTemplate = useCallback(
    async (templateId: string) => {
      try {
        // Try API first
        const response = await fetch(`/api/slide-templates/${templateId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setSlideTemplates((prev) =>
            prev.filter((t) => t.id !== templateId)
          );
        } else {
          // Fallback: remove from localStorage
          const stored = localStorage.getItem("slide-templates");
          if (stored) {
            const existing = JSON.parse(stored);
            const updated = existing.filter(
              (t: SlideTemplate) => t.id !== templateId
            );
            localStorage.setItem("slide-templates", JSON.stringify(updated));
            setSlideTemplates(updated);
          }
        }
      } catch (err) {
        console.warn("Failed to delete from API, using localStorage", err);
        // Remove from localStorage
        const stored = localStorage.getItem("slide-templates");
        if (stored) {
          const existing = JSON.parse(stored);
          const updated = existing.filter(
            (t: SlideTemplate) => t.id !== templateId
          );
          localStorage.setItem("slide-templates", JSON.stringify(updated));
          setSlideTemplates(updated);
        }
      }
    },
    []
  );

  return {
    chartTemplates,
    slideTemplates,
    queryTemplates,
    blockTemplates,
    isLoadingSlideTemplates,
    error,
    saveSlideTemplate,
    saveQueryTemplate,
    saveBlockTemplate,
    deleteSlideTemplate,
    refetchSlideTemplates: fetchSlideTemplates,
    refetchQueryTemplates: fetchQueryTemplates,
    refetchBlockTemplates: fetchBlockTemplates,
  };
}
