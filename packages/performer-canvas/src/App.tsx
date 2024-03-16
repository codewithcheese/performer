import ReactFlow, {
  Background,
  ControlButton,
  Controls,
  MiniMap,
  type Node,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import EditorNode from "./components/EditorNode.tsx";
import { useCallback } from "react";
import { shallow } from "zustand/shallow";
import { RFState, useStore } from "./store";
import { getClosestEdge, updateEdges } from "./lib/proximity.ts";
import { SquareMousePointer } from "lucide-react";

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
  getNode: state.getNode,
  moveNode: state.moveNode,
});

const nodeTypes = { editorNode: EditorNode };

function App() {
  const { setEdges, screenToFlowPosition } = useReactFlow();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    newNode,
    getNode,
    moveNode,
  } = useStore(selector, shallow);

  const getViewportCenter = useCallback(() => {
    return screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
  }, [screenToFlowPosition]);

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
        // snap target to source
        const source = getNode(closeEdge.source);
        const right = source.position.x;
        const bottom = source.position.y + source.height!;
        moveNode(closeEdge.target, right, bottom);

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
      zoomOnScroll={true}
      panOnScroll={true}
      fitView
    >
      <Background />
      <Controls className="bg-white" showInteractive={false}>
        <ControlButton
          onClick={() => {
            const pos = getViewportCenter();
            newNode(
              "editorNode",
              { role: "user", content: "" },
              pos.x - 200,
              pos.y - 100,
            );
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
