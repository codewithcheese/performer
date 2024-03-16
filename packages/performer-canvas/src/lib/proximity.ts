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
    .find((item) => item);
  if (!closest) {
    // console.log(`No closest edge for ${node.id}: ${JSON.stringify(node.data)}`);
    return null;
  }
  // console.log("node", node, "closest", closest);

  const closeNodeIsSource =
    closest.node.position &&
    node.position &&
    closest.node.position.y < node.position.y;

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

export function updateEdges(
  node: Node,
  closeEdge: { id: string; source: string; target: string } | null,
  edges: Edge[],
) {
  if (closeEdge) {
    // update edge
    const matchingEdge = edges.find(
      (e) => e.source === closeEdge.source && e.target === closeEdge.target,
    );
    if (!matchingEdge) {
      edges.push(closeEdge);
    }
    const inverseEdgeIndex = edges.findIndex(
      (e) => e.target === closeEdge.source && e.source === closeEdge.target,
    );
    if (inverseEdgeIndex > -1) {
      edges = edges.toSpliced(inverseEdgeIndex, 1);
    }
  } else {
    // remove edges
    const sourceEdgeIndex = edges.findIndex((e) => e.source === node.id);
    if (sourceEdgeIndex > -1) {
      edges = edges.toSpliced(sourceEdgeIndex, 1);
    }
    const targetEdgeIndex = edges.findIndex((e) => e.target === node.id);
    if (targetEdgeIndex > -1) {
      edges = edges.toSpliced(targetEdgeIndex, 1);
    }
  }

  return edges;
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
  // console.log("Proximity items", proximityIndex);
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
