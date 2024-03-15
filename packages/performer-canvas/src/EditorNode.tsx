import { memo, useCallback, useState } from "react";
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
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { javascript } from "@codemirror/lang-javascript";
import { languages } from "@codemirror/language-data";
import { TrashIcon } from "./icons/TrashIcon.tsx";
import { useStore } from "./store.ts";
import { chat } from "./chat.ts";
import { LoadingIcon } from "./icons/LoadingIcon.tsx";
import { MessageIcon } from "./icons/MessageIcon.tsx";
import {
  RoleSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/RoleSelect.tsx";

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
  const deleteNode = useStore((state) => state.deleteNode);

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

  const ctrlEnter = Prec.highest(
    keymap.of([
      {
        key: "Ctrl-Enter",
        run: () => {
          submitChat();
          return true;
        },
      },
    ]),
  );

  return (
    <>
      <div className="bg-white text-sm rounded shadow border border-gray-200 w-[60ch] max-h-[60ch] overflow-y-scroll">
        <div className="flex flex-row">
          <span>
            <RoleSelect
              onValueChange={(value) => {
                updateData(id, { role: value });
              }}
              value={data.role}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-sm">
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
          </span>
        </div>
        <div className="flex flex-row">
          <div></div>
          <CodeMirror
            className="flex flex-1 w-full rounded-b border-t border-t-gray-200 nodrag"
            value={data.content}
            extensions={[
              markdown({
                defaultCodeLanguage: javascript(),
                codeLanguages: languages,
              }),
              EditorView.lineWrapping,
              ctrlEnter,
            ]}
            onChange={(value) => {
              updateData(id, { content: value });
            }}
          />
        </div>
      </div>
      <NodeToolbar className="nodrag" position={Position.Left}>
        <button className="hover:bg-gray-100" onClick={() => deleteNode(id)}>
          <TrashIcon />
        </button>
      </NodeToolbar>
      <NodeToolbar className="nodrag" position={Position.Bottom}>
        <button
          onClick={submitChat}
          className="rounded-full bg-gray-100 p-4 hover:bg-gray-200"
        >
          {abortController ? <LoadingIcon /> : <PaperPlaneIcon />}
        </button>
      </NodeToolbar>
      <Handle id="top" type="target" position={Position.Top} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
    </>
  );
});
