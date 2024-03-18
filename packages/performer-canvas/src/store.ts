import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  getConnectedEdges,
  Node,
  NodeChange,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  XYPosition,
} from "reactflow";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { create } from "zustand";
import {
  getClosestEdge,
  updateEdges,
  updateProximityIndex,
} from "./lib/proximity.ts";
import { PerformerMessage } from "@performer/core";

/* https://reactflow.dev/learn/advanced-use/state-management */

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export type RFState = {
  yPos: number;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  pushNode: (node: Node) => void;
  getNode: (id: string) => Node;
  moveNode: (id: string, x: number, y: number) => void;
  updateNodeData: <T extends Node>(
    id: string,
    data: Partial<T["data"]>,
  ) => void;
  deleteNode: (id: string) => void;
  newNode: (node: {
    type: string;
    data: Record<string, any>;
    parentNode?: string;
    position?: XYPosition;
  }) => string;
  updateChatMessage: (
    id: string,
    index: number,
    message: Partial<PerformerMessage>,
  ) => void;
  removeChatMessage: (id: string, index: number) => void;
  insertChatMessage: (id: string, message: PerformerMessage) => number;
};

export const useStore = create(
  persist<RFState>(
    (set, get) => ({
      yPos: 0,
      nodes: initialNodes,
      edges: initialEdges,
      onNodesChange: (changes: NodeChange[]) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },
      onEdgesChange: (changes: EdgeChange[]) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },
      onConnect: (connection: Connection) => {
        set({
          edges: addEdge(connection, get().edges),
        });
      },
      setNodes: (nodes: Node[]) => {
        set({ nodes });
      },
      setEdges: (edges: Edge[]) => {
        set({ edges });
      },
      pushNode: (node: Node) => {
        set({ nodes: [...get().nodes, node] });
      },
      getNode: (id: string) => {
        return get().nodes.find(findId(id))!;
      },
      moveNode: (id: string, x: number, y: number) => {
        const nodes = get().nodes;
        const index = nodes.findIndex(findId(id));
        nodes[index].position.x = x;
        nodes[index].position.y = y;
        return [...nodes];
      },
      updateNodeData: (id: string, data: Record<string, any>) => {
        const nodes = get().nodes;
        const index = nodes.findIndex(findId(id));
        if (index < 0) {
          throw Error(`Node ${id} not found`);
        }
        nodes[index] = {
          ...nodes[index],
          data: { ...nodes[index].data, ...data },
        };
        set({ nodes: [...nodes] });
      },
      deleteNode: (id: string) => {
        const nodes = get().nodes;
        const edges = get().edges;
        const index = nodes.findIndex(findId(id));
        if (index < 0) {
          throw Error(`Node ${id} not found`);
        }
        const connected = getConnectedEdges([nodes[index]], edges);
        const edgesToDelete = new Set(connected.map((e) => e.id));
        set({
          nodes: nodes.toSpliced(index, 1),
          edges: edges.filter((e) => !edgesToDelete.has(e.id)),
        });
      },
      newNode: ({ type, data, position, parentNode }) => {
        let { yPos, pushNode, edges, getNode, moveNode } = get();
        yPos += 100;
        const id = crypto.randomUUID();
        const newNode: Node = {
          id,
          type,
          data,
          parentNode,
          position: position || {
            x: 250,
            y: yPos,
          },
        };
        pushNode(newNode);
        const closeEdge = getClosestEdge(newNode);
        if (closeEdge) {
          // snap target to source
          const source = getNode(closeEdge.source);
          const right = source.position.x;
          const bottom = source.position.y + source.height!;
          moveNode(closeEdge.target, right, bottom);
        }
        set({ yPos, edges: updateEdges(newNode, closeEdge, edges) });
        return id;
      },
      updateChatMessage: (
        id: string,
        index: number,
        message: Partial<PerformerMessage>,
      ) => {
        const { nodes } = get();
        const nodeIndex = nodes.findIndex(findId(id));
        const chatNode = nodes[nodeIndex];
        chatNode.data.messages[index] = {
          ...chatNode.data.messages[index],
          ...message,
        };
        set({ nodes });
      },
      removeChatMessage: (id: string, index: number) => {
        const { nodes } = get();
        const nodeIndex = nodes.findIndex(findId(id));
        const chatNode = nodes[nodeIndex];
        chatNode.data.messages = chatNode.data.messages.toSpliced(index, 1);
        set({ nodes });
      },
      insertChatMessage: (id: string, message: PerformerMessage) => {
        const { nodes } = get();
        const nodeIndex = nodes.findIndex(findId(id));
        const chatNode = nodes[nodeIndex];
        const len = chatNode.data.messages.push(message);
        set({ nodes });
        return len - 1;
      },
    }),
    { name: "canvas-storage" },
  ),
);

// useStore.subscribe(
//   (store) => store.nodes,
//   (nodes) => {
//     updateProximityIndex(nodes);
//   },
// );

export function findId(id: string) {
  return (obj: { id: string }) => obj.id === id;
}
