export type RulemapCategory = 'validation' | 'permission' | 'state' | 'business-logic' | 'error-handling';

export type RuleNodeType = 'decision' | 'consequence' | 'condition' | 'action' | 'consequence-ref';

export interface ConsequenceData {
  business: string;
  technical?: string;
  reference?: string;
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
}

