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
import { getIntersections, proximityIndex } from "./lib/proximity.ts";
import { SquareMousePointer } from "lucide-react";
import { useSnapshot } from "valtio";
import {
  clearDropFocus,
  dropNode,
  newNode,
  nodeTypes,
  onConnect,
  onEdgesChange,
  onNodesChange,
  setDropFocus,
  state,
} from "./store.ts";

if ("VITE_OPENAI_API_KEY" in import.meta.env) {
  // @ts-ignore
  globalThis.process = {
    env: { OPENAI_API_KEY: import.meta.env["VITE_OPENAI_API_KEY"] },
  };
}

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

  const onNodeDrag = useCallback((_: unknown, node: Node) => {
    const intersections = getIntersections(node, 0);
    if (intersections.length) {
      const highlight = intersections[0];
      setDropFocus(highlight.id, highlight.index);
    } else {
      clearDropFocus();
    }
  }, []);

  const onNodeDragStop = useCallback((_: unknown, node: Node) => {
    dropNode(node);
    proximityIndex.clear();
  }, []);

  const onNodeDragStart = useCallback((_: unknown, node: Node) => {
    // track all the drop zones
    // note: only supports dragging one node at a time
    const dropZones =
      document.querySelectorAll<HTMLDivElement>(`.message-dropzone`);
    proximityIndex.clear();
    const items = [];
    for (const el of dropZones) {
      const rect = el.getBoundingClientRect();
      const pos = screenToFlowPosition({ x: rect.x, y: rect.y });
      items.push({
        minX: pos.x + Math.floor(el.offsetWidth / 2) - 20, // 20 left of the middle
        minY: pos.y,
        maxX: pos.x + Math.floor(el.offsetWidth / 2) + 20, // 20 right of the middle
        maxY: pos.y + el.offsetHeight,
        index: parseInt(el.getAttribute("data-index")!),
        id: el.getAttribute("data-nodeid")!,
      });
    }
    console.log("loading dropzones", items);
    proximityIndex.load(items);
  }, []);

  return (
    <ReactFlow
      nodeTypes={nodeTypes}
      nodes={snap.nodes}
      onNodesChange={onNodesChange}
      edges={snap.edges}
      onEdgesChange={onEdgesChange}
      onNodeDragStart={onNodeDragStart}
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
