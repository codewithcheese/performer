import ReactFlow, {
  Background,
  ControlButton,
  Controls,
  MiniMap,
  type Node,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { useCallback } from "react";
import { getClosestEdge } from "./lib/proximity.ts";
import { SquareMousePointer } from "lucide-react";
import ChatNode from "./components/ChatNode.tsx";
import { useSnapshot } from "valtio";
import {
  newNode,
  onConnect,
  onEdgesChange,
  onNodesChange,
  state,
} from "./valtio.ts";

if ("VITE_OPENAI_API_KEY" in import.meta.env) {
  // @ts-ignore
  globalThis.process = {
    env: { OPENAI_API_KEY: import.meta.env["VITE_OPENAI_API_KEY"] },
  };
}

const nodeTypes = {
  // editorNode: EditorNode,
  chatNode: ChatNode,
};

function App() {
  const { setEdges, screenToFlowPosition } = useReactFlow();
  const snap = useSnapshot(state);

  // @ts-ignore
  window.nodes = snap.nodes;
  // @ts-ignore
  window.edges = snap.edges;

  const getViewportCenter = useCallback(() => {
    return screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
  }, [screenToFlowPosition]);

  const onNodeDrag = useCallback(
    (_: unknown, node: Node) => {
      // const closeEdge = getClosestEdge(node);
      // setEdges((edges) => updateEdges(node, closeEdge, edges));
    },
    [getClosestEdge, setEdges],
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      // const closeEdge = getClosestEdge(node);
      // if (closeEdge) {
      //   // snap target to source
      //   const source = getNode(closeEdge.source);
      //   const right = source.position.x;
      //   const bottom = source.position.y + source.height!;
      //   moveNode(closeEdge.target, right, bottom);
      //
      //   setEdges((edges) => updateEdges(node, closeEdge, edges));
      // }
    },
    [getClosestEdge, setEdges],
  );

  return (
    <ReactFlow
      nodeTypes={nodeTypes}
      nodes={snap.nodes}
      onNodesChange={onNodesChange}
      edges={snap.edges}
      onEdgesChange={onEdgesChange}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
      onConnect={onConnect}
      zoomOnScroll={true}
      panOnScroll={true}
      fitView
    >
      <Background />
      <Controls className="bg-white" showInteractive={false}>
        <ControlButton
          onClick={() => {
            const pos = getViewportCenter();
            newNode({
              type: "chatNode",
              data: { messages: [], headless: false },
              position: { x: pos.x - 200, y: pos.y - 100 },
            });
          }}
        >
          <SquareMousePointer />
        </ControlButton>
      </Controls>
      <MiniMap pannable={true} zoomable={true} zoomStep={1} />
    </ReactFlow>
  );
}

export default App;
