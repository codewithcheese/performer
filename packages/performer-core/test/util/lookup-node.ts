import { PerformerNode } from "../../src/index.js";

/**
 * Searches for a node in a PerformerNode tree based on a specified path.
 * The path format is `type[index]->type[index]->...` where `type` is
 * the component type and `index` is the zero-based index of that type within its parent.
 *
 * @example
 * const path = "Fragment[0]->Assistant[1]";
 * const foundNode = lookupNode(performer.root, path);
 */
export function createLookup(node: PerformerNode) {
  return (path: string): PerformerNode => {
    const steps = path.split("->").map((step) => {
      if (step.endsWith("]")) {
        const [type, indexStr] = step.split("[");
        const index = parseInt(indexStr.split("]")[0], 10);
        return { type, index };
      } else {
        return { type: step, index: 0 };
      }
    });

    let current: PerformerNode = node;

    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
      const { type, index } = steps[stepIndex];
      if (!current) {
        throw new Error(
          `Path resolution failed: ${path}. Step '${type}[${index}]' could not be resolved because the node is undefined.`,
        );
      }

      let siblings = gatherSiblingsOfType(current.child, type);
      if (index >= siblings.length) {
        // Constructing the partial path that led to the error for clearer error messaging
        const errorPath = steps
          .slice(0, stepIndex + 1)
          .map((step) => `${step.type}[${step.index}]`)
          .join("->");
        throw new Error(
          `Index out of bounds: '${errorPath}' in path '${path}'. Only found ${siblings.length} siblings of type '${type}'.`,
        );
      }

      current = siblings[index];
    }

    return current;
  };
}

function gatherSiblingsOfType(
  node: PerformerNode | undefined,
  type: string,
): PerformerNode[] {
  let siblings: PerformerNode[] = [];
  while (node) {
    if (
      typeof node.action === "string"
        ? node.action === type
        : node.action.name === type
    ) {
      siblings.push(node);
    }
    node = node.nextSibling;
  }
  return siblings;
}
