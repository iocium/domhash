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
}

/**
 * The result of hashing a DOM structure.
 */
export interface DomHashResult {
  /**
   * The computed hash value as a string.
   */
  hash: string;

  /**
   * An optional representation of the shape of the DOM structure.
   */
  shape?: string[];

  /**
   * Statistics about the hashed DOM structure.
   */
  stats: {
    /**
     * The count of unique HTML tags within the DOM structure.
     */
    tagCount: number;

    /**
     * The depth of the DOM tree.
     */
    depth: number;
  };

  /**
   * A canonical representation of the DOM structure.
   */
  canonical: string;

  /**
   * An optional layout hash if layout-aware hashing is enabled.
   */
  layoutHash?: string;

  /**
   * An optional canonical representation of the layout.
   */
  layoutCanonical?: string;

  /**
   * An optional representation of the layout shape.
   */
  layoutShape?: string[];

  /**
   * An optional score representing the resilience of the hash against changes.
   */
  resilienceScore?: number;

  /**
   * An optional breakdown of the resilience score.
   */
  resilienceBreakdown?: any;

  /**
   * An optional label describing the resilience level.
   */
  resilienceLabel?: string;

  /**
   * An optional emoji representing the resilience status.
   */
  resilienceEmoji?: string;
}

/**
 * Represents a node in the structure of a DOM element.
 */
export interface StructureNode {
  /**
   * The HTML tag name of the node.
   */
  tag: string;

  /**
   * An array of attribute names associated with the node.
   */
  attributes: string[];

  /**
   * An array of child nodes that are also StructureNode instances.
   */
  children: StructureNode[];
}