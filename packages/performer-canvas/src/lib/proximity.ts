import { Edge, Node } from "reactflow";
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

export function getClosestEdge(node: Node, minDistance = 20) {
  const closest = (
    proximityIndex.search({
      minX: node.position.x - minDistance,
      minY: node.position.y - minDistance,
      maxX: node.position.x + (node.width || 0) + minDistance,
      maxY: node.position.y + (node.height || 0) + minDistance,
    }) as ProximityItem[]
  )
    .filter((item) => item.id !== node.id)
    .find((item) => item.node.positionAbsolute != null);
  if (!closest) {
    return null;
  }
  // console.log("node", node, "closest", closest, "nodes", nodes);

  const closeNodeIsSource =
    closest.node.positionAbsolute &&
    node.positionAbsolute &&
    closest.node.positionAbsolute.y < node.positionAbsolute.y;

  const edge: Edge = {
    id: closeNodeIsSource
      ? `${closest.node.id}->-${node.id}`
      : `${node.id}->-${closest.node.id}`,
    source: closeNodeIsSource ? closest.node.id : node.id,
    target: closeNodeIsSource ? node.id : closest.node.id,
    sourceHandle: "bottom",
    targetHandle: "top",
  };
  // console.log("edge", edge);
  return edge;
}

export function updateProximityIndex(nodes: Node[]) {
  nodes.forEach((node) => update(node));
  // remove removed nodes from index
  const nodeIds = new Set(nodes.map((n) => n.id));
  const itemIds = Object.keys(itemMap);
  itemIds.forEach((id) => {
    if (!nodeIds.has(id)) {
      const item = itemMap[id];
      proximityIndex.remove(item);
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
