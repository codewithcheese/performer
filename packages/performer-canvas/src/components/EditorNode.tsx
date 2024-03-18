import { memo, useCallback, useMemo, useState } from "react";
import CodeMirror, { Prec } from "@uiw/react-codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { Handle, Node, NodeProps, NodeToolbar, Position } from "reactflow";
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
  Edit2Icon,
  EyeIcon,
  GripHorizontal,
  RefreshCw,
  SendHorizontal,
  UserRoundPlus,
  X,
} from "lucide-react";
import { MessageMarkdown } from "./MessageMarkdown.tsx";
import { TitleBar } from "./TitleBar.tsx";

type EditorNodeData = {
  role: string;
  content: string;
  onSubmit: (id: string, nodes: Node[]) => void;
};

export default memo(function EditorNode({
  id,
  data,
}: NodeProps<EditorNodeData>) {
  const [isEditing, setIsEditing] = useState(data.role === "user");
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const { deleteNode, newNode, getNode, updateNodeData } = useStore(
    (state) => ({
      deleteNode: state.deleteNode,
      newNode: state.newNode,
      getNode: state.getNode,
      updateNodeData: state.updateNodeData,
    }),
  );

  const role = useMemo(() => data.role, [data.role]);

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

  const setup = useMemo(
    () => ({
      lineNumbers: false,
      foldGutter: false,
    }),
    [],
  );

  const handleOnChange = useCallback(
    (value: string) => {
      console.log("handleOnChange called");
      updateNodeData(id, { content: value });
    },
    [id],
  );

  const handleRoleChange = useCallback(
    (value: string) => {
      console.log("handleRoleChange called");
      updateNodeData(id, { role: value });
    },
    [updateNodeData],
  );

  return (
    <>
      <div className="bg-white w-[70ch]">
        <TitleBar>
          <GripHorizontal className="ml-2 text-gray-500" size={16} />
          {isEditing ? (
            <EyeIcon
              className="text-gray-500"
              size={16}
              onClick={() => setIsEditing(false)}
            />
          ) : (
            <Edit2Icon
              className="text-gray-500"
              onClick={() => setIsEditing(true)}
              size={16}
            />
          )}
          <div className="flex-1"></div>
          <X
            className="text-gray-500 nodrag"
            size={16}
            onClick={() => deleteNode(id)}
          />
        </TitleBar>
        <div className="flex flex-row ">
          <div>
            <RoleSelect onValueChange={handleRoleChange} value={role}>
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
          {isEditing ? (
            <CodeMirror
              basicSetup={setup}
              className="flex flex-1 w-full nodrag "
              value={data.content}
              extensions={extensions}
              autoFocus={data.role !== "assistant"}
              onChange={handleOnChange}
            />
          ) : (
            <div className="flex flex-1 w-full nodrag p-2 selectable">
              <MessageMarkdown content={data.content} />
            </div>
          )}
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
              newNode({
                type: "editorNode",
                data: { role: "user", content: "" },
                position: { x: left, y: bottom + 10 },
              });
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
