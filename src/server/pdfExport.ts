// server/pdfExport.ts
// Run in Node.js (Express endpoint or Supabase Edge Function)
// POST /api/export-pdf  { html|slideUrl, slideCount, filename? }

import { chromium } from "playwright";

export interface ExportOptions {
  /** Full HTML string or http(s) URL */
  html: string;
  filename?: string;
  slideCount: number;
  slideWidth?: number;   // default 1280
  slideHeight?: number;  // default 720
}

export async function exportPresentationToPDF(opts: ExportOptions): Promise<Buffer> {
  const { html, slideWidth = 1280, slideHeight = 720, slideCount } = opts;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewportSize({ width: slideWidth, height: slideHeight });

  if (html.startsWith("http")) {
    await page.goto(html, { waitUntil: "networkidle" });
  } else {
    await page.setContent(html, { waitUntil: "networkidle" });
  }

  // Wait for Recharts (uses requestAnimationFrame)
  await page.waitForTimeout(800);

  const pdf = await page.pdf({
    width: `${slideWidth}px`,
    height: `${slideHeight}px`,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    pageRanges: `1-${slideCount}`,
  });

  await browser.close();
  return pdf as Buffer;
}

// ─── Alternative: Screenshot-based (höhere Treue für komplexes CSS) ──
export async function exportSlidesToImages(slideUrls: string[]): Promise<Buffer[]> {
  const browser = await chromium.launch({ headless: true });
  const results: Buffer[] = [];

  for (const url of slideUrls) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const screenshot = await page.screenshot({ type: "png" });
    results.push(screenshot as unknown as Buffer);
    await page.close();
  }

  await browser.close();
  return results;
}
