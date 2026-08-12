export const JSON_SCHEMA_SPEC = `# Rule Editor — JSON-Spezifikation (Import / Dateiformat)

Dieses Dokument beschreibt das Import-/Dateiformat (React-Flow-Struktur) des Rule Editors. Nutze es, um Rulemaps programmatisch zu erstellen oder von KI-Agenten generieren zu lassen.

Hinweis: Der JSON-Export der Anwendung nutzt ein anderes, flaches Format für die Weiterverarbeitung durch KI-Agenten.

## Grundstruktur

\`\`\`json
{
  "version": "1.0.0",
  "meta": {
    "id": "string",
    "name": "string",
    "description": "string (optional)",
    "category": "string (optional)",
    "created": "ISO 8601 Datum",
    "modified": "ISO 8601 Datum"
  },
  "nodes": [...],
  "edges": [...]
}
\`\`\`

## Knoten (nodes)

Jeder Knoten hat folgende Pflichtfelder:

\`\`\`json
{
  "id": "string (eindeutige ID, z.B. 'n1')",
  "type": "ruleNode",
  "position": { "x": 0, "y": 0 },
  "data": {
    "label": "string (fachliche Beschreibung)",
    "nodeType": "decision | condition | action | consequence | consequence-ref | input | input-ref",
    "displayId": 1
  }
}
\`\`\`

### Knotentypen und ihre spezifischen Felder

**decision** — Einstiegsfrage der Entscheidung.
\`\`\`json
{ "nodeType": "decision", "label": "Wird dem Nutzer Zugriff gewährt?" }
\`\`\`

**condition** — Prüft einen Wert oder Zustand.
\`\`\`json
{ "nodeType": "condition", "label": "Ist der Nutzer Teil der Organisation?" }
\`\`\`

**action** — Führt eine Aktion aus.
\`\`\`json
{ "nodeType": "action", "label": "Benachrichtigung an Admin senden" }
\`\`\`

**consequence** — Endpunkt eines Pfades.
\`\`\`json
{
  "nodeType": "consequence",
  "label": "Zugriff verweigert",
  "consequence": {
    "business": "Der Nutzer hat keinen Zugriff auf den Space.",
    "technical": "HTTP 403 Forbidden (optional)",
    "reference": "space_service.py: _has_access() (optional)"
  }
}
\`\`\`

**consequence-ref** — Verweis auf eine bestehende Consequence.
\`\`\`json
{
  "id": "n10",
  "type": "ruleNode",
  "position": { "x": 0, "y": 0 },
  "data": {
    "label": "Zugriff verweigert",
    "nodeType": "consequence-ref",
    "displayId": 10,
    "refNodeId": 4
  }
}
\`\`\`
refNodeId verweist auf die displayId des Original-Consequence-Knotens (z.B. 4 für Knoten #4).
Alle Daten (consequence, knowledgeSources) kommen vom Original.
Implementiere die Logik einmal und referenziere sie — es ist DASSELBE Objekt.

**input** — Beschreibt einen Datenwert der in die Entscheidung einfließt.
\`\`\`json
{
  "nodeType": "input",
  "label": "Nutzerrolle",
  "technicalKey": "memberRole (optional)",
  "expectedType": "enum (optional)",
  "inputProvider": "system | manuell | komposition (optional)",
  "inputProviderSubtype": "stammdaten (optional)",
  "inputVerfuegbarkeit": "vorhanden | laufzeit (optional)",
  "inputKannScheitern": false
}
\`\`\`

**input-ref** — Verweis auf einen bestehenden Input.
\`\`\`json
{
  "id": "n8",
  "type": "ruleNode",
  "position": { "x": 0, "y": 0 },
  "data": {
    "label": "Nutzerrolle",
    "nodeType": "input-ref",
    "displayId": 8,
    "refNodeId": 5
  }
}
\`\`\`
refNodeId verweist auf die displayId des Original-Input-Knotens (z.B. 5 für Knoten #5).
Die Datenquelle ist DIESELBE — nicht eine zweite Instanz.

### Optionale Felder (bei allen Knotentypen)

\`\`\`json
{
  "technicalKey": "string (optional, z.B. 'memberRole')",
  "expectedType": "string (optional, z.B. 'boolean', 'enum', 'number')",
  "notes": "string (optional, Notizen)",
  "knowledgeSources": [
    {
      "id": "string",
      "art": "gesetz | norm_standard | interne_richtlinie | vertrag | fachwissen",
      "verbindlichkeit": "verbindlich | empfohlen | optional",
      "referenz": "§28a Abs. 1 JuSchG",
      "eigner": "Recht/Compliance (optional)",
      "beschreibung": "Kurzbeschreibung (optional)"
    }
  ]
}
\`\`\`

## Verbindungen (edges)

\`\`\`json
{
  "id": "string (eindeutige ID, z.B. 'e1')",
  "source": "string (ID des Quellknotens)",
  "target": "string (ID des Zielknotens)",
  "type": "labeled",
  "label": "string (z.B. 'Ja', 'Nein', kann null sein)",
  "data": {
    "value": "string (maschinenlesbarer Wert, z.B. 'true', 'GUEST', kann null sein)"
  }
}
\`\`\`

### Verbindungsregeln

- Decision/Condition/Action → Decision/Condition/Action/Consequence/Consequence-Ref: horizontal (links → rechts)
- Input/Input-Ref → Condition/Decision: vertikal (oben → unten)
- Consequence/Consequence-Ref: haben keine ausgehenden Verbindungen
- Input/Input-Ref: haben keine eingehenden Verbindungen

## Positionierung

- Entscheidungsbaum: horizontal von links nach rechts
- Input-Knoten: oberhalb des Baums, vertikal verbunden
- Positionen werden beim Import automatisch per Auto-Layout berechnet — es reicht \`{ "x": 0, "y": 0 }\` zu setzen

## IDs

- \`id\`: interner React-Flow Identifier für Knoten und Edges (z.B. "n1", "n2", "e1", "e2")
- \`displayId\`: sichtbare Nummer im Canvas (#1, #2, ...), fortlaufend, beginnt bei 1
- \`refNodeId\`: verweist auf die displayId des referenzierten Knotens (z.B. 4 für Knoten #4)

## Beispiel

\`\`\`json
{
  "version": "1.0.0",
  "meta": {
    "id": "space-access",
    "name": "Space Zugriff",
    "description": "Berechtigungslogik für geschützte Bereiche",
    "category": "permission",
    "created": "2026-06-15T12:00:00.000Z",
    "modified": "2026-06-15T12:00:00.000Z"
  },
  "nodes": [
    {
      "id": "n1",
      "type": "ruleNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Nutzer in Organisation",
        "nodeType": "input",
        "displayId": 1,
        "technicalKey": "inOrg",
        "expectedType": "boolean",
        "inputProvider": "system",
        "inputProviderSubtype": "stammdaten",
        "inputVerfuegbarkeit": "vorhanden",
        "inputKannScheitern": false
      }
    },
    {
      "id": "n2",
      "type": "ruleNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Wird dem Nutzer Zugriff gewährt?",
        "nodeType": "decision",
        "displayId": 2
      }
    },
    {
      "id": "n3",
      "type": "ruleNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Ist Nutzer Teil der Organisation?",
        "nodeType": "condition",
        "displayId": 3
      }
    },
    {
      "id": "n4",
      "type": "ruleNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Zugriff verweigert",
        "nodeType": "consequence",
        "displayId": 4,
        "consequence": {
          "business": "Nutzer ist nicht Teil der Organisation."
        }
      }
    },
    {
      "id": "n5",
      "type": "ruleNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Zugriff erlaubt",
        "nodeType": "consequence",
        "displayId": 5,
        "consequence": {
          "business": "Nutzer erhält Zugriff."
        }
      }
    },
    {
      "id": "n6",
      "type": "ruleNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Zugriff verweigert",
        "nodeType": "consequence-ref",
        "displayId": 6,
        "refNodeId": 4
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n3", "type": "labeled" },
    { "id": "e2", "source": "n2", "target": "n3", "type": "labeled" },
    { "id": "e3", "source": "n3", "target": "n4", "type": "labeled", "label": "Nein", "data": { "value": "false" } },
    { "id": "e4", "source": "n3", "target": "n5", "type": "labeled", "label": "Ja", "data": { "value": "true" } }
  ]
}
\`\`\`
`;
