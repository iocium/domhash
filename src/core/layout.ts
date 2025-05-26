/**
 * Represents a feature of a layout in terms of its tag and display information.
 *
 * The `LayoutFeature` interface defines the structure for an object that 
 * encapsulates details about a specific feature within a layout. This can be 
 * useful for rendering or managing UI components where both the HTML tag 
 * and its corresponding display name are relevant.
 *
 * @interface LayoutFeature
 * @property {string} tag - The HTML tag associated with this layout feature. 
 *                          This could represent elements such as 'div', 'span', 
 *                          'header', etc.
 * @property {string} display - A human-readable representation of the tag, 
 *                              which may be used for display purposes in UI 
 *                              components or documentation.
 */
export interface LayoutFeature {
  tag: string;
  display: string;
}

/**
 * Extracts layout features from a given DOM element and its children.
 *
 * This function traverses the DOM tree starting from the specified root element 
 * and collects layout features of each element. The features include the tag name 
 * and the computed display property of the element. It handles different methods 
 * for retrieving computed styles based on browser compatibility.
 *
 * @param root - The root DOM element from which to start extracting layout 
 *               features. This should be a valid Element object.
 * @returns An array of `LayoutFeature` objects, each containing the following 
 *          properties:
 *          - `tag`: A string representing the lowercase tag name of the element.
 *          - `display`: A string representing the display style of the element 
 *            (e.g., 'block', 'inline', etc.). Defaults to 'block' if not found.
 *
 * @example
 * ```typescript
 * const rootElement = document.getElementById('my-root');
 * const layoutFeatures = extractLayoutFeatures(rootElement);
 * console.log(layoutFeatures); // Outputs an array of layout features
 * ```
 */
export function extractLayoutFeatures(root: Element): LayoutFeature[] {
  const features: LayoutFeature[] = [];

  function visit(el: Element): void {
    const tag = el.tagName.toLowerCase();
    let display = 'block';

    if (typeof globalThis.getComputedStyle === 'function') {
      try {
        display = getComputedStyle(el).display || 'block';
      } catch {}
    } else if ('getAttribute' in el && typeof el.getAttribute === 'function') {
      const inline = el.getAttribute('style') || '';
      const m = inline.match(/display\s*:\s*([^;]+)/);
      display = m ? m[1] : 'block';
    } else if ('display' in el) {
      display = (el as any).display || 'block';
    }

    features.push({ tag, display });
    for (const child of el.children) visit(child as Element);
  }

  visit(root);
  return features;
}

/**
 * Serializes an array of layout features into a string format.
 *
 * This function takes an array of `LayoutFeature` objects and converts it 
 * into a comma-separated string representation. Each layout feature is represented 
 * as a string in the format `tag:display`, where `tag` is the lowercase tag name 
 * of the element and `display` is its computed display style.
 *
 * @param layout - An array of `LayoutFeature` objects to be serialized. Each 
 *                 object should contain the following properties:
 *                 - `tag`: A string representing the lowercase tag name of the 
 *                   element.
 *                 - `display`: A string representing the display style of the 
 *                   element (e.g., 'block', 'inline', etc.).
 * @returns A string that represents the serialized layout features, formatted 
 *          as `tag:display` pairs separated by commas.
 *
 * @example
 * ```typescript
 * const layoutFeatures = [
 *   { tag: 'div', display: 'block' },
 *   { tag: 'span', display: 'inline' }
 * ];
 * const serialized = serializeLayoutFeatures(layoutFeatures);
 * console.log(serialized); // Outputs: "div:block,span:inline"
 * ```
 */
export function serializeLayoutFeatures(layout: LayoutFeature[]): string {
  return layout.map(f => `${f.tag}:${f.display}`).join(',');
}

/**
 * Represents the resilience breakdown of a certain element or system.
 *
 * This interface encapsulates the overall score, detailed penalties 
 * associated with various factors, and a qualitative label that indicates 
 * the resilience level. The `emoji` provides a visual representation 
 * of the resilience status.
 */
export interface ResilienceBreakdown {
  /**
   * The overall resilience score, typically a numeric value that reflects 
   * the strength or weakness of the element or system.
   */
  score: number;

  /**
   * A breakdown of penalties that contribute to the overall resilience score.
   */
  breakdown: {
    /**
     * The penalty associated with the tag used in the element. 
     * This could represent how the choice of HTML tag affects resilience.
     */
    tagPenalty: number;

    /**
     * The penalty related to the depth of the element within the document structure. 
     * A deeper nesting may incur a higher penalty.
     */
    depthPenalty: number;

    /**
     * The penalty associated with the layout characteristics of the element. 
     * This reflects how the layout impacts the resilience.
     */
    layoutPenalty: number;
  };

  /**
   * A qualitative label indicating the level of resilience.
   * Possible values include:
   * - 'Strong': Indicates high resilience.
   * - 'Moderate': Indicates average resilience.
   * - 'Fragile': Indicates low resilience.
   */
  label: 'Strong' | 'Moderate' | 'Fragile';

  /**
   * An emoji representing the resilience status visually.
   * Possible values include:
   * - '✅' for strong resilience.
   * - '⚠️' for moderate resilience.
   * - '❌' for fragile resilience.
   */
  emoji: '✅' | '⚠️' | '❌';
}

/**
 * Computes the resilience score for a given structure and optional layout.
 *
 * This function analyzes the provided `structure` and `layout` to determine 
 * a resilience score, which reflects the robustness of the element or system. 
 * It calculates penalties based on tag variety, depth of nesting, and layout 
 * characteristics. The result includes a breakdown of these penalties along 
 * with a qualitative label and emoji representation of the resilience status.
 *
 * @param structure - An array of strings representing the structural tags used 
 *                    in the element. Each string corresponds to a specific 
 *                    tag in the HTML or document structure.
 * @param layout - An optional array of strings that describe the layout of 
 *                 the element. Each string is expected to be in the format 
 *                 "key:value", where the value contributes to layout diversity.
 *
 * @returns A `ResilienceBreakdown` object containing:
 * - `score`: The computed resilience score (0 to 1).
 * - `breakdown`: An object detailing the penalties:
 *   - `tagPenalty`: The penalty associated with tag variety.
 *   - `depthPenalty`: The penalty related to the depth of the structure.
 *   - `layoutPenalty`: The penalty associated with layout variety.
 * - `label`: A qualitative assessment of resilience ('Strong', 'Moderate', 'Fragile').
 * - `emoji`: A visual representation of resilience status ('✅', '⚠️', '❌').
 */
export function computeResilienceScore(
  structure: string[],
  layout?: string[]
): ResilienceBreakdown {
  const tagVariety = new Set(structure).size;
  const tagPenalty = 1 - Math.min(tagVariety / structure.length, 1);
  const depthPenalty = structure.length > 0 ? Math.min(1, structure.length / 100) : 0;
  const layoutVariety = layout?.length ? new Set(layout.map(d => d.split(':')[1])).size : 0;
  const layoutPenalty = layout?.length ? 1 - Math.min(layoutVariety / layout.length, 1) : 0;

  const penalties = layout !== undefined
    ? [tagPenalty, layoutPenalty]
    : [tagPenalty, depthPenalty, layoutPenalty];
  const avgPenalty = penalties.reduce((a, b) => a + b, 0) / penalties.length;
  const score = Math.max(0, 1 - avgPenalty);

  let label: ResilienceBreakdown['label'] = 'Strong';
  let emoji: ResilienceBreakdown['emoji'] = '✅';
  if (score < 0.5) {
    label = 'Fragile';
    emoji = '❌';
  } else if (score < 0.85) {
    label = 'Moderate';
    emoji = '⚠️';
  }

  return {
    score,
    breakdown: {
      tagPenalty,
      depthPenalty,
      layoutPenalty
    },
    label,
    emoji
  };
}