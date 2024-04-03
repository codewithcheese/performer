import { Message } from "./Message.js";
import { ReactNode } from "react";
import { PerformerMessage, SystemMessage } from "../message.js";

export function System({
  content,
  children,
}: {
  content: string;
  children?: ReactNode | ((message: SystemMessage) => ReactNode);
}) {
  return (
    <Message<SystemMessage>
      type={() => ({ role: "system", content })}
      deps={[content]}
    >
      {children}
    </Message>
  );
}
