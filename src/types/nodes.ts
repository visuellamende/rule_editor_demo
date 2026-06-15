export type RulemapCategory = 'validation' | 'permission' | 'state' | 'business-logic' | 'error-handling';

export type RuleNodeType = 'decision' | 'consequence' | 'condition' | 'action' | 'consequence-ref' | 'input';

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

  // NEU — nur für input-Knoten:
  inputProvider?: 'system' | 'manuell' | 'komposition';
  inputProviderSubtype?: string | null;
  inputVerfuegbarkeit?: 'vorhanden' | 'laufzeit';
  inputKannScheitern?: boolean;
  inputReferenziertEntscheidung?: string | null;
}



