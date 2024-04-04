import { ReactNode, useMemo } from "react";
import { SystemMessage, UserMessage } from "../message.js";
import { Message } from "./Message.js";

export function User({
  content,
  children,
  className,
  onBeforeResolved,
  onBeforeFinalized,
}: {
  content?: UserMessage["content"];
  children?: ReactNode | ((message: UserMessage) => ReactNode);
  className?: string;
  onBeforeResolved?: (message: UserMessage | null) => void;
  onBeforeFinalized?: (message: UserMessage | null) => void;
}) {
  const type = useMemo(
    () => (content ? { role: "user" as const, content } : "LISTENER"),
    [content],
  );
  const deps = useMemo(() => [content], [content]);
  return (
    <Message<UserMessage>
      className={className}
      type={type}
      deps={deps}
      onBeforeResolved={onBeforeResolved}
      onBeforeFinalized={onBeforeFinalized}
    >
      {children}
    </Message>
  );
}
