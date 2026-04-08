import type { ChartTemplate } from "../types/slide";

/**
 * Built-in chart templates with example data
 * Users can clone these to quickly create pre-configured charts
 */
export const CHART_TEMPLATES: ChartTemplate[] = [
  {
    id: "chart-sales-comparison",
    name: "Sales Vergleich",
    description: "Umsatzvergleich zwischen Perioden",
    chartType: "bar",
    category: "sales",
    defaultConfig: {
      title: "Umsatz nach Quartal",
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        {
          label: "2025",
          data: [1_480_000, 1_620_000, 1_720_000, 1_890_000],
          color: "#2D6A9F",
        },
        {
          label: "2024",
          data: [1_350_000, 1_480_000, 1_640_000, 1_750_000],
          color: "#8BA4C4",
        },
      ],
      showLegend: true,
      showGrid: true,
      formatY: "currency",
    },
  },
  {
    id: "chart-trend-line",
    name: "Trend-Analyse",
    description: "Entwicklung einer Kennzahl über Zeit",
    chartType: "line",
    category: "general",
    defaultConfig: {
      title: "Kontrollmaße - Entwicklung",
      labels: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"],
      datasets: [
        {
          label: "Ist-Wert",
          data: [2_100_000, 2_150_000, 2_340_000, 2_280_000, 2_450_000, 2_600_000],
          color: "#E89D3C",
        },
        {
          label: "Plan-Wert",
          data: [2_000_000, 2_050_000, 2_200_000, 2_300_000, 2_400_000, 2_500_000],
          color: "#A0A0A0",
        },
      ],
      showLegend: true,
      showGrid: true,
      formatY: "currency",
    },
  },
  {
    id: "chart-market-share",
    name: "Marktanteile",
    description: "Verteilung nach Segmenten",
    chartType: "pie",
    category: "general",
    defaultConfig: {
      title: "Marktanteile nach Region",
      labels: ["Nord", "Süd", "Ost", "West"],
      datasets: [
        {
          label: "Anteil",
          data: [28, 32, 22, 18],
        },
      ],
      showLegend: true,
    },
  },
  {
    id: "chart-distribution",
    name: "Verteilung",
    description: "Kreisdiagramm für Proportionen",
    chartType: "donut",
    category: "general",
    defaultConfig: {
      title: "Kostenverteilung",
      labels: ["Personal", "Material", "Betrieb", "Sonstiges"],
      datasets: [
        {
          label: "Anteil",
          data: [45, 25, 20, 10],
        },
      ],
      showLegend: true,
    },
  },
  {
    id: "chart-area-trend",
    name: "Liquiditäts-Trend",
    description: "Kumulativer Trend mit Min/Max Bereich",
    chartType: "area",
    category: "financial",
    defaultConfig: {
      title: "Kontostand (€)",
      labels: ["Okt", "Nov", "Dez", "Jan", "Feb", "Mär"],
      datasets: [
        {
          label: "Ist / Plan",
          data: [1_800_000, 2_100_000, 1_750_000, 2_340_000, 2_150_000, 2_340_000],
          color: "#2D6A9F",
        },
        {
          label: "Limit",
          data: [1_200_000, 1_200_000, 1_200_000, 1_200_000, 1_200_000, 1_200_000],
          color: "#FF6B6B",
        },
      ],
      showLegend: true,
      showGrid: true,
      formatY: "currency",
    },
  },
  {
    id: "chart-waterfall",
    name: "Waterfall / Brücke",
    description: "Veränderungen und Zwischensummen",
    chartType: "waterfall",
    category: "financial",
    defaultConfig: {
      title: "Ertragsbrücke",
      labels: ["Vorjahr", "Preis", "Volumen", "Mix", "Kosten", "Aktuell"],
      datasets: [
        {
          label: "Änderung",
          data: [5_000_000, 250_000, 480_000, -120_000, -350_000, 5_260_000],
        },
      ],
      showLegend: false,
      showGrid: true,
      formatY: "currency",
    },
  },
];

/**
 * Helper: Get template by ID
 */
export function getChartTemplate(id: string): ChartTemplate | undefined {
  return CHART_TEMPLATES.find((t) => t.id === id);
}

/**
 * Helper: Filters templates by category
 */
export function getChartTemplatesByCategory(
  category: string
): ChartTemplate[] {
  return CHART_TEMPLATES.filter((t) => t.category === category);
}
