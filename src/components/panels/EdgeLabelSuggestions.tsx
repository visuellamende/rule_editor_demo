import { useI18n } from '../../i18n';
import type { TranslationKey } from '../../i18n/de';
import type { RuleNodeType } from '../../types/nodes';
import type { Edge } from '@xyflow/react';
import './EdgeLabelSuggestions.css';

interface EdgeLabelSuggestionsProps {
  sourceNodeType: RuleNodeType;
  sourceNodeId: string;
  currentEdgeId: string;
  edges: Edge[];
  onSelect: (label: string) => void;
}

// Gegenstück-Paare
const counterparts: Record<string, string> = {
  'Ja': 'Nein', 'Nein': 'Ja',
  'Wahr': 'Falsch', 'Falsch': 'Wahr',
  'Erlaubt': 'Verweigert', 'Verweigert': 'Erlaubt',
  'Erfolg': 'Fehler', 'Fehler': 'Erfolg',
  'Yes': 'No', 'No': 'Yes',
  'True': 'False', 'False': 'True',
  'Allowed': 'Denied', 'Denied': 'Allowed',
  'Success': 'Error', 'Error': 'Success',
};

const suggestions: Record<RuleNodeType, TranslationKey[][]> = {
  decision: [
    ['edge.suggestion.yes', 'edge.suggestion.no'],
    ['edge.suggestion.true', 'edge.suggestion.false'],
    ['edge.suggestion.allowed', 'edge.suggestion.denied'],
  ],
  condition: [
    ['edge.suggestion.yes', 'edge.suggestion.no'],
    ['edge.suggestion.true', 'edge.suggestion.false'],
  ],
  action: [
    ['edge.suggestion.success', 'edge.suggestion.error'],
    ['edge.suggestion.timeout'],
    ['edge.suggestion.then'],
  ],
  consequence: [],
  'consequence-ref': [],
  'input-ref': [],
  input: [],
};

export function EdgeLabelSuggestions({
  sourceNodeType,
  sourceNodeId,
  currentEdgeId,
  edges,
  onSelect,
}: EdgeLabelSuggestionsProps) {
  const { t } = useI18n();
  const pairs = suggestions[sourceNodeType];
  if (!pairs || pairs.length === 0) return null;

  // Labels der Geschwister-Edges (andere Edges vom selben Quellknoten)
  const siblingLabels = edges
    .filter((e) => e.source === sourceNodeId && e.id !== currentEdgeId)
    .map((e) => (e.label as string) || '')
    .filter(Boolean);

  // Smarter Vorschlag: Gegenstück der bestehenden Geschwister-Labels
  const smartSuggestion = siblingLabels
    .map((label) => counterparts[label])
    .find(Boolean);

  return (
    <div className="edge-label-suggestions">
      {/* Smarter Vorschlag zuerst, hervorgehoben */}
      {smartSuggestion && (
        <div className="edge-label-suggestions__group">
          <button
            className="edge-label-suggestions__chip edge-label-suggestions__chip--recommended"
            onClick={() => onSelect(smartSuggestion)}
            type="button"
          >
            {smartSuggestion}
          </button>
        </div>
      )}

      {/* Restliche Vorschläge */}
      {pairs.map((group, i) => (
        <div key={i} className="edge-label-suggestions__group">
          {group.map((key) => {
            const label = t(key);
            return (
              <button
                key={key}
                className="edge-label-suggestions__chip"
                onClick={() => onSelect(label)}
                type="button"
              >
                {label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
