import { Node } from "reactflow";
import RBush from "rbush";

export type ProximityItem = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: string;
  node: Node;
};

export const itemMap: Record<string, ProximityItem> = {};

export const proximityIndex = new RBush();

export function updateProximityIndex(nodes: Node[]) {
  const existing = new Set(nodes.map((n) => n.id));
  nodes.forEach((node) => update(node));
  const itemIds = Object.keys(itemMap);
  itemIds.forEach((id) => {
    if (!existing.has(id)) {
      delete itemMap[id];
    }
  });
}

function update(node: Node) {
  const newItem = nodeToItem(node);
  const oldItem = itemMap[node.id];

  if (
    oldItem &&
    newItem.minX === oldItem.minX &&
    newItem.minY === oldItem.minY &&
    newItem.maxX === oldItem.maxX &&
    newItem.maxY === oldItem.maxY
  ) {
    // no change
    return;
  }
  if (oldItem) {
    proximityIndex.remove(oldItem);
  }
  proximityIndex.insert(newItem);
  itemMap[newItem.id] = newItem;
}

export function nodeToItem(node: Node): ProximityItem {
  return {
    id: node.id,
    minX: node.position.x,
    minY: node.position.y,
    maxX: node.position.x + (node.width || 0),
    maxY: node.position.y + (node.height || 0),
    node,
  };
}
