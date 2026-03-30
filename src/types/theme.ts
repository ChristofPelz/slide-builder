export interface Theme {
  primary: string;       // Header-Hintergrund, Tabellenköpfe
  secondary: string;     // Charts Primärfarbe, Summenzeile
  accent: string;        // Highlight-Linie, aktive Elemente
  background: string;    // Folienhintergrund
  surface: string;       // Karten- / Tabellenhintergrund
  text: string;          // Primärer Text
  textMuted: string;     // Sekundärer / dezenter Text
  fontHeading: string;   // CSS font-family für Überschriften
  fontBody: string;      // CSS font-family für Fließtext
  borderRadius: number;  // px
  logo?: string;         // Pfad zu Logo-SVG/PNG
}

export const defaultTheme: Theme = {
  primary:      "#1B2A4A",
  secondary:    "#2D6A9F",
  accent:       "#E8A020",
  background:   "#FFFFFF",
  surface:      "#F4F6F9",
  text:         "#0F1B2D",
  textMuted:    "#6B7A90",
  fontHeading:  "'Barlow Condensed', sans-serif",
  fontBody:     "'Barlow', sans-serif",
  borderRadius: 6,
};
