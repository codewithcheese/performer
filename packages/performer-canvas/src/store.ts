import { proxy, ref, subscribe } from "valtio";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  XYPosition,
} from "reactflow";
import { findId } from "./lib/array.ts";
import {
  Performer,
  PerformerEvent,
  PerformerMessage,
  hydrate,
  serialize,
} from "@performer/core";
import ChatNode from "./components/ChatNode.tsx";
import { Fragment, jsx } from "@performer/core/jsx-runtime";

// loosen readonly for TS happiness
declare module "valtio" {
  function useSnapshot<T extends object>(p: T): T;
}

export type ChatNodeData = {
  headless: boolean;
  dropIndex?: number;
  performer: Performer;
  events: PerformerEvent[];
};

export type ChatNodeType = Node<ChatNodeData, "chatNode">;

export type NodeType = ChatNodeType;

export const nodeTypes = {
  chatNode: ChatNode,
};

export type FlowState = {
  nodes: NodeType[];
  edges: Edge[];
  dropFocus: { id: string; index: number } | null;
};

const STORAGE_KEY = "flow-state";

export const state = proxy<FlowState>(
  (await parse(localStorage.getItem(STORAGE_KEY)!)) || {
    nodes: [],
    edges: [],
    dropFocus: null,
  },
);

/**
 * Persistence
 */

subscribe(state, () => {
  localStorage.setItem(STORAGE_KEY, stringify(state));
});

export function stringify(state: FlowState) {
  return JSON.stringify(state, function (this, key, value) {
    if (value instanceof Performer) {
      // todo use cache if performer unchanged
      const root = value.root ? serialize(value.root) : undefined;
      return { $$$type: "Performer", serialized: root };
    }
    return value;
  });
}

export async function parse(str: string) {
  if (!str) {
    return null;
  }
  const state = JSON.parse(str);
  for (let node of state.nodes) {
    const performer = node.data.performer;
    if (performer && "$$$type" in performer) {
      // using valtio `ref` so performer is not proxified
      node.data.performer = ref(new Performer(jsx(Fragment, {})));
      if (performer.serialized) {
        await hydrate({
          performer: node.data.performer,
          element: jsx(Fragment, {}),
          serialized: performer.serialized,
        });
      }
    }
  }
  return state;
}

/**
 * ReactFlow callbacks
 */

export function onNodesChange(changes: NodeChange[]) {
  state.nodes = applyNodeChanges(changes, state.nodes) as NodeType[];
}

export function onEdgesChange(changes: EdgeChange[]) {
  state.edges = applyEdgeChanges(changes, state.edges);
}

export function onConnect(connection: Connection) {
  state.edges = addEdge(connection, state.edges);
}

/**
 * Node handling
 */

export function newChatNode({
  position,
  zIndex,
  headless = true,
}: {
  position: XYPosition;
  zIndex?: number;
  headless?: boolean;
}) {
  const id = crypto.randomUUID();
  const node: ChatNodeType = {
    id,
    type: "chatNode",
    data: {
      headless,
      dropIndex: undefined,
      performer: ref(new Performer(jsx(Fragment, {}))),
      events: [],
    },
    position,
    zIndex,
  };
  state.nodes.push(node);
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

export function getNode(id: string) {
  return state.nodes.find(findId(id));
}

/**
 * Chat messages
 */

export function pushChatMessage(id: string, message: PerformerMessage) {
  const node = state.nodes.find(findId(id))!;
  return node.data.messages.push(message) - 1;
}

export function getChatMessages(id: string): PerformerMessage[] {
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
    node.data.dropIndex = undefined;
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
    node.data.dropIndex = undefined;
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
    focusNode.data.dropIndex = undefined;
    deleteNode(node.id);
  }
  state.dropFocus = null;
}
