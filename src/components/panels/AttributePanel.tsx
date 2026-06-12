import { useCanvasStore } from '../../store/useCanvasStore';
import { useI18n } from '../../i18n';
import { CustomSelect } from '../primitives/CustomSelect';
import { MapInfoPanel } from './MapInfoPanel';
import { EdgeLabelSuggestions } from './EdgeLabelSuggestions';
import type { RuleNodeData, RuleNodeType, ConsequenceData } from '../../types/nodes';
import './AttributePanel.css';

const nodeTypeOptions = [
  { value: 'decision', label: 'Decision' },
  { value: 'condition', label: 'Condition' },
  { value: 'action', label: 'Action' },
  { value: 'consequence', label: 'Consequence' },
];

export function AttributePanel() {
  const { t } = useI18n();
  const {
    selectedNodeId,
    selectedEdgeId,
    nodes,
    edges,
    updateNodeData,
    updateEdgeData,
    filePath,
  } = useCanvasStore();

  const hasOpenMap = filePath !== null;

  if (!hasOpenMap) {
    return (
      <div className="attribute-panel">
        <div className="attribute-panel__empty">
          <p className="attribute-panel__empty-hint">{t('panel.noMap')}</p>
        </div>
      </div>
    );
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const nodeData = selectedNode?.data as RuleNodeData | undefined;
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  if (selectedEdge) {
    const sourceNode = nodes.find((n) => n.id === selectedEdge.source);
    const sourceType = (sourceNode?.data as RuleNodeData | undefined)?.nodeType ?? 'decision';

    return (
      <div className="attribute-panel">
        <div className="attribute-panel__header">
          <h3 className="attribute-panel__title">{t('edge.label')}</h3>
        </div>
        <div className="attribute-panel__body">
          <EdgeLabelSuggestions
            sourceNodeType={sourceType}
            sourceNodeId={selectedEdge.source}
            currentEdgeId={selectedEdge.id}
            edges={edges}
            onSelect={(label) => updateEdgeData(selectedEdge.id, { label })}
          />
          <div className="attribute-panel__field">
            <label className="attribute-panel__label">{t('edge.label')}</label>
            <input
              className="attribute-panel__input"
              type="text"
              value={(selectedEdge.label as string) ?? ''}
              onChange={(e) => updateEdgeData(selectedEdge.id, { label: e.target.value })}
              placeholder={t('edge.label.placeholder')}
              autoFocus
            />
          </div>
          <div className="attribute-panel__field">
            <label className="attribute-panel__label">{t('edge.value')}</label>
            <input
              className="attribute-panel__input"
              type="text"
              value={(selectedEdge.data as any)?.value ?? ''}
              onChange={(e) => updateEdgeData(selectedEdge.id, { value: e.target.value })}
              placeholder={t('edge.value.placeholder')}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!selectedNode || !nodeData) {
    return (
      <div className="attribute-panel">
        <div className="attribute-panel__header">
          <h3 className="attribute-panel__title">{t('panel.generalTitle')}</h3>
        </div>
        <div className="attribute-panel__body">
          <MapInfoPanel />
        </div>
      </div>
    );
  }

  const handleTypeChange = (value: string) => {
    // When changing type, make sure we also update the node's other properties, or update nodeType in node data.
    // Also, React Flow node needs to keep its `data.nodeType` updated.
    updateNodeData(selectedNode.id, { nodeType: value as RuleNodeType });
  };

  const handleLabelChange = (value: string) => {
    updateNodeData(selectedNode.id, { label: value });
  };

  const handleNotesChange = (value: string) => {
    updateNodeData(selectedNode.id, { notes: value });
  };

  const handleConsequenceChange = (field: keyof ConsequenceData, value: string) => {
    const current = nodeData.consequence ?? { business: '' };
    updateNodeData(selectedNode.id, {
      consequence: { ...current, [field]: value },
    });
  };

  // Typ-Optionen mit i18n Labels
  const typeOptions = nodeTypeOptions.map((opt) => ({
    value: opt.value,
    label: t(`nodeType.${opt.value}` as any),
  }));

  return (
    <div className="attribute-panel">
      <div className="attribute-panel__header">
        <h3 className="attribute-panel__title">
          {t('panel.nodeTitle')} #{nodeData.displayId}
        </h3>
      </div>

      <div className="attribute-panel__body">
        {/* Typ */}
        <div className="attribute-panel__field">
          <label className="attribute-panel__label">{t('panel.nodeType')}</label>
          <CustomSelect
            options={typeOptions}
            value={nodeData.nodeType}
            onChange={handleTypeChange}
          />
        </div>

        {/* Label */}
        <div className="attribute-panel__field">
          <label className="attribute-panel__label">{t('panel.label')}</label>
          <textarea
            className="attribute-panel__textarea"
            value={nodeData.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder={t('panel.label.placeholder')}
            rows={2}
          />
        </div>

        {/* Technical Key & Expected Type for Condition and Decision nodes */}
        {(nodeData.nodeType === 'condition' || nodeData.nodeType === 'decision') && (
          <>
            <div className="attribute-panel__field">
              <label className="attribute-panel__label">{t('panel.technicalKey')}</label>
              <input
                className="attribute-panel__input"
                type="text"
                value={nodeData.technicalKey ?? ''}
                onChange={(e) => updateNodeData(selectedNode.id, { technicalKey: e.target.value })}
                placeholder={t('panel.technicalKey.placeholder')}
              />
            </div>
            <div className="attribute-panel__field">
              <label className="attribute-panel__label">{t('panel.expectedType')}</label>
              <input
                className="attribute-panel__input"
                type="text"
                value={nodeData.expectedType ?? ''}
                onChange={(e) => updateNodeData(selectedNode.id, { expectedType: e.target.value })}
                placeholder={t('panel.expectedType.placeholder')}
              />
            </div>
          </>
        )}

        {/* Konsequenz — nur bei Consequence-Knoten */}
        {nodeData.nodeType === 'consequence' && (
          <div className="attribute-panel__section">
            <h4 className="attribute-panel__section-title">{t('panel.consequence')}</h4>

            <div className="attribute-panel__field">
              <label className="attribute-panel__label">
                {t('panel.consequence.business')}
              </label>
              <textarea
                className="attribute-panel__textarea"
                value={nodeData.consequence?.business ?? ''}
                onChange={(e) => handleConsequenceChange('business', e.target.value)}
                placeholder={t('panel.consequence.business.placeholder')}
                rows={3}
              />
            </div>

            <div className="attribute-panel__field">
              <label className="attribute-panel__label">
                {t('panel.consequence.technical')}
              </label>
              <textarea
                className="attribute-panel__textarea"
                value={nodeData.consequence?.technical ?? ''}
                onChange={(e) => handleConsequenceChange('technical', e.target.value)}
                placeholder={t('panel.consequence.technical.placeholder')}
                rows={2}
              />
            </div>

            <div className="attribute-panel__field">
              <label className="attribute-panel__label">
                {t('panel.consequence.reference')}
              </label>
              <input
                className="attribute-panel__input"
                type="text"
                value={nodeData.consequence?.reference ?? ''}
                onChange={(e) => handleConsequenceChange('reference', e.target.value)}
                placeholder={t('panel.consequence.reference.placeholder')}
              />
            </div>
          </div>
        )}

        {/* Notizen */}
        <div className="attribute-panel__field">
          <label className="attribute-panel__label">{t('panel.notes')}</label>
          <textarea
            className="attribute-panel__textarea attribute-panel__textarea--tall"
            value={nodeData.notes ?? ''}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder={t('panel.notes.placeholder')}
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}
