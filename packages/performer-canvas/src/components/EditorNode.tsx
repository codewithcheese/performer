import { memo, useCallback, useMemo, useState } from "react";
import CodeMirror, { Prec } from "@uiw/react-codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import {
  Handle,
  Node,
  NodeProps,
  NodeToolbar,
  Position,
  useReactFlow,
} from "reactflow";
import { javascript } from "@codemirror/lang-javascript";
import { languages } from "@codemirror/language-data";
import { useStore } from "../store.ts";
import { chat } from "../lib/chat.ts";
import { MessageIcon } from "../icons/MessageIcon.tsx";
import {
  RoleSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/RoleSelect.tsx";
import {
  GripHorizontal,
  RefreshCw,
  SendHorizontal,
  UserRoundPlus,
  X,
} from "lucide-react";

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
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const { deleteNode, newNode, getNode } = useStore((state) => ({
    deleteNode: state.deleteNode,
    newNode: state.newNode,
    getNode: state.getNode,
  }));

  const updateData = useCallback((id: string, data: any) => {
    setNodes((nodes) => {
      return nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node,
      );
    });
  }, []);

  const submitChat = useCallback(async () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    } else {
      const controller = new AbortController();
      setAbortController(controller);
      try {
        await chat(id, controller);
      } finally {
        setAbortController(null);
      }
    }
  }, [abortController, setAbortController]);

  const extensions = useMemo(() => {
    return [
      markdown({
        defaultCodeLanguage: javascript(),
        codeLanguages: languages,
      }),
      EditorView.lineWrapping,
      Prec.highest(
        keymap.of([
          {
            key: "Ctrl-Enter",
            run: () => {
              submitChat();
              return true;
            },
          },
        ]),
      ),
    ];
  }, [submitChat]);

  const handleOnChange = useCallback(
    (value: string) => {
      updateData(id, { content: value });
    },
    [id],
  );

  return (
    <>
      <div className="bg-white rounded shadow border border-gray-200 w-[80ch] max-h-[60ch] overflow-y-scroll">
        <div className="flex flex-row">
          <GripHorizontal className="ml-2 text-gray-500" size={14} />
          <div className="flex-1"></div>
          <X
            className="text-gray-500 nodrag"
            size={14}
            onClick={() => deleteNode(id)}
          />
        </div>
        <div className="flex flex-row">
          <div>
            <RoleSelect
              onValueChange={(value) => {
                updateData(id, { role: value });
              }}
              value={data.role}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">
                  <MessageIcon role="system" />
                </SelectItem>
                <SelectItem value="user">
                  <MessageIcon role="user" />
                </SelectItem>
                <SelectItem value="assistant">
                  <MessageIcon role="assistant" />
                </SelectItem>
              </SelectContent>
            </RoleSelect>
          </div>
          <CodeMirror
            className="flex flex-1 w-full rounded-b border-t border-t-gray-200 nodrag"
            value={data.content}
            extensions={extensions}
            // autoFocus={data.role !== "assistant"}
            onChange={handleOnChange}
          />
        </div>
      </div>
      <NodeToolbar className="nodrag" position={Position.Bottom}>
        <div className="flex flex-row gap-1">
          <button
            onClick={submitChat}
            className="rounded-full bg-gray-100 p-4 hover:bg-gray-200 text-gray-700 text-sm"
          >
            {abortController ? (
              <RefreshCw className="loading-icon" size="20" />
            ) : (
              <SendHorizontal size="20" />
            )}
          </button>
          <button
            onClick={() => {
              const node = getNode(id);
              const left = node.position.x;
              const bottom = node.position.y + node.height!;
              newNode(
                "editorNode",
                { role: "user", content: "" },
                left,
                bottom + 10,
              );
            }}
            className="rounded-full bg-gray-100 p-4 hover:bg-gray-200 text-gray-700 text-sm"
          >
            <UserRoundPlus size="16" />
          </button>
        </div>
      </NodeToolbar>
      <Handle
        onConnect={(connection) => console.log("connect", connection)}
        id="top"
        type="target"
        position={Position.Top}
      />
      <Handle id="bottom" type="source" position={Position.Bottom} />
    </>
  );
});
