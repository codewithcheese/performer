import ReactFlow, {
  Background,
  ControlButton,
  Controls,
  Edge,
  MiniMap,
  type Node,
  useReactFlow,
} from "reactflow";
import { CursorTextIcon } from "@radix-ui/react-icons";
import "reactflow/dist/style.css";
import EditorNode from "./EditorNode.tsx";
import { useCallback } from "react";
import { shallow } from "zustand/shallow";
import { RFState, useStore } from "./store";
import { proximityIndex, ProximityItem } from "./proximity.ts";

if ("VITE_OPENAI_API_KEY" in import.meta.env) {
  // @ts-ignore
  globalThis.process = {
    env: { OPENAI_API_KEY: import.meta.env["VITE_OPENAI_API_KEY"] },
  };
}

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  setEdges: state.setEdges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  pushNode: state.pushNode,
  newNode: state.newNode,
});

const nodeTypes = { editorNode: EditorNode };

const MIN_DISTANCE = 50;

function updateEdges(
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

function App() {
  const { setEdges } = useReactFlow();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, newNode } =
    useStore(selector, shallow);

  const getClosestEdge = useCallback(
    (node: Node) => {
      const closest = (
        proximityIndex.search({
          minX: node.position.x - MIN_DISTANCE,
          minY: node.position.y - MIN_DISTANCE,
          maxX: node.position.x + (node.width || 0) + MIN_DISTANCE,
          maxY: node.position.y + (node.height || 0) + MIN_DISTANCE,
        }) as ProximityItem[]
      )
        .filter((item) => item.id !== node.id)
        .find((item) => item.node.positionAbsolute != null);
      if (!closest) {
        return null;
      }
      // console.log(
      //   "node",
      //   node,
      //   "closest",
      //   closest,
      //   "nodes",
      //   nodes,
      // );

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
    },
    [nodes],
  );

  const onNodeDrag = useCallback(
    (_: unknown, node: Node) => {
      const closeEdge = getClosestEdge(node);
      setEdges((edges) => updateEdges(node, closeEdge, edges));
    },
    [getClosestEdge, setEdges],
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      const closeEdge = getClosestEdge(node);
      if (closeEdge) {
        setEdges((edges) => updateEdges(node, closeEdge, edges));
      }
    },
    [getClosestEdge, setEdges],
  );

  return (
    <ReactFlow
      nodeTypes={nodeTypes}
      nodes={nodes}
      onNodesChange={onNodesChange}
      edges={edges}
      onEdgesChange={onEdgesChange}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
      onConnect={onConnect}
      fitView
    >
      <Background />
      <Controls>
        <ControlButton
          onClick={() => newNode("editorNode", { role: "user", content: "" })}
        >
          <CursorTextIcon />
        </ControlButton>
      </Controls>
      <MiniMap />
    </ReactFlow>
  );
}

export default App;
