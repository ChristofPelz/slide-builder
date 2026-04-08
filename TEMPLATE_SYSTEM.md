# Template System - Dokumentation

## Übersicht

Das neue Template-System ermöglicht es Benutzern, Präsentationen von Grund auf zu gestalten mit:

1. **Textblöcke** - Schnell neue Textblöcke hinzufügen
2. **Diagramm-Templates** - Vordefinierte Chart-Layouts mit Beispieldaten
3. **Slide-Templates** - Ganze Folien als Vorlagen speichern und wiederverwenden
4. **Individuelle Blocks** - Einzelne Diagramme konfigurieren und bearbeiten

---

## Funktionen

### 1️⃣ **+ Element Button in der Toolbar**

Der neue "+ Element" Button ist in der Toolbar rechts neben dem Foliennummer-Anzeiger positioniert.

**Optionen im Dropdown:**

#### 📝 **Text Block**
- Fügt schnell einen neuen Textblock zur Folie hinzu
- Standard-Position: unten auf der Folie
- Standard-Größe: 400×100px
- Sofort editierbar in der Properties Panel

#### 📊 **Diagramm** (6 Templates)
1. **Sales Vergleich** - Balkendiagramm für Periodenvergleiche
2. **Trend-Analyse** - Liniendiagramm für Entwicklungen
3. **Marktanteile** - Kreisdiagramm für Verteilungen
4. **Verteilung** - Donut-Diagramm für Proportionen
5. **Liquiditäts-Trend** - Flächendiagramm mit Min/Max
6. **Waterfall / Brücke** - Wasserfalldiagramm für Änderungen

Jedes Template:
- Hat vorkonfigurierte Beispieldaten
- Ist sofort einsatzbereit
- Kann nachträglich angepasst werden (Titel, Werte, Farben, etc.)

#### 📑 **Slide Template** (wenn vorhanden)
- Listet alle gespeicherten Slide-Templates auf
- Ein-Klick zum Hinzufügen einer kompletten Folie
- Alle Blöcke werden automatisch geklont mit neuen IDs

#### 💾 **Als Template speichern**
- Speichert die aktuelle Folie als wiederverwendbare Vorlage
- Dialog: Name und optional Beschreibung eingeben
- Templates werden lokal gespeichert (später auch in DB möglich)
- Verfügbar in Slide Templates für Wiederverwendung

---

## Technische Details

### Dateien

```
src/
├── types/slide.ts                 # ChartTemplate, SlideTemplate interfaces
├── data/chartTemplates.ts         # 6 vordefinierte Chart-Templates
├── hooks/useTemplates.ts          # Hook für Template-Verwaltung
├── components/
│   ├── BlockInserterMenu.tsx      # Dropdown-Menu UI
│   └── SlideCanvas.tsx            # (keine Änderungen)
├── App.tsx                        # Integration der Templates
└── server/
    └── api-templates.ts           # API-Dokumentation (SQL Schemas)
```

### Datenstrukturen

#### `ChartTemplate`
```typescript
interface ChartTemplate {
  id: string;                              // z.B. "chart-sales-comparison"
  name: string;                            // "Sales Vergleich"
  description?: string;
  chartType: "bar" | "line" | "pie" | ...;
  category?: "financial" | "sales" | ...;
  defaultConfig: Partial<ChartBlock>;      // Vorkonfigurierte Chart-Einstellungen
}
```

#### `SlideTemplate`
```typescript
interface SlideTemplate {
  id: string;                     // Eindeutige ID
  name: string;                   // Template-Name
  description?: string;
  blocks: SlideBlock[];           // Array aller Blöcke auf der Folie
  title: string;
  subtitle?: string;
  userId?: string;                // Für zukünftige Datenbankintegration
  createdAt?: string;
  isPublic?: boolean;
}
```

### Hook: `useTemplates()`

```typescript
const {
  chartTemplates,              // ChartTemplate[]
  slideTemplates,              // SlideTemplate[]
  saveSlideTemplate,           // (template) => Promise
  deleteSlideTemplate,         // (id) => Promise
  refetchSlideTemplates,       // () => Promise
} = useTemplates();
```

**Speicher-Strategie:**
1. Versucht `/api/slide-templates` zu nutzen
2. Fallback auf Browser `localStorage` wenn API nicht verfügbar
3. Templates können damit offline funktionieren

---

## Nutzungsbeispiel

### Neue Präsentation von Grund auf erstellen:

1. **Erste Textblock hinzufügen:**
   - "+ Element" → "Text Block"
   - Text eingeben
   - Größe/Position anpassen

2. **Chart einfügen:**
   - "+ Element" → "Diagramm"
   - "Sales Vergleich" oder anderes Template wählen
   - Daten anpassen (Labels, Werte)
   - Farben konfigurieren

3. **Slide speichern als Template:**
   - "+ Element" → "Als Template speichern"
   - Name eingeben: z.B. "Q1 Financial Summary"
   - Speichern
   - Nächste Mal verfügbar unter "Slide Template"

4. **Neue Folie mit Template:**
   - "+ Element" → "Slide Template"
   - Gespeichertes Template auswählen
   - Neue Folie mit allen Blöcken wird hinzugefügt

---

## Zukünftige Erweiterungen

### Phase 2: Datenbankintegration
- Slide Templates zentral speichern (Supabase)
- Zwischen Benutzern teilen
- Versionierung/Revision

### Phase 3: Template-Verwaltung
- Template-Bibliothek (alle verfügbaren Templates ansehen)
- Favoriten markieren
- Kategorisieren
- Suchen/Filtern

### Phase 4: Template-Customization
- Chart-Templates mit Datenbindung (QueryId linking)
- Dynamische Platzhalter
- Template-Validierung

---

## Blockieren von Problemen

### localStorage vs. API
- **localStorage**: Funktioniert offline, aber nur pro Browser/Device
- **API**: Zentral, aber benötigt Backend-Integration
- **Hybrid**: Aktuelles System - Auto-Fallback

### Template-IDs
- Chart-Templates: Hardcoded (zentral verwaltbar)
- Slide-Templates: Eindeutig per Timestamp + Random
- Block-IDs: Beim Klonen neu generiert (verhindert Konflikte)

### UI/UX
- Menu verschwindet bei Klick außerhalb (Overlay-Backdrop)
- Nur verfügbare Templates zeigen
- Loading State für Slide Templates implementiert

---

## Testing Checklist

- [ ] + Element Button sichtbar in Toolbar
- [ ] Menu öffnet/schließt korrekt
- [ ] Text Block hinzufügen funktioniert
- [ ] Chart Template auswählen funktioniert
- [ ] Neue Block ist selektierbar und editierbar
- [ ] Slide Template speichern funktioniert
- [ ] Gespeichertes Template in List sichtbar
- [ ] Slide Template einfügen erstellt neue Folie mit Blöcken
- [ ] localStorage wird bei Reload erhalten (localStorage dev tools)

---

## Code-Beispiele

### Text Block hinzufügen (onClick Handler):
```typescript
const block: TextBlock = {
  id: generateId("txt"),
  type: "text",
  content: "Text einfügen",
  x: 40,
  y: SLIDE_HEIGHT - 120,
  width: 400,
  height: 100,
};
addBlockToCurrentSlide(block);
```

### Chart aus Template:
```typescript
const chartBlock: ChartBlock = {
  id: generateId("chart"),
  type: "chart",
  chartType: template.defaultConfig.chartType!,
  title: template.defaultConfig.title,
  labels: template.defaultConfig.labels || [],
  datasets: template.defaultConfig.datasets || [],
  x: (SLIDE_WIDTH - 600) / 2,
  y: 150,
  width: 600,
  height: 400,
};
addBlockToCurrentSlide(chartBlock);
```

### Slide als Template speichern:
```typescript
const template: SlideTemplate = {
  id: `template-${Date.now()}`,
  name,       // Vom User eingegeben
  description,
  title: current.title,
  blocks: current.blocks,
};
await saveSlideTemplate(template);
```

---

## Fehlerbehebung

### Templates laden nicht
→ Browser-Konsole öffnen (F12) und localStorage prüfen:
```javascript
JSON.parse(localStorage.getItem('slide-templates'))
```

### Neue Blöcke überlappen
→ Positionen sind hardcoded, können in `BlockInserterMenu.tsx` angepasst werden

### Menu verschwindet nicht
→ Backdrop-Click-Handler prüfen in `App.tsx` Toolbar-Bereich

---

## API-Dokumentation (für Backend-Integration)

Siehe `src/server/api-templates.ts` für:
- SQL Schema für chart_templates und slide_templates
- GET/POST/DELETE Endpoints
- Seed Data für vordefinierte Templates

