/**
 * Represents the source of input that can be a string, URL, Document, or Element.
 */
export type InputSource = string | URL | Document | Element;

/**
 * Options for configuring the DOM hashing algorithm.
 */
export interface DomHashOptions {
  /**
   * The hashing algorithm to use. Can be one of:
   * - 'sha256': A cryptographic hash function.
   * - 'murmur3': A non-cryptographic hash function known for its speed and quality.
   * - 'blake3': A high-speed hash function with strong security.
   * - 'simhash': Used for similarity detection in large datasets.
   * - 'minhash': Effective for estimating the similarity between sets.
   */
  algorithm?: 'sha256' | 'murmur3' | 'blake3' | 'simhash' | 'minhash';

  /**
   * Specifies an array of attribute names to include in the hash computation.
   */
  includeAttributes?: string[];

  /**
   * If true, includes data-* and aria-* attributes in the hash computation.
   */
  includeDataAndAriaAttributes?: boolean;

  /**
   * If true, enables shape vector computation for the DOM structure.
   */
  shapeVector?: boolean;

  /**
   * If true, takes layout into account when computing the hash.
   */
  layoutAware?: boolean;

  /**
   * If true, enables resilience features in the hashing process.
   */
  resilience?: boolean;
  corsProxy?: string;
}

/**
 * The result of hashing a DOM structure.
 */
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
  structuralScore?: number;
  structuralBreakdown?: any;
  structuralLabel?: string;
  structuralEmoji?: string;
  structureTree?: any;
}

export interface StructureNode {
  tag: string;
  attributes: string[];
  children: StructureNode[];
}