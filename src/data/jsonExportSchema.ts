export const JSON_EXPORT_SPEC = `# Rule Editor — JSON-Export-Spezifikation (Agenten-Format)

Dieses Dokument beschreibt das flache, agentenorientierte JSON-Format, das der Rule Editor über den Export-Button generiert. Es ist optimiert für die direkte Verarbeitung durch KI-Agenten und LLM-Pipelines.

## Grundstruktur

\`\`\`json
{
  "name": "Space Zugriff",
  "description": "Berechtigungslogik für geschützte Bereiche",
  "category": "permission",
  "entryNodeId": 2,
  "validationWarnings": null,
  "testCases": [...],
  "inputData": [...],
  "nodes": [...]
}
\`\`\`

### Wurzelfelder

- \`name\`: string — Name der Rulemap.
- \`description\`: string — Beschreibung der Rulemap.
- \`category\`: string | null — Kategorie (\`validation\`, \`permission\`, \`state\`, \`business-logic\`, \`error-handling\`).
- \`entryNodeId\`: number | null — ID (\`displayId\`) des Wurzelknotens (\`type: "entry"\`).
- \`validationWarnings\`: Array<{ nodeId: number, type: string, message: string, severity: "error" | "warning" }> | null — Aktuelle Validierungswarnungen oder \`null\`.
- \`testCases\`: Array<TestCase> (optional) — Fachliche Golden Examples aus den Consequence-Knoten.
- \`inputData\`: Array<ExportNode> — Alle Input-Knoten (\`type: "input"\` oder \`type: "input-ref"\`).
- \`nodes\`: Array<ExportNode> — Alle Entscheidungs- und Logikknoten (\`entry\`, \`decision\`, \`condition\`, \`action\`, \`consequence\`, \`consequence-ref\`).

---

## Knoten-Struktur (ExportNode)

Im Export-Format werden Knoten flach ohne React-Flow-Hülle exportiert. Ausgehende Verbindungen sind direkt im Array \`outputs\` des Knoten enthalten.

\`\`\`json
{
  "id": 2,
  "type": "entry",
  "label": "Wird dem Nutzer Zugriff gewährt?",
  "technicalKey": null,
  "expectedType": null,
  "notes": null,
  "outputs": [
    {
      "targetNodeId": 3
    }
  ]
}
\`\`\`

### Knoten-Felder

- \`id\`: number — Sichtbare Knoten-ID (numerisch ab 1).
- \`type\`: \`"entry" | "decision" | "condition" | "action" | "consequence" | "consequence-ref" | "input" | "input-ref"\` — Der Wurzelknoten wird im Export als \`"entry"\` typisiert.
- \`label\`: string | null — Fachliche Beschreibung des Knotens.
- \`technicalKey\`: string | null — Optionaler technischer Schlüssel (z. B. Variablenname).
- \`expectedType\`: string | null — Optionaler Datentyp (z. B. \`"boolean"\`, \`"enum"\`, \`"number"\`).
- \`notes\`: string | null — Notizen oder Kommentare.
- \`consequence\`: Object | null — Nur bei \`consequence\`-Knoten (siehe unten).
- \`outputs\`: Array<ExportEdge> — Ausgehende Verbindungen (siehe unten).
- \`refId\`: number (optional) — Nur bei \`consequence-ref\` und \`input-ref\`: ID des referenzierten Originalknotens.
- \`inputSource\`: Object | null — Nur bei Knoten mit Datenquelle (siehe unten).
- \`knowledgeSources\`: Array<KnowledgeSource> | null — Fachliche Quellen/Regelautoritäten.

---

## Spezifische Strukturen

### outputs (Kanten)

\`\`\`json
"outputs": [
  {
    "label": "Nein",
    "value": "false",
    "targetNodeId": 4
  }
]
\`\`\`
- \`label\`: string | null — Beschriftung der Kante (z. B. "Ja", "Nein").
- \`value\`: string | null — Maschinenlesbarer Wert (z. B. "true", "false", "GUEST").
- \`targetNodeId\`: number — Ziel-Knoten-ID.

### consequence (Endpunkt-Details)

\`\`\`json
"consequence": {
  "business": "Nutzer hat keinen Zugriff auf den Space.",
  "technical": "HTTP 403 Forbidden",
  "reference": "space_service.py: _has_access()"
}
\`\`\`

### inputSource (Verschachteltes Datenquellen-Objekt)

\`\`\`json
"inputSource": {
  "provider": "system",
  "providerSubtype": "stammdaten",
  "verfuegbarkeit": "vorhanden",
  "kannScheitern": false,
  "referenziertEntscheidung": null
}
\`\`\`
- \`provider\`: \`"system" | "manuell" | "komposition"\`
- \`providerSubtype\`: string | null
- \`verfuegbarkeit\`: \`"vorhanden" | "laufzeit"\`
- \`kannScheitern\`: boolean
- \`referenziertEntscheidung\`: string | null

### Referenz-Knoten (consequence-ref / input-ref)

\`\`\`json
{
  "id": 6,
  "type": "consequence-ref",
  "refId": 4
}
\`\`\`
- Nutzt das Feld \`refId\` (nicht \`refNodeId\`), welches direkt auf die numerische \`id\` des Zielknotens zeigt.

### testCases (Golden Examples)

\`\`\`json
"testCases": [
  {
    "id": "e1a2b3c4",
    "name": "Gast ohne Mitgliedschaft",
    "inputs": {
      "memberRole": "GUEST",
      "inOrg": "false"
    },
    "expectedConsequenceId": 4,
    "expectedResult": "Zugriff verweigert",
    "notes": "Wichtiger Fall für Security Audit"
  }
]
\`\`\`

---

## Vollständiges Beispiel

\`\`\`json
{
  "name": "Space Zugriff",
  "description": "Berechtigungslogik für geschützte Bereiche",
  "category": "permission",
  "entryNodeId": 2,
  "validationWarnings": null,
  "inputData": [
    {
      "id": 1,
      "type": "input",
      "label": "Nutzer in Organisation",
      "technicalKey": "inOrg",
      "expectedType": "boolean",
      "notes": null,
      "outputs": [
        {
          "targetNodeId": 3
        }
      ],
      "inputSource": {
        "provider": "system",
        "providerSubtype": "stammdaten",
        "verfuegbarkeit": "vorhanden",
        "kannScheitern": false,
        "referenziertEntscheidung": null
      }
    }
  ],
  "nodes": [
    {
      "id": 2,
      "type": "entry",
      "label": "Wird dem Nutzer Zugriff gewährt?",
      "technicalKey": null,
      "expectedType": null,
      "notes": null,
      "outputs": [
        {
          "targetNodeId": 3
        }
      ]
    },
    {
      "id": 3,
      "type": "condition",
      "label": "Ist Nutzer Teil der Organisation?",
      "technicalKey": null,
      "expectedType": null,
      "notes": null,
      "outputs": [
        {
          "label": "Nein",
          "value": "false",
          "targetNodeId": 4
        },
        {
          "label": "Ja",
          "value": "true",
          "targetNodeId": 5
        }
      ]
    },
    {
      "id": 4,
      "type": "consequence",
      "label": "Zugriff verweigert",
      "technicalKey": null,
      "expectedType": null,
      "notes": null,
      "consequence": {
        "business": "Nutzer ist nicht Teil der Organisation."
      },
      "outputs": []
    },
    {
      "id": 5,
      "type": "consequence",
      "label": "Zugriff erlaubt",
      "technicalKey": null,
      "expectedType": null,
      "notes": null,
      "consequence": {
        "business": "Nutzer erhält Zugriff."
      },
      "outputs": []
    },
    {
      "id": 6,
      "type": "consequence-ref",
      "refId": 4
    }
  ]
}
\`\`\`
`;
