# Slide Builder — Finanzpräsentationen aus Datenbankdaten

React + TypeScript App zur Erstellung von Finanzpräsentationen ähnlich wie PowerPoint,
mit direkter Anbindung an Supabase (PostgreSQL) und MS SQL Server.

## Setup

```bash
npm install
cp .env.example .env          # Supabase-Keys eintragen
npm run dev                   # Frontend auf http://localhost:5173
npm run server                # MSSQL-Proxy auf http://localhost:4001 (optional)
```

## Projektstruktur

```
src/
├── types.ts                  # Alle TypeScript-Typen (Slide, Block, Query, Theme)
├── App.tsx                   # Hauptanwendung: Editor + Thumbnail-Strip + Toolbar
│
├── components/
│   ├── SlideCanvas.tsx       # Kernkomponente: 1280×720px Folie mit Header/Footer
│   └── blocks/
│       ├── KPIBlock.tsx      # Kennzahlkarte mit Delta, Trend, 3 Varianten
│       ├── ChartBlock.tsx    # Bar, Line, Area, Pie, Donut via Recharts
│       ├── TableBlock.tsx    # Finanztabelle mit Summenzeile, Striped, Formatierung
│       ├── TextBlock.tsx     # Überschriften, Body, Caption, Zitat
│       └── ImageBlock.tsx    # Bild/Logo-Block
│
├── hooks/
│   └── useSlideData.ts       # Daten-Hook: Supabase + MSSQL Proxy → Block-Injection
│
└── server/
    └── pdfExport.ts          # Playwright PDF-Export (serverside)
```

## Folie konfigurieren (SlideConfig)

```typescript
const slide: SlideConfig = {
  id: "s1",
  title: "Quartalsbericht Q1 2025",
  subtitle: "B&B Unternehmensgruppe",
  blocks: [
    {
      id: "kpi1", type: "kpi",
      label: "Umsatz", value: 4_820_000, format: "currency",
      delta: 7.3, trend: "up", deltaLabel: "vs. Q1 2024",
      variant: "highlight",
      x: 40, y: 76, width: 270, height: 110,
    },
    {
      id: "chart1", type: "chart", chartType: "bar",
      title: "Umsatz nach Monat",
      labels: ["Jan", "Feb", "Mär"],
      datasets: [{ label: "2025", data: [1_480_000, 1_620_000, 1_720_000] }],
      formatY: "currency",
      // Optional: Live-DB-Anbindung
      queryId: "q_umsatz_monat",
      x: 40, y: 206, width: 560, height: 460,
    },
  ],
};
```

## Daten aus DB laden

```typescript
const queries: QueryConfig[] = [
  {
    id: "q_umsatz_monat",
    name: "Umsatz pro Monat",
    source: "supabase",          // oder "mssql"
    sql: `SELECT monat AS label, SUM(betrag) AS value
          FROM buchungen
          WHERE periode = '2025-Q1'
          GROUP BY monat ORDER BY monat`,
    labelColumn: "label",
    valueColumn: "value",
  },
];

// Im Slide-Kontext:
const { resolvedBlocks, loading, refresh } = useSlideData(slide.blocks, queries);
```

## PDF-Export

Der Export läuft serverseitig via Playwright:

```bash
POST /api/export-pdf
Content-Type: application/json

{
  "slideUrl": "http://localhost:5173/slide/s1",
  "slideCount": 3,
  "filename": "Q1_2025_BBGruppe.pdf"
}
```

Der Server rendert jede Folie bei 1280×720 px, erzeugt daraus einen PDF-Druck
mit print-background: true und gibt die Datei zurück.

## Theme

```typescript
const theme: Theme = {
  primary:     "#1B2A4A",    // Dunkelblau — Header, Dark-KPI
  secondary:   "#2D6A9F",    // Mittelblau — Charts Primärfarbe
  accent:      "#E8A020",    // Amber — Highlight-Linie, KPI-Akzent
  background:  "#FFFFFF",
  surface:     "#F4F6F9",    // Karten-Hintergrund
  text:        "#0F1B2D",
  textMuted:   "#6B7A90",
  fontHeading: "'Barlow Condensed', sans-serif",
  fontBody:    "'Barlow', sans-serif",
  borderRadius: 6,
  logo:        "/logo.svg",  // Optional
};
```

## Nächste Schritte

- [ ] Drag & Drop Block-Positionierung (react-draggable oder dnd-kit)
- [ ] Theme-Import via Screenshot + Claude Vision API
- [ ] Supabase-Storage für Präsentationen (presentations-Tabelle)
- [ ] Block-Konfiguration per Sidebar (Query auswählen, Formatierung)
- [ ] PPTX-Export via pptxgenjs
- [ ] Wasserfall-Chart (Brücken-Diagramm) für GuV-Abweichungen
