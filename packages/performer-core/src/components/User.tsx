import { ReactNode, useMemo } from "react";
import { UserMessage } from "../message.js";
import { Message } from "./Message.js";

export function User({
  content,
  children,
  className,
}: {
  content?: UserMessage["content"];
  children?: ReactNode | ((message: UserMessage) => ReactNode);
  className?: string;
}) {
  const type = useMemo(
    () => (content ? { role: "user" as const, content } : "LISTENER"),
    [content],
  );
  return (
    <Message<UserMessage> className={className} type={type}>
      {children}
    </Message>
  );
}
