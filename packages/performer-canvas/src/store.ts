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

// loosen readonly for TS happiness
declare module "valtio" {
  function useSnapshot<T extends object>(p: T): T;
}

export type FlowState = {
  nodes: Node[];
  edges: Edge[];
  dropFocus: { id: string; index: number } | null;
};

const STORAGE_KEY = "flow-state";

export const state = proxy<FlowState>(
  JSON.parse(localStorage.getItem(STORAGE_KEY)!) || {
    nodes: [],
    edges: [],
    dropFocus: null,
  },
);

subscribe(state, () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
});

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

/**
 * Chat messages
 */

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

export function setDropFocus(id: string, index: number) {
  if (
    state.dropFocus &&
    (state.dropFocus.id !== id || state.dropFocus.index !== index)
  ) {
    // remove dropFocus
    const node = state.nodes.find(findId(state.dropFocus.id))!;
    node.data.dropIndex = null;
  }
  const node = state.nodes.find(findId(id))!;
  node.data.dropIndex = index;
  state.dropFocus = { id, index };
}

/**
 * Message DnD
 */

export function clearDropFocus() {
  if (state.dropFocus) {
    const node = state.nodes.find(findId(state.dropFocus.id))!;
    node.data.dropIndex = null;
  }
  state.dropFocus = null;
}

export function dropNode(node: Node) {
  if (state.dropFocus) {
    // insert message into focus node and delete dropped node
    const focusNode = state.nodes.find(findId(state.dropFocus.id))!;
    focusNode.data.messages = focusNode.data.messages.toSpliced(
      state.dropFocus.index,
      0,
      ...node.data.messages,
    );
    focusNode.data.dropIndex = null;
    deleteNode(node.id);
  }
  state.dropFocus = null;
}
