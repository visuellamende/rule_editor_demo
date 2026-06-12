import { useState, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import { NodeTypeMenu } from '../NodeTypeMenu';
import type { RuleNodeData, RuleNodeType } from '../../../types/nodes';
import { useI18n, type TranslationKey } from '../../../i18n';
import { useCanvasStore } from '../../../store/useCanvasStore';
import './RuleNode.css';

// Icons (gleich wie bisher)
function DecisionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.5" /><path d="m19 3-7 7-7-7" />
    </svg>
  );
}

function ConsequenceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ConditionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 12l10 10 10-10z" />
    </svg>
  );
}

function ActionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

const iconMap = {
  decision: DecisionIcon,
  consequence: ConsequenceIcon,
  condition: ConditionIcon,
  action: ActionIcon,
};

let nodeIdCounter = 100;
function getNextNodeId(): string {
  nodeIdCounter += 1;
  return `n${nodeIdCounter}`;
}

let edgeIdCounter = 100;
function getNextEdgeId(): string {
  edgeIdCounter += 1;
  return `e${edgeIdCounter}`;
}

export function RuleNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as RuleNodeData;

  // Referenz-Knoten: kompakte Darstellung
  if (nodeData.nodeType === 'consequence-ref') {
    const refId = nodeData.refNodeId;

    return (
      <div className={`rule-node rule-node--consequence-ref ${selected ? 'rule-node--selected' : ''}`}>
        <Handle type="target" position={Position.Left} className="rule-node__handle" />
        <div className="rule-node__ref-body">
          <svg className="rule-node__ref-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span className="rule-node__ref-label">
            {nodeData.label}
          </span>
          <span className="rule-node__ref-id">→ #{refId}</span>
        </div>
        {/* Kein Source-Handle — Endpunkt */}
      </div>
    );
  }

  const Icon = iconMap[nodeData.nodeType as keyof typeof iconMap];
  const [menuOpen, setMenuOpen] = useState(false);
  const { nodes, updateNodeData, addNodeWithLayout, getNextDisplayId } = useCanvasStore();
  const { fitView } = useReactFlow();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const { t } = useI18n();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(nodeData.label);
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEditConfirm = () => {
    if (editValue.trim()) {
      updateNodeData(id, { label: editValue.trim() });
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditConfirm();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleAddNode = (type: RuleNodeType) => {
    const currentNode = nodes.find((n) => n.id === id);
    if (!currentNode) return;

    const newNodeId = getNextNodeId();
    const newEdgeId = getNextEdgeId();

    // Die genaue Position wird vom Layout-Algorithmus berechnet,
    // wir können aber eine initiale Dummy-Position angeben.
    const newNode: Node = {
      id: newNodeId,
      type: 'ruleNode',
      position: {
        x: currentNode.position.x + 350,
        y: currentNode.position.y,
      },
      data: {
        label: t(`nodeLabel.${type}` as TranslationKey),
        nodeType: type,
        displayId: getNextDisplayId(),
      } satisfies RuleNodeData,
    };

    // Automatische Verbindung
    const isDecisionOrCondition =
      nodeData.nodeType === 'decision' ||
      nodeData.nodeType === 'condition';

    const newEdge = {
      id: newEdgeId,
      source: id,
      target: newNodeId,
      type: 'labeled',
      label: isDecisionOrCondition ? '' : undefined,
    };

    addNodeWithLayout(newNode, newEdge);
    setMenuOpen(false);

    // Zoom/Fit after layout has run
    setTimeout(() => {
      fitView({ padding: 0.3, duration: 300 });
    }, 50);
  };

  const handleAddRefNode = (refNodeId: number, label: string) => {
    const currentNode = nodes.find((n) => n.id === id);
    if (!currentNode) return;

    const newNodeId = getNextNodeId();
    const newEdgeId = getNextEdgeId();

    const newNode: Node = {
      id: newNodeId,
      type: 'ruleNode',
      position: {
        x: currentNode.position.x + 350,
        y: currentNode.position.y,
      },
      data: {
        label,
        nodeType: 'consequence-ref',
        displayId: getNextDisplayId(),
        refNodeId,
      } satisfies RuleNodeData,
    };

    const isDecisionOrCondition =
      nodeData.nodeType === 'decision' ||
      nodeData.nodeType === 'condition';

    const newEdge = {
      id: newEdgeId,
      source: id,
      target: newNodeId,
      type: 'labeled',
      label: isDecisionOrCondition ? '' : undefined,
    };

    addNodeWithLayout(newNode, newEdge);
    setMenuOpen(false);

    setTimeout(() => {
      fitView({ padding: 0.3, duration: 300 });
    }, 50);
  };

  return (
    <div
      className={`rule-node rule-node--${nodeData.nodeType} ${selected ? 'rule-node--selected' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="rule-node__handle"
      />

      <div className="rule-node__header">
        <span className="rule-node__icon">
          <Icon />
        </span>
        <span className="rule-node__type-label">
          {t(`nodeType.${nodeData.nodeType}` as TranslationKey)}
        </span>
        <span className="rule-node__display-id">#{nodeData.displayId}</span>
      </div>

      <div className="rule-node__body" onDoubleClick={handleDoubleClick}>
        {isEditing ? (
          <textarea
            ref={inputRef}
            className="rule-node__edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditConfirm}
            onKeyDown={handleEditKeyDown}
            rows={2}
          />
        ) : (
          <span className="rule-node__label">{nodeData.label}</span>
        )}
      </div>

      {/* Source-Handle mit Plus-Button — nicht bei Consequence */}
      {nodeData.nodeType !== 'consequence' && (
        <div className="rule-node__source-area">
          <Handle
            type="source"
            position={Position.Right}
            className="rule-node__handle"
          />
          <button
            ref={addButtonRef}
            className="rule-node__add-button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label={t('node.addButton.ariaLabel')}
            title={t('node.addButton.title')}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          {menuOpen && (
            <NodeTypeMenu
              anchorRef={addButtonRef}
              onSelect={handleAddNode}
              onSelectRef={handleAddRefNode}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
