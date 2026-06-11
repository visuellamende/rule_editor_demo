import { create } from 'zustand';
import { temporal } from 'zundo';
import type { Node, Edge } from '@xyflow/react';
import type { RulemapMeta, RulemapFile } from '../types/rulemap';
import { getAutoLayout } from '../utils/autoLayout';

interface CanvasStore {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  mapMeta: RulemapMeta;
  filePath: string | null;
  isDirty: boolean;
  nextDisplayId: number;

  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;

  updateNodeData: (nodeId: string, data: Partial<Record<string, unknown>>) => void;
  updateEdgeData: (edgeId: string, data: Partial<Record<string, unknown>>) => void;
  updateMapMeta: (updates: Partial<RulemapMeta>) => void;

  setFilePath: (path: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
  loadFromFile: (data: RulemapFile, filePath: string) => void;
  toFileData: () => RulemapFile;
  addNodeWithLayout: (newNode: Node, newEdge: Edge) => void;
  applyAutoLayout: () => void;
  getNextDisplayId: () => number;
  resetCanvas: () => void;
}

export const useCanvasStore = create<CanvasStore>()(
  temporal(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      mapMeta: {
        id: 'new-map',
        name: '',
        description: '',
        category: null,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      },
      filePath: null,
      isDirty: false,
      nextDisplayId: 1,

      setNodes: (nodesOrFn) =>
        set((state) => ({
          nodes: typeof nodesOrFn === 'function' ? nodesOrFn(state.nodes) : nodesOrFn,
          isDirty: true,
        })),

      setEdges: (edgesOrFn) =>
        set((state) => ({
          edges: typeof edgesOrFn === 'function' ? edgesOrFn(state.edges) : edgesOrFn,
          isDirty: true,
        })),

      setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
      setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

      updateNodeData: (nodeId, newData) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...newData } }
              : node,
          ),
          isDirty: true,
        })),

      updateEdgeData: (edgeId, newData) =>
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === edgeId
              ? {
                  ...edge,
                  data: { ...edge.data, ...newData },
                  label: typeof newData.label === 'string' ? newData.label : (edge.label as string | undefined),
                }
              : edge,
          ),
          isDirty: true,
        })),

      updateMapMeta: (updates) =>
        set((state) => ({
          mapMeta: {
            ...state.mapMeta,
            ...updates,
            modified: new Date().toISOString(),
          },
          isDirty: true,
        })),

      setFilePath: (path) => set({ filePath: path }),
      markDirty: () => set({ isDirty: true }),
      markClean: () => set({ isDirty: false }),

      loadFromFile: (data, filePath) => {
        // 1. Finde das Maximum aller bereits existierenden displayIds
        let maxId = 0;
        data.nodes.forEach((n) => {
          const existingId = (n.data as any)?.displayId;
          if (existingId !== undefined && typeof existingId === 'number') {
            maxId = Math.max(maxId, existingId);
          }
        });

        // 2. Weise fehlende IDs zu, beginnend ab maxId + 1
        let idCounter = maxId;
        const nodesWithIds = data.nodes.map((n) => {
          const existingId = (n.data as any)?.displayId;
          if (existingId !== undefined && typeof existingId === 'number') {
            return n;
          }
          idCounter += 1;
          return {
            ...n,
            data: {
              ...n.data,
              displayId: idCounter,
            },
          };
        });

        set({
          nodes: nodesWithIds.map((n) => ({
            ...n,
            type: n.type ?? 'ruleNode',
          })),
          edges: data.edges.map((e) => ({
            ...e,
            type: e.type ?? 'labeled',
          })),
          mapMeta: data.meta,
          filePath,
          isDirty: false,
          selectedNodeId: null,
          selectedEdgeId: null,
          nextDisplayId: idCounter + 1,
        });
      },

      toFileData: () => {
        const { nodes, edges, mapMeta } = get();
        return {
          version: '1.0.0',
          meta: mapMeta,
          nodes,
          edges,
        };
      },

      addNodeWithLayout: (newNode, newEdge) => {
        set((state) => {
          const updatedNodes = [...state.nodes, newNode];
          const updatedEdges = [...state.edges, newEdge];
          const layoutedNodes = getAutoLayout(updatedNodes, updatedEdges);
          return {
            nodes: layoutedNodes,
            edges: updatedEdges,
            isDirty: true,
          };
        });
      },

      applyAutoLayout: () => {
        set((state) => {
          const layoutedNodes = getAutoLayout(state.nodes, state.edges);
          return {
            nodes: layoutedNodes,
            isDirty: true,
          };
        });
      },

      getNextDisplayId: () => {
        const current = get().nextDisplayId;
        set({ nextDisplayId: current + 1 });
        return current;
      },

      resetCanvas: () => set({
        nodes: [],
        edges: [],
        mapMeta: {
          id: '',
          name: '',
          description: '',
          category: null,
          created: '',
          modified: '',
        },
        filePath: null,
        isDirty: false,
        selectedNodeId: null,
        selectedEdgeId: null,
      }),
    }),
    {
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        mapMeta: state.mapMeta,
      }),
      limit: 50,
      handleSet: (handleSet) => {
        return (state) => {
          const timeout = setTimeout(() => handleSet(state), 500);
          return () => clearTimeout(timeout);
        };
      },
    }
  )
);

