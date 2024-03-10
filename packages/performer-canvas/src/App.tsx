import ReactFlow, {
  Background,
  ControlButton,
  Controls,
  MiniMap,
  useStoreApi,
  type Node,
  useReactFlow,
} from "reactflow";
import { CursorTextIcon } from "@radix-ui/react-icons";
import "reactflow/dist/style.css";
import EditorNode from "./EditorNode.tsx";
import { useCallback } from "react";
import { shallow } from "zustand/shallow";
import { RFState, useStore } from "./store";

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

function App() {
  const store = useStoreApi();
  const { setEdges } = useReactFlow();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, newNode } =
    useStore(selector, shallow);

  const getClosestEdge = useCallback((node: Node) => {
    const { nodeInternals } = store.getState();
    const storeNodes = Array.from(nodeInternals.values());

    const closestNode = storeNodes.reduce<{
      distance: number;
      node: Node | null;
    }>(
      (res, n) => {
        if (
          n &&
          n.positionAbsolute &&
          node.positionAbsolute &&
          n.id !== node.id
        ) {
          const dx = n.positionAbsolute.x - node.positionAbsolute.x;
          const dy = n.positionAbsolute.y - node.positionAbsolute.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < res.distance && d < MIN_DISTANCE) {
            res.distance = d;
            res.node = n;
          }
        }

        return res;
      },
      {
        distance: Number.MAX_VALUE,
        node: null,
      },
    );

    if (!closestNode.node) {
      return null;
    }

    const closeNodeIsSource =
      closestNode.node.positionAbsolute &&
      node.positionAbsolute &&
      closestNode.node.positionAbsolute.x < node.positionAbsolute.x;

    return {
      id: closeNodeIsSource
        ? `${closestNode.node.id}-${node.id}`
        : `${node.id}-${closestNode.node.id}`,
      source: closeNodeIsSource ? closestNode.node.id : node.id,
      target: closeNodeIsSource ? node.id : closestNode.node.id,
    };
  }, []);

  const onNodeDrag = useCallback(
    (_: unknown, node: Node) => {
      const closeEdge = getClosestEdge(node);

      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== "temp");

        if (
          closeEdge &&
          !nextEdges.find(
            (ne) =>
              ne.source === closeEdge.source && ne.target === closeEdge.target,
          )
        ) {
          // @ts-expect-error
          closeEdge.className = "temp";
          nextEdges.push(closeEdge);
        }

        return nextEdges;
      });
    },
    [getClosestEdge, setEdges],
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      const closeEdge = getClosestEdge(node);

      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== "temp");

        if (
          closeEdge &&
          !nextEdges.find(
            (ne) =>
              ne.source === closeEdge.source && ne.target === closeEdge.target,
          )
        ) {
          nextEdges.push(closeEdge);
        }

        return nextEdges;
      });
    },
    [getClosestEdge],
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
