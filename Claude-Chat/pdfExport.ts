// server/pdfExport.ts
// Run in Node.js on the server (Supabase Edge Function or Express endpoint)
// POST /api/export-pdf  { html: string, filename: string }

import { chromium } from "playwright";

export interface ExportOptions {
  html: string;
  filename?: string;
  slideCount: number;
  slideWidth?: number;   // default 1280
  slideHeight?: number;  // default 720
}

export async function exportPresentationToPDF(
  opts: ExportOptions
): Promise<Buffer> {
  const {
    html,
    slideWidth = 1280,
    slideHeight = 720,
    slideCount,
  } = opts;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport to exactly one slide
  await page.setViewportSize({ width: slideWidth, height: slideHeight });

  // Load HTML (either URL or raw HTML string)
  if (html.startsWith("http")) {
    await page.goto(html, { waitUntil: "networkidle" });
  } else {
    await page.setContent(html, { waitUntil: "networkidle" });
  }

  // Wait for charts to render (Recharts uses requestAnimationFrame)
  await page.waitForTimeout(800);

  const pdf = await page.pdf({
    width: `${slideWidth}px`,
    height: `${slideHeight}px`,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    pageRanges: `1-${slideCount}`,
  });

  await browser.close();
  return pdf;
}

// ─── Alternative: Screenshot-based (higher fidelity for complex CSS) ──
export async function exportSlidesToImages(
  slideUrls: string[]
): Promise<Buffer[]> {
  const browser = await chromium.launch({ headless: true });
  const results: Buffer[] = [];

  for (const url of slideUrls) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const screenshot = await page.screenshot({ type: "png" });
    results.push(screenshot);
    await page.close();
  }

  await browser.close();
  return results;
}
