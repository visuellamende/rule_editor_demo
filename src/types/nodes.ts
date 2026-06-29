export type RulemapCategory = 'validation' | 'permission' | 'state' | 'business-logic' | 'error-handling';

export type RuleNodeType = 'decision' | 'consequence' | 'condition' | 'action' | 'consequence-ref' | 'input' | 'input-ref';

export interface ConsequenceData {
  business: string;
  technical?: string;
  reference?: string;
}

export interface KnowledgeSource {
  id: string;                        // Eindeutige ID (crypto.randomUUID().slice(0, 8))
  art: 'gesetz' | 'norm_standard' | 'interne_richtlinie' | 'vertrag' | 'fachwissen';
  verbindlichkeit: 'verbindlich' | 'empfohlen' | 'optional';
  referenz: string;                  // Auflösbarer Verweis (§, Dokument-ID, Link)
  eigner: string | null;            // Zuständige Stelle
  beschreibung: string | null;      // Kurzbeschreibung
}

export interface GoldenExample {
  id: string;                          // crypto.randomUUID().slice(0, 8)
  name: string;                        // Kurzbeschreibung, z.B. "Gast ohne Mitgliedschaft"
  inputs: Record<string, string>;      // technicalKey → Wert, z.B. { "memberRole": "GUEST", "isInMemberList": "false" }
  expectedResult: string;              // Fachliches Ergebnis, z.B. "Zugriff verweigert"
  notes?: string;                      // Optionale Erklärung warum dieser Fall wichtig ist
}

export interface RuleNodeData {
  label: string;
  nodeType: RuleNodeType;
  displayId: number;        // NEU: sichtbare ID (1, 2, 3, ...)
  consequence?: ConsequenceData;
  notes?: string;
  tags?: string[];
  technicalKey?: string;
  expectedType?: string;
  refNodeId?: number;       // NEU: ID des referenzierten Consequence-Knotens
  knowledgeSources?: KnowledgeSource[];   // NEU
  examples?: GoldenExample[];          // NEU — nur bei consequence-Knoten

  // NEU — nur für input-Knoten:
  inputProvider?: 'system' | 'manuell' | 'komposition';
  inputProviderSubtype?: string | null;
  inputVerfuegbarkeit?: 'vorhanden' | 'laufzeit';
  inputKannScheitern?: boolean;
  inputReferenziertEntscheidung?: string | null;
}




