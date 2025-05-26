export type InputSource = string | URL | Document | Element;

export interface DomHashOptions {
  algorithm?: 'sha256' | 'murmur3' | 'blake3' | 'simhash' | 'minhash';
  includeAttributes?: string[];
  includeDataAndAriaAttributes?: boolean;
  shapeVector?: boolean;
  layoutAware?: boolean;
  resilience?: boolean;
}

export interface DomHashResult {
  hash: string;
  shape?: string[];
  stats: {
    tagCount: number;
    depth: number;
  };
  canonical: string;
  layoutHash?: string;
  layoutCanonical?: string;
  layoutShape?: string[];
  resilienceScore?: number;
  resilienceBreakdown?: any;
  resilienceLabel?: string;
  resilienceEmoji?: string;
}

export interface StructureNode {
  tag: string;
  attributes: string[];
  children: StructureNode[];
}