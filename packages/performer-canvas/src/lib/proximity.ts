import { Node } from "reactflow";
import RBush from "rbush";

export type ProximityItem = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: string;
  index: number;
};

export const proximityIndex = new RBush<ProximityItem>();

export function getIntersections(node: Node, minDistance = 0) {
  const searchItem = {
    minX: node.position.x - minDistance, // minDistance from middle
    minY: node.position.y - minDistance,
    maxX: node.position.x + (node.width || 0) + minDistance,
    maxY: node.position.y + (node.height || 0) + minDistance,
  };
  console.log("Proximity search", searchItem, node);
  return proximityIndex
    .search(searchItem)
    .filter((item) => item.id !== node.id);
}
