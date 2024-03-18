import { TitleBar } from "./TitleBar.tsx";
import {
  Edit2Icon,
  EyeIcon,
  GripHorizontal,
  PictureInPicture2,
  ScissorsIcon,
  TrashIcon,
  X,
} from "lucide-react";
import {
  RoleSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/RoleSelect.tsx";
import { MessageIcon } from "../icons/MessageIcon.tsx";
import CodeMirror, { Prec } from "@uiw/react-codemirror";
import { MessageMarkdown } from "./MessageMarkdown.tsx";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { PerformerMessage } from "@performer/core";
import { markdown } from "@codemirror/lang-markdown";
import { javascript } from "@codemirror/lang-javascript";
import { languages } from "@codemirror/language-data";
import { EditorView, keymap } from "@codemirror/view";
import { useReactFlow, XYPosition } from "reactflow";

export type MessageProps = {
  index: number;
  message: PerformerMessage;
  onRemove: (index: number) => void;
  onChange: (index: number, message: Partial<PerformerMessage>) => void;
  onSubmit: () => void;
  onCut: (index: number, position: XYPosition) => void;
};

export default memo(function Message({
  index,
  message,
  onRemove,
  onChange,
  onSubmit,
  onCut,
}: MessageProps) {
  const [isEditing, setIsEditing] = useState(message.role === "user");
  if (typeof message.content !== "string") {
    throw Error("Content must be string");
  }
  const cutButtonRef = useRef<SVGSVGElement>(null);
  const { screenToFlowPosition } = useReactFlow();

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
              onSubmit();
              return true;
            },
          },
        ]),
      ),
    ];
  }, [onSubmit]);

  const editorSetup = useMemo(
    () => ({
      lineNumbers: false,
      foldGutter: false,
    }),
    [],
  );

  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [onRemove]);

  const handleRoleChange = useCallback(
    (role: string) => {
      onChange(index, { role: role as PerformerMessage["role"] });
    },
    [onChange],
  );

  const handleEditorChange = useCallback(
    (text: string) => {
      onChange(index, { content: text });
    },
    [onChange],
  );

  const handleCut = useCallback(() => {
    if (!cutButtonRef.current) {
      return;
    }
    const rect = cutButtonRef.current.getBoundingClientRect();
    const position = { x: rect.x, y: rect.y };
    // const position = {
    //   x: cutButtonRef.current.clientLeft,
    //   y: cutButtonRef.current.clientTop,
    // };
    onCut(index, screenToFlowPosition(position));
  }, [onCut]);

  return (
    <div className="px-2 py-1">
      <div className="flex flex-row ">
        <div>
          <RoleSelect onValueChange={handleRoleChange} value={message.role}>
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
        <div className="w-full group">
          {isEditing ? (
            <CodeMirror
              basicSetup={editorSetup}
              className="flex flex-1 w-full nodrag "
              value={message.content}
              extensions={extensions}
              autoFocus={message.role !== "assistant"}
              onChange={handleEditorChange}
            />
          ) : (
            <div className="flex flex-1 w-full p-1 nodrag selectable">
              <MessageMarkdown content={message.content} />
            </div>
          )}

          <div className="flex flex-row gap-2 opacity-0 group-hover:opacity-100 text-gray-500 nodrag">
            <ScissorsIcon ref={cutButtonRef} size={13} onClick={handleCut} />
            {isEditing ? (
              <EyeIcon size={13} onClick={() => setIsEditing(false)} />
            ) : (
              <Edit2Icon onClick={() => setIsEditing(true)} size={13} />
            )}
            <TrashIcon size={13} onClick={handleRemove} />
          </div>
        </div>
      </div>
    </div>
  );
});
