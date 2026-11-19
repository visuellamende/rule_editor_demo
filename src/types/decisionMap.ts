import type { Node, Edge } from '@xyflow/react';
import type { DecisionMapCategory } from './nodes';

export interface DecisionMapMeta {
  id: string;
  name: string;
  description: string;
  category: DecisionMapCategory | null;
  created: string;
  modified: string;
}

export interface DecisionMapFile {
  version: string;
  meta: DecisionMapMeta;
  nodes: Node[];
  edges: Edge[];
}
