import { memo, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import {
  NodeProps,
  NodeToolbar,
  Position,
  useReactFlow,
  Node,
} from "reactflow";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { javascript } from "@codemirror/lang-javascript";
import { languages } from "@codemirror/language-data";
import { TrashIcon } from "./icons/TrashIcon.tsx";
import { useStore } from "./store.ts";
import { chat } from "./chat.ts";

type EditorNodeData = {
  role: string;
  content: string;
  onSubmit: (id: string, nodes: Node[]) => void;
};

export default memo(function EditorNode({
  id,
  data,
}: NodeProps<EditorNodeData>) {
  const { setNodes } = useReactFlow();
  const deleteNode = useStore((state) => state.deleteNode);

  const updateData = useCallback((id: string, data: any) => {
    setNodes((nodes) => {
      return nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node,
      );
    });
  }, []);

  return (
    <>
      <div className="bg-white text-sm rounded shadow border border-gray-200 w-[60ch] max-h-[60ch] overflow-y-scroll">
        <div className="flex flex-row">
          <div className="flex-1">
            <select
              onChange={(event) => {
                updateData(id, { role: event.target.value });
              }}
              value={data.role}
              className="bg-white"
            >
              <option value="system">System</option>
              <option value="user">User</option>
              <option value="assistant">Assistant</option>
            </select>
          </div>
          <button className="hover:bg-gray-100" onClick={() => deleteNode(id)}>
            <TrashIcon />
          </button>
        </div>
        <CodeMirror
          className="w-full rounded-b border-t border-t-gray-200"
          value={data.content}
          extensions={[
            markdown({
              defaultCodeLanguage: javascript(),
              codeLanguages: languages,
            }),
            EditorView.lineWrapping,
          ]}
          onChange={(value) => {
            updateData(id, { content: value });
          }}
        />
      </div>
      <NodeToolbar position={Position.Bottom}>
        <button
          onClick={() => chat(id)}
          className="rounded-full bg-gray-100 p-4 hover:bg-gray-200"
        >
          <PaperPlaneIcon />
        </button>
      </NodeToolbar>
    </>
  );
});
