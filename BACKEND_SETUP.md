# Backend Setup: Lokale MSSQL-Anbindung

## Überblick

Der Slide-Builder hat jetzt einen lokalen Node.js-Backend-Server mit folgenden Funktionen:
- **MSSQL-Verbindung** mit Connection Pool und SQL Login
- **Template-CRUD** über `/api/slide-templates`
- **Daten-Proxy** für Charts/KPIs über `/query`
- **Sicherheit**: Nur SELECT-Statements erlaubt, Tabellen-Allowlist

## Voraussetzungen

1. **MS SQL Server lokal installiert** (SQL Server 2019+ empfohlen)
2. **Node.js 18+**
3. **npm** oder **yarn**

## Installation

### 1. Dependencies installieren

```bash
npm install
```

Das installiert:
- `mssql` – MSSQL-Treiber (tedious)
- `express` – HTTP-Server
- `cors` – CORS-Middleware
- `dotenv` – Umgebungsvariablen
- Alle anderen Abhängigkeiten

### 2. Umgebungsvariablen konfigurieren

Erstelle eine Datei `.env.local` im Projektroot mit deinen SQL-Credentials:

```env
# Server Port
SERVER_PORT=4110

# MSSQL Connection
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=YourPassword123!
DB_DATABASE=slide_builder

# Connection Options
DB_ENCRYPT=false
DB_TRUST_SERVER_CERT=true
DB_POOL_SIZE=10

# Other
NODE_ENV=development
CORS_ORIGIN=*
```

**Hinweis**: `.env.local` ist in `.gitignore` und wird nicht versioniert. Jeder Developer muss seine Credentials lokal konfigurieren.

### 3. Datenbank vorbereiten (optional)

Falls die Datenbank noch nicht existiert, erstelle sie manuell:

```sql
CREATE DATABASE slide_builder;
```

Die erforderlichen Tabellen werden beim Serverstart automatisch erstellt.

## Betrieb

### Development: Frontend + Backend

**Terminal 1 - Backend starten:**
```bash
npm run dev:server
```

Oder klassisch mit tsx:
```bash
tsx src/server/index.ts
```

**Terminal 2 - Frontend starten:**
```bash
npm run dev
```

Der Frontend auf http://localhost:5173 wird automatisch Anfragen an `http://localhost:4110` proxyen (konfiguriert in `vite.config.ts`).

### Verifikation

Backend Health Check:
```bash
curl http://localhost:4110/health
```

Erwartete Antwort:
```json
{
  "status": "ok",
  "timestamp": "2026-03-30T10:00:00.000Z",
  "database": "connected"
}
```

## API-Endpoints

### Template-CRUD

#### GET /api/slide-templates
Alle öffentlichen Templates + Templates des Benutzers abrufen.

Query Parameter:
- `userId` (optional): Nur Templates dieses Users + öffentliche

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "template-1",
      "name": "Verkaufs-Dashboard",
      "title": "Q1 Sales Report",
      "blocks": [...],
      "createdAt": "2026-03-30T10:00:00.000Z"
    }
  ]
}
```

#### POST /api/slide-templates
Neues Template erstellen.

Request Body:
```json
{
  "id": "template-new",
  "name": "Mein Template",
  "title": "Titel",
  "blocks": [],
  "userId": "user-123"
}
```

#### PUT /api/slide-templates/:id
Template aktualisieren.

#### DELETE /api/slide-templates/:id
Template löschen.

Query Parameter:
- `userId` (optional): Bestätigung für Ownership-Check

### Data Proxy

#### POST /query
Daten für Charts/KPIs abrufen.

**Option 1: Table-basiert**
```json
{
  "table": "sales_data",
  "filters": { "region": "DACH" },
  "limit": 100
}
```

**Option 2: SQL-basiert**
```json
{
  "sql": "SELECT TOP 100 month, revenue FROM sales_data WHERE region = 'DACH' ORDER BY month"
}
```

Response:
```json
{
  "success": true,
  "data": [
    { "month": "Jan", "revenue": 15000 },
    { "month": "Feb", "revenue": 18000 }
  ]
}
```

## Sicherheit

### SELECT-only Enforcement
- Nur SELECT-Statements erlaubt
- Gefährliche Keywords (DROP, DELETE, INSERT, UPDATE, EXEC) werden abgelehnt

### Tabellen-Allowlist
Erlaubte Tabellen in `/src/server/db/queryExecutor.ts`:
```typescript
const ALLOWED_TABLES = [
  "slide_templates",
  "chart_data",
  "sales_data",
  // Weitere Tabellen hinzufügen
];
```

### Parameterized Queries
Alle Abfragen verwenden parameterized statements, um SQL-Injection zu preventieren.

## Troubleshooting

### Fehler: "Connection refused" oder "Cannot find MSSQL server"

**Lösung:**
1. SQL Server lokal läuft? `sqlcmd -S localhost`
2. .env.local korrekt konfiguriert? (Host, Port, User, Password)
3. Datenbank existiert? `CREATE DATABASE slide_builder;`
4. Firewall blockiert Port 1433? Prüfen oder lokal testen mit `localhost`

### Fehler: "Login failed for user 'sa'"

**Lösung:**
- Passwort in .env.local korrekt?
- SQL-Authentifizierung aktiv? (SQL Server sollte im "Mixed Mode" sein)

### Fehler: "Tables not found"

**Lösung:**
- Bei erstem Start werden Tabellen automatisch erstellt
- Manuell mit SSMS oder sqlcmd prüfen:
  ```sql
  USE slide_builder;
  SELECT * FROM INFORMATION_SCHEMA.TABLES;
  ```

### Frontend kann Backend nicht erreichen (CORS-Fehler)

**Lösung:**
- Vite Proxy läuft? Vite-Dev-Server neustart
- Backend läuft auf Port 4110?
- CORS_ORIGIN in .env.local korrekt gesetzt? (default: `*`)

## Build und Deployment

### Build für Production
```bash
npm run build
```

Build-Output: `dist/` (Frontend), Backend wird wie normales Node-Script ausgeführt.

### Production Start

1. .env einrichten (DB_HOST mit remotem Server, etc.)
2. Backend starten:
   ```bash
   NODE_ENV=production tsx src/server/index.ts
   ```
3. Frontend served über nginx/Apache oder Node-Static-Server

## Nächste Schritte

1. **Schema erweitern**: Weitere Tabellen und Views in [queries.ts](src/server/db/queries.ts) hinzufügen
2. **Daten laden**: Sample-Daten in SQL Server importieren
3. **Frontend-Hooks integrieren**: `useTemplates` und `useSlideData` testen gegen echte Backend-Antworten
4. **Logging & Monitoring**: pino/winston für strukturierte Logs, optional APM-Integration

## Referenzen

- [MSSQL-js Dokumentation](https://github.com/tediousjs/node-mssql)
- [Express.js API](https://expressjs.com/en/api.html)
- [TypeScript Server](https://www.typescriptlang.org/docs/handbook/dom-manipulation.html)
