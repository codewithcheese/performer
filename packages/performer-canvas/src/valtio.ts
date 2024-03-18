import { proxy, subscribe } from "valtio";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  XYPosition,
} from "reactflow";
import { findId } from "./lib/array.ts";
import { PerformerMessage } from "@performer/core";

declare module "valtio" {
  function useSnapshot<T extends object>(p: T): T;
}

export type FlowState = {
  nodes: Node[];
  edges: Edge[];
};

export const state = proxy<FlowState>(
  JSON.parse(localStorage.getItem("flow-state")!) || { nodes: [], edges: [] },
);

export function onNodesChange(changes: NodeChange[]) {
  state.nodes = applyNodeChanges(changes, state.nodes);
}

export function onEdgesChange(changes: EdgeChange[]) {
  state.edges = applyEdgeChanges(changes, state.edges);
}

export function onConnect(connection: Connection) {
  state.edges = addEdge(connection, state.edges);
}

export function newNode({
  type,
  data,
  position,
  parentNode,
}: {
  type: string;
  data: Record<string, any>;
  parentNode?: string;
  position: XYPosition;
}) {
  const id = crypto.randomUUID();
  const newNode: Node = {
    id,
    type,
    data,
    parentNode,
    position,
  };
  state.nodes.push(newNode);
  // const closeEdge = getClosestEdge(newNode);
  // if (closeEdge) {
  //   // snap target to source
  //   const source = getNode(closeEdge.source);
  //   const right = source.position.x;
  //   const bottom = source.position.y + source.height!;
  //   moveNode(closeEdge.target, right, bottom);
  // }
  // set({ yPos, edges: updateEdges(newNode, closeEdge, edges) });
  return id;
}

export function deleteNode(id: string) {
  const index = state.nodes.findIndex(findId(id));
  if (index < 0) {
    throw Error(`Node ${id} not found`);
  }
  state.nodes = state.nodes.toSpliced(index, 1);
  state.edges = state.edges.filter(
    (edge) => edge.source !== id && edge.target !== id,
  );
}

export function pushChatMessage(id: string, message: PerformerMessage) {
  const node = state.nodes.find(findId(id))!;
  return node.data.messages.push(message) - 1;
}

export function getChatMessages(id: string) {
  return state.nodes.find(findId(id))!.data.messages;
}

export function updateChatMessage(
  id: string,
  index: number,
  changes: Partial<PerformerMessage>,
) {
  const node = state.nodes.find(findId(id))!;
  const message = node.data.messages[index];
  Object.assign(message, changes);
}

export function removeChatMessage(id: string, index: number) {
  const node = state.nodes.find(findId(id))!;
  node.data.messages = node.data.messages.toSpliced(index, 1);
}

subscribe(state, () => {
  localStorage.setItem("flow-state", JSON.stringify(state));
});
