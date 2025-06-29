/**
 * Represents the source of input that can be a string, URL, Document, or Element.
 */
export type InputSource = string | URL | Document | Element;

/**
 * Represents the options available for configuring a DOM hashing operation. 
 * The `DomHashOptions` interface allows users to customize the behavior of 
 * the hashing process, including the choice of algorithm, attributes to 
 * include, and various flags that influence how the DOM is processed.
 *
 * @interface DomHashOptions
 * @property {'sha256' | 'murmur3' | 'blake3' | 'simhash' | 'minhash'} [algorithm] - 
 *          An optional string specifying the hashing algorithm to be used. 
 *          Supported algorithms include:
 *          - `'sha256'`: A widely-used cryptographic hash function.
 *          - `'murmur3'`: A non-cryptographic hash function known for its speed.
 *          - `'blake3'`: A fast cryptographic hash function designed for performance.
 *          - `'simhash'`: An algorithm for similarity hashing used in machine learning.
 *          - `'minhash'`: An algorithm used for estimating the similarity between datasets.
 * @property {string[]} [includeAttributes] - An optional array of strings 
 *                                             specifying which attributes should 
 *                                             be included in the hash calculation. 
 *                                             This allows for fine-tuning of the 
 *                                             hashed output based on specific 
 *                                             attributes of interest.
 * @property {boolean} [includeDataAndAriaAttributes] - An optional boolean flag 
 *                                                    indicating whether to include 
 *                                                    data-* and ARIA attributes in 
 *                                                    the hashing process. If set to 
 *                                                    true, these attributes will be 
 *                                                    considered in the hash.
 * @property {boolean} [shapeVector] - An optional boolean flag that determines 
 *                                      whether to generate a shape vector for 
 *                                      the DOM structure. When true, the shape 
 *                                      of the DOM will be represented as a 
 *                                      vector, which may help in analyzing the 
 *                                      layout or arrangement of elements.
 * @property {boolean} [layoutAware] - An optional boolean flag indicating if 
 *                                      the hashing operation should consider 
 *                                      layout information. If true, the hash 
 *                                      will reflect changes in layout, which 
 *                                      can be significant for responsive designs.
 * @property {boolean} [resilience] - An optional boolean flag that indicates 
 *                                     whether to evaluate and include resilience 
 *                                     metrics in the hash result. Setting this 
 *                                     to true will incorporate aspects of 
 *                                     structural integrity into the hashing 
 *                                     process.
 * @property {string} [corsProxy] - An optional string specifying a CORS proxy 
 *                                   URL to be used when fetching external resources 
 *                                   (e.g., stylesheets, scripts) during the hashing 
 *                                   process. This is useful for handling cross-origin 
 *                                   requests and ensuring that all necessary resources 
 *                                   are accessible.
 */
export interface DomHashOptions {
  algorithm?: 'sha256' | 'murmur3' | 'blake3' | 'simhash' | 'minhash';
  includeAttributes?: string[];
  includeDataAndAriaAttributes?: boolean;
  shapeVector?: boolean;
  layoutAware?: boolean;
  resilience?: boolean;
  /**
   * Optional CORS proxy URL prefix to prepend when fetching external resources.
   */
  corsProxy?: string;
  /**
   * Use an existing Chrome instance via Puppeteer.
   */
  usePuppeteer?: boolean;
  /**
   * Options for connecting Puppeteer to a remote browser.
   * Either browserWSEndpoint or browserURL can be provided.
   */
  puppeteerConnect?: {
    browserWSEndpoint?: string;
    browserURL?: string;
  };
}

/**
 * Represents the result of a DOM hashing operation, encapsulating various 
 * properties that describe the structure and characteristics of the 
 * Document Object Model (DOM) tree.
 *
 * The `DomHashResult` interface provides detailed information about the 
 * hash of the DOM, its shape, statistics, and various resilience and 
 * structural scores. This is useful for analyzing and comparing different 
 * DOM structures in applications such as web performance analysis, 
 * optimization, or validation.
 *
 * @interface DomHashResult
 * @property {string} hash - A unique string representing the hash of the 
 *                           DOM structure. This can be used to identify 
 *                           or compare different DOM trees.
 * @property {string[]} [shape] - An optional array of strings representing 
 *                                 the shape of the DOM. This may include 
 *                                 specific patterns or arrangements of 
 *                                 elements within the DOM.
 * @property {Object} stats - An object containing statistical information 
 *                            about the DOM structure.
 * @property {number} stats.tagCount - The total number of unique HTML tags 
 *                                      present in the DOM.
 * @property {number} stats.depth - The maximum depth of nested elements 
 *                                  within the DOM structure.
 * @property {string} canonical - A canonical representation of the DOM, 
 *                                which may serve as a standardized format 
 *                                for comparison or storage.
 * @property {string} [layoutHash] - An optional hash value representing 
 *                                    the layout of the DOM. This can be 
 *                                    used to track changes in layout over time.
 * @property {string} [layoutCanonical] - An optional canonical representation 
 *                                        of the layout, similar to the 
 *                                        canonical property but focused on 
 *                                        layout aspects.
 * @property {string[]} [layoutShape] - An optional array representing the 
 *                                       shape of the layout, detailing 
 *                                       how elements are arranged visually.
 * @property {number} [resilienceScore] - An optional score indicating the 
 *                                         resilience of the DOM structure 
 *                                         against potential disruptions or 
 *                                         changes.
 * @property {any} [resilienceBreakdown] - An optional breakdown of factors 
 *                                          contributing to the resilience score, 
 *                                          providing insights into the 
 *                                          structural integrity of the DOM.
 * @property {string} [resilienceLabel] - An optional label describing the 
 *                                         resilience level (e.g., "High", 
 *                                         "Medium", "Low").
 * @property {string} [resilienceEmoji] - An optional emoji representing the 
 *                                         resilience level visually.
 * @property {number} [structuralScore] - An optional score reflecting the 
 *                                         overall structural quality of the 
 *                                         DOM, potentially based on best practices 
 *                                         or standards.
 * @property {any} [structuralBreakdown] - An optional breakdown of components 
 *                                          contributing to the structural score, 
 *                                          offering detailed insights into 
 *                                          potential weaknesses or strengths.
 * @property {string} [structuralLabel] - An optional label that categorizes 
 *                                         the structural quality (e.g., "Good", 
 *                                         "Needs Improvement").
 * @property {string} [structuralEmoji] - An optional emoji symbolizing the 
 *                                         structural quality.
 * @property {any} [structureTree] - An optional representation of the 
 *                                   hierarchical structure of the DOM, which 
 *                                   may provide a visual or programmatic 
 *                                   depiction of the nodes and their relationships.
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

/**
 * Represents a node in a structure, such as a document or a tree-like hierarchy.
 *
 * The `StructureNode` interface defines the properties of a node that can 
 * contain information about its associated HTML tag, attributes, and child 
 * nodes. This is particularly useful for building or manipulating 
 * hierarchical data structures in applications like parsers, renderers, 
 * or UI component trees.
 *
 * @interface StructureNode
 * @property {string} tag - The HTML tag associated with this node (e.g., 'div', 
 *                          'p', 'ul'). This denotes the type of element 
 *                          represented by the node.
 * @property {string[]} attributes - An array of strings representing the 
 *                                   attributes of the node. Each string should 
 *                                   be formatted as "key=value" to define 
 *                                   the node's attributes (e.g., ['class=my-class', 
 *                                   'id=my-id']).
 * @property {StructureNode[]} children - An array of `StructureNode` objects 
 *                                        representing the child nodes of this 
 *                                        node. This allows for nested structures 
 *                                        where each node can have its own set 
 *                                        of attributes and children.
 */
// Removed unused StructureNode interface (no longer used in API)