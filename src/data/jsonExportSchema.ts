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

- \`name\`: string — Name der Decision Map.
- \`description\`: string — Beschreibung der Decision Map.
- \`category\`: string | null — Kategorie (\`validation\`, \`permission\`, \`state\`, \`business-logic\`, \`error-handling\`).
- \`entryNodeId\`: number | null — ID (\`displayId\`) des Einstiegsknotens. Der Einstiegsknoten ist ein regulärer Logikknoten aus \`nodes\` (nie ein Input).
- \`validationWarnings\`: Array<{ nodeId: number, ruleId: string, type: string, message: string, severity: "error" | "warning" | "hint" }> | null — Aktuelle Validierungsbefunde oder \`null\`. \`ruleId\` ist die stabile Regel-ID aus der Formatspezifikation (z. B. \`CONS-07\`), \`nodeId\` ist \`0\` bei dokumentweiten Befunden.
- \`testCases\`: Array<TestCase> (optional) — Fachliche Golden Examples aus den Consequence-Knoten.
- \`inputData\`: Array<ExportNode> — Alle Input-Knoten (\`type: "input"\` oder \`type: "input-ref"\`). Input-Knoten können nie Einstiegsknoten sein.
- \`nodes\`: Array<ExportNode> — Alle Entscheidungs- und Logikknoten (\`decision\`, \`condition\`, \`action\`, \`consequence\`, \`consequence-ref\`).

---

## Knoten-Struktur (ExportNode)

Im Export-Format werden Knoten flach ohne React-Flow-Hülle exportiert. Ausgehende Verbindungen sind direkt im Array \`outputs\` des Knoten enthalten.

\`\`\`json
{
  "id": 2,
  "type": "decision",
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
- \`type\`: \`"decision" | "condition" | "action" | "consequence" | "consequence-ref" | "input" | "input-ref"\` — Der Knotentyp (Knoten behalten ihren echten Typ; für Abwärtskompatibilität wird bei älteren Exports auch \`"entry"\` als Synonym für \`"decision"\` akzeptiert).
- \`label\`: string | null — Fachliche Beschreibung des Knotens.
- \`technicalKey\`: string | null — Optionaler technischer Schlüssel (z. B. Variablenname).
- \`expectedType\`: string | null — Optionaler Datentyp (z. B. \`"boolean"\`, \`"enum"\`, \`"number"\`).
- \`allowedValues\`: Array<{ value: string, label?: string }> | null — Nur bei \`expectedType: "enum"\`: der vollständige Wertebereich. Steht der Bereich am Input, gilt er auch für die Bedingung, die er versorgt. Jeder Wert muss durch genau einen Ausgang abgedeckt sein.
- \`notes\`: string | null — Notizen oder Kommentare.
- \`expression\`: string | null — Nur bei \`action\`-Knoten: wie der Wert entsteht, als FEEL-Ausdruck (z. B. \`max(0, min(100, bewerteteQuote))\`). Die Namen darin sind \`technicalKey\`s der Map.
- \`externalCall\`: { system: string, operation?: string, kannScheitern: boolean } | null — Nur bei \`action\`-Knoten statt \`expression\`: der Wert kommt aus einem externen Aufruf (API, Konverter, Speicher). Nie zusammen mit \`expression\`.
- \`consequence\`: Object | null — Nur bei \`consequence\`-Knoten (siehe unten).
- \`outputs\`: Array<ExportEdge> — Ausgehende Verbindungen (siehe unten). Bei \`consequence-ref\` entfällt \`outputs\` (Endpunkt).
- \`refId\`: number (optional) — Nur bei \`consequence-ref\` und \`input-ref\`: ID des referenzierten Originalknotens.
- \`inputSource\`: Object | null — Nur bei Knoten mit Datenquelle (siehe unten).
- \`knowledgeSources\`: Array<KnowledgeSource> | null — Fachliche Quellen/Regelautoritäten. Jede Quelle: \`art\`, \`verbindlichkeit\`, \`referenz\` (menschenlesbares Zitat) und optional \`uri\` (auflösbarer Verweis, bei Gesetzen bevorzugt ein ELI), \`eid\` (Element innerhalb der Quelle), \`fassung\` und \`abgerufen\` (jeweils JJJJ-MM-TT).

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
  "expression": "0",
  "reference": "space_service.py: _has_access()"
}

\`expression\` ist optional und enthält als FEEL-Ausdruck, was der Endpunkt rechnet.
\`technical\` bleibt die Beschreibung für Menschen; beide stehen nebeneinander.
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
- \`input-ref\`-Knoten enthalten das Feld \`outputs\` mit ihrer ausgehenden Verbindung zur Condition.
- \`consequence-ref\`-Knoten haben keine \`outputs\` (Endpunkt).

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
      "allowedValues": null,
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
      "type": "decision",
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
