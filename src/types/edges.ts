export type EdgeType = 'branch' | 'default' | 'loop-back';

export interface RuleEdgeData {
  edgeType: EdgeType;
  label: string;
  value?: string;
}

