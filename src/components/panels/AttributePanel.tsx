import { useCanvasStore } from '../../store/useCanvasStore';
import { useI18n } from '../../i18n';
import { CustomSelect } from '../primitives/CustomSelect';
import { MapInfoPanel } from './MapInfoPanel';
import { EdgeLabelSuggestions } from './EdgeLabelSuggestions';
import type { RuleNodeData, RuleNodeType, ConsequenceData } from '../../types/nodes';
import { useReactFlow } from '@xyflow/react';
import './AttributePanel.css';

export function AttributePanel() {
  const { t } = useI18n();
  const { fitView } = useReactFlow();
  const {
    selectedNodeId,
    selectedEdgeId,
    nodes,
    edges,
    updateNodeData,
    updateEdgeData,
    filePath,
    setSelectedNodeId,
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
  const nodeData = selectedNode?.data as unknown as RuleNodeData | undefined;
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  if (selectedEdge) {
    const sourceNode = nodes.find((n) => n.id === selectedEdge.source);
    const sourceType = (sourceNode?.data as unknown as RuleNodeData | undefined)?.nodeType ?? 'decision';

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
    const nextType = value as RuleNodeType;
    const updates: Partial<RuleNodeData> = { nodeType: nextType };

    if (nextType === 'consequence-ref') {
      const firstConsequence = nodes.find(
        (n) => (n.data as unknown as RuleNodeData).nodeType === 'consequence'
      );
      if (firstConsequence) {
        updates.refNodeId = (firstConsequence.data as unknown as RuleNodeData).displayId;
        updates.label = (firstConsequence.data as unknown as RuleNodeData).label;
      }
    } else if (nodeData.nodeType === 'consequence-ref') {
      updates.refNodeId = undefined;
    }

    updateNodeData(selectedNode.id, updates);
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
  const typeOptions = [
    { value: 'decision', label: t('nodeType.decision') },
    { value: 'condition', label: t('nodeType.condition') },
    { value: 'action', label: t('nodeType.action') },
    { value: 'consequence', label: t('nodeType.consequence') },
  ];

  if (nodeData.nodeType === 'consequence-ref' || nodes.some((n) => (n.data as unknown as RuleNodeData).nodeType === 'consequence')) {
    typeOptions.push({ value: 'consequence-ref', label: t('nodeType.consequenceRef') });
  }

  if (nodeData.nodeType === 'consequence-ref') {
    const refNode = nodes.find(
      (n) => (n.data as unknown as RuleNodeData).nodeType === 'consequence' && (n.data as unknown as RuleNodeData).displayId === nodeData.refNodeId
    );
    const refData = refNode?.data as unknown as RuleNodeData | undefined;

    const selectAndFocusNode = (targetNodeId: string | undefined) => {
      if (!targetNodeId) return;
      setSelectedNodeId(targetNodeId);
      setTimeout(() => {
        fitView({ nodes: [{ id: targetNodeId }], duration: 300 });
      }, 50);
    };

    const otherConsequences = nodes
      .filter((n) => (n.data as unknown as RuleNodeData).nodeType === 'consequence')
      .map((n) => ({
        value: String((n.data as unknown as RuleNodeData).displayId),
        label: `#${(n.data as unknown as RuleNodeData).displayId} ${(n.data as unknown as RuleNodeData).label}`,
      }));

    return (
      <div className="attribute-panel">
        <div className="attribute-panel__header">
          <h3 className="attribute-panel__title">
            {t('panel.refTitle')} #{nodeData.displayId}
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

          {/* Referenzierter Knoten */}
          <div className="attribute-panel__field">
            <label className="attribute-panel__label">{t('panel.refTarget')}</label>
            <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <CustomSelect
                  options={otherConsequences}
                  value={String(nodeData.refNodeId ?? '')}
                  onChange={(val) => {
                    const targetDisplayId = Number(val);
                    const targetNode = nodes.find(
                      (n) => (n.data as unknown as RuleNodeData).nodeType === 'consequence' && (n.data as unknown as RuleNodeData).displayId === targetDisplayId
                    );
                    if (targetNode) {
                      updateNodeData(selectedNode.id, {
                        refNodeId: targetDisplayId,
                        label: (targetNode.data as unknown as RuleNodeData).label,
                      });
                    }
                  }}
                />
              </div>
              <button
                className="attribute-panel__ref-goto"
                onClick={() => selectAndFocusNode(refNode?.id)}
                disabled={!refNode}
                style={{
                  padding: 'var(--space-xs) var(--space-sm)',
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-xs)',
                  cursor: 'pointer',
                }}
              >
                {t('panel.refGoto')}
              </button>
            </div>
          </div>

          {/* Konsequenz-Details des Originals (read-only) */}
          {refData?.consequence && (
            <div className="attribute-panel__section" style={{ opacity: 0.8 }}>
              <h4 className="attribute-panel__section-title" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {t('panel.consequence')} ({t('nodeType.consequence')})
              </h4>
              <div style={{ padding: 'var(--space-xs)', backgroundColor: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)', marginTop: 'var(--space-xs)' }}>
                <p className="attribute-panel__readonly" style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>
                  <strong>{t('panel.consequence.business')}:</strong> {refData.consequence.business}
                </p>
                {refData.consequence.technical && (
                  <p className="attribute-panel__readonly-muted" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 'var(--space-xs) 0 0 0' }}>
                    <strong>{t('panel.consequence.technical')}:</strong> {refData.consequence.technical}
                  </p>
                )}
                {refData.consequence.reference && (
                  <p className="attribute-panel__readonly-muted" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 'var(--space-xs) 0 0 0' }}>
                    <strong>{t('panel.consequence.reference')}:</strong> {refData.consequence.reference}
                  </p>
                )}
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

            {/* Referenzierte Konsequenz (Optional) */}
            {nodes.some((n) => (n.data as unknown as RuleNodeData).nodeType === 'consequence' && n.id !== selectedNode.id) && (
              <div className="attribute-panel__field" style={{ marginBottom: 'var(--space-md)' }}>
                <label className="attribute-panel__label">{t('panel.refTarget')} (Optional)</label>
                <CustomSelect
                  options={[
                    { value: '', label: 'Keine' },
                    ...nodes
                      .filter((n) => (n.data as unknown as RuleNodeData).nodeType === 'consequence' && n.id !== selectedNode.id)
                      .map((n) => ({
                        value: String((n.data as unknown as RuleNodeData).displayId),
                        label: `#${(n.data as unknown as RuleNodeData).displayId} ${(n.data as unknown as RuleNodeData).label}`,
                      }))
                  ]}
                  value=""
                  onChange={(val) => {
                    if (val) {
                      const targetDisplayId = Number(val);
                      const targetNode = nodes.find(
                        (n) => (n.data as unknown as RuleNodeData).nodeType === 'consequence' && (n.data as unknown as RuleNodeData).displayId === targetDisplayId
                      );
                      if (targetNode) {
                        updateNodeData(selectedNode.id, {
                          nodeType: 'consequence-ref',
                          refNodeId: targetDisplayId,
                          label: (targetNode.data as unknown as RuleNodeData).label,
                          consequence: undefined,
                        });
                      }
                    }
                  }}
                />
              </div>
            )}

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
