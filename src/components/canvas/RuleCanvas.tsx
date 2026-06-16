import { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  useNodesInitialized,
  type Connection,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { RuleNode } from './nodes/RuleNode';
import { LabeledEdge } from './edges/LabeledEdge';
import { CanvasHeader } from './CanvasHeader';
import { NodeTypeMenu } from './NodeTypeMenu';
import { EmptyState } from './EmptyState';
import { NoMapState } from './NoMapState';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { RuleNodeType, RuleNodeData } from '../../types/nodes';
import { useI18n } from '../../i18n';
import { getAutoLayout } from '../../utils/autoLayout';
import './RuleCanvas.css';

const nodeTypes = {
  ruleNode: RuleNode,
};

const edgeTypes = {
  labeled: LabeledEdge,
};

const defaultLabels: Record<RuleNodeType, string> = {
  decision: 'Neue Entscheidung',
  consequence: 'Neue Konsequenz',
  condition: 'Neue Bedingung',
  action: 'Neue Aktion',
  'consequence-ref': 'Referenz',
  'input-ref': 'Referenz',
  'input': 'Neuer Input',
};

let firstNodeCounter = 0;

export function RuleCanvas() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    setSelectedNodeId,
    setSelectedEdgeId,
    filePath,
    applyAutoLayout,
    getNextDisplayId,
  } = useCanvasStore();
  const { fitView, screenToFlowPosition } = useReactFlow();
  const { t } = useI18n();
  const [contextMenuPos, setContextMenuPos] = useState<{ top: number; left: number; flowX: number; flowY: number } | null>(null);

  const nodesInitialized = useNodesInitialized();
  const hasRunRef = useRef(false);
  const prevFilePathRef = useRef<string | null>(filePath);
  const [layoutReady, setLayoutReady] = useState(false);

  useEffect(() => {
    if (filePath !== prevFilePathRef.current) {
      prevFilePathRef.current = filePath;
      hasRunRef.current = false;
      setLayoutReady(false);
    }
  }, [filePath]);

  useEffect(() => {
    if (nodesInitialized && nodes.length > 0 && !hasRunRef.current) {
      hasRunRef.current = true;
      applyAutoLayout();
      requestAnimationFrame(() => {
        fitView({ padding: 0.3, duration: 0 });
        setLayoutReady(true);
      });
    }
  }, [nodesInitialized, nodes.length, filePath, applyAutoLayout, fitView]);

  const hasOpenMap = filePath !== null;

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));

      const hasRemovals = changes.some((c) => c.type === 'remove');
      if (hasRemovals) {
        setTimeout(() => {
          const { nodes: currentNodes, edges: currentEdges } = useCanvasStore.getState();
          if (currentNodes.length > 0) {
            const layouted = getAutoLayout(currentNodes, currentEdges);
            setNodes(layouted);
            fitView({ padding: 0.3, duration: 300 });
          }
        }, 50);
      }
    },
    [setNodes, fitView],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      const sourceType = (sourceNode?.data as unknown as RuleNodeData)?.nodeType;
      const targetType = (targetNode?.data as unknown as RuleNodeData)?.nodeType;

      const isInputEdge = sourceType === 'input' || sourceType === 'input-ref';

      if (isInputEdge) {
        if (targetType !== 'condition' && targetType !== 'decision') {
          return;
        }
      }

      const isDecisionOrCondition =
        sourceType === 'decision' ||
        sourceType === 'condition';

      const newEdge: Edge = {
        ...connection,
        type: isInputEdge ? 'default' : 'labeled',
        id: `e${connection.source}-${connection.target}-${Date.now()}`,
      };

      if (isInputEdge) {
        newEdge.style = { stroke: 'var(--color-node-input)', strokeWidth: 1.5 };
        newEdge.animated = false;
        newEdge.targetHandle = 'input-target';
      } else {
        newEdge.label = isDecisionOrCondition ? '' : undefined;
        newEdge.targetHandle = 'tree-target';
      }

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, nodes],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId],
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setSelectedEdgeId(edge.id);
    },
    [setSelectedEdgeId],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setContextMenuPos(null);
  }, [setSelectedNodeId, setSelectedEdgeId]);

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setContextMenuPos({
        top: event.clientY,
        left: event.clientX,
        flowX: position.x,
        flowY: position.y,
      });
    },
    [screenToFlowPosition]
  );

  const handleCreateFirst = (type: RuleNodeType) => {
    firstNodeCounter += 1;
    const newNode: Node = {
      id: `n${firstNodeCounter}`,
      type: 'ruleNode',
      position: { x: 100, y: 200 },
      data: {
        label: defaultLabels[type],
        nodeType: type,
        displayId: getNextDisplayId(),
      } satisfies RuleNodeData,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleAddNodeFromContext = (type: RuleNodeType) => {
    if (!contextMenuPos) return;
    const newNode: Node = {
      id: `n${Date.now()}`,
      type: 'ruleNode',
      position: { x: contextMenuPos.flowX, y: contextMenuPos.flowY },
      data: {
        label: defaultLabels[type],
        nodeType: type,
        displayId: getNextDisplayId(),
      } satisfies RuleNodeData,
    };
    setNodes((nds) => [...nds, newNode]);
    setContextMenuPos(null);
  };

  const handleAutoLayout = useCallback(() => {
    applyAutoLayout();
    setTimeout(() => {
      fitView({ padding: 0.3, duration: 300 });
    }, 50);
  }, [applyAutoLayout, fitView]);

  return (
    <div className="rule-canvas">
      {hasOpenMap && <CanvasHeader />}
      <div className="rule-canvas__flow" style={{ position: 'relative' }}>
        {!hasOpenMap ? (
          <NoMapState />
        ) : nodes.length === 0 ? (
          <EmptyState onCreateFirst={handleCreateFirst} />
        ) : (
          <>
            <ReactFlow
              className={!layoutReady ? 'react-flow--initializing' : ''}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              onPaneContextMenu={onPaneContextMenu}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              proOptions={{ hideAttribution: true }}
              panOnScroll
              zoomOnScroll={false}
              zoomOnPinch
              selectionOnDrag
              deleteKeyCode={['Backspace', 'Delete']}
              defaultEdgeOptions={{
                type: 'labeled',
                animated: false,
                style: { strokeWidth: 1.5 },
              }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                className="rule-canvas__background"
              />
              <Controls
                className="rule-canvas__controls"
                showInteractive={false}
              />
            </ReactFlow>
            <div className="rule-canvas__auto-layout">
              <button
                className="rule-canvas__auto-layout-button"
                onClick={handleAutoLayout}
                title={t('canvas.autoLayout')}
                aria-label={t('canvas.autoLayout')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
            </div>
            {contextMenuPos && (
              <NodeTypeMenu
                position={{ top: contextMenuPos.top, left: contextMenuPos.left }}
                onClose={() => setContextMenuPos(null)}
                onSelect={handleAddNodeFromContext}
                allowInput
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
