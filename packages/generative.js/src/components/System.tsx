import { Message } from "./Message.js";
import { ReactNode, useMemo } from "react";
import { SystemMessage } from "../message.js";

export function System({
  content,
  children,
  className,
  onBeforeResolved,
  onBeforeFinalized,
}: {
  content: string;
  children?: ReactNode | ((message: SystemMessage) => ReactNode);
  className?: string;
  onBeforeResolved?: (message: SystemMessage) => void;
  onBeforeFinalized?: (message: SystemMessage) => void;
}) {
  const message = useMemo(
    (): SystemMessage => ({ role: "system", content }),
    [content],
  );
  const deps = useMemo(() => [content], [content]);
  return (
    <Message<SystemMessage>
      type={message}
      typeName="System"
      deps={deps}
      className={className}
      onBeforeResolved={onBeforeResolved}
      onBeforeFinalized={onBeforeFinalized}
    >
      {children}
    </Message>
  );
}
