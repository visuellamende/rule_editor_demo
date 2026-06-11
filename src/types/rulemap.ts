import type { Node, Edge } from '@xyflow/react';
import type { RulemapCategory } from './nodes';

export interface RulemapMeta {
  id: string;
  name: string;
  description: string;
  category: RulemapCategory | null;
  created: string;
  modified: string;
}

export interface RulemapFile {
  version: string;
  meta: RulemapMeta;
  nodes: Node[];
  edges: Edge[];
}
