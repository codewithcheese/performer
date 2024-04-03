import { Message } from "./Message.js";
import { ReactNode } from "react";
import { PerformerMessage } from "../message.js";

export function System({
  content,
  children,
}: {
  content: string;
  children?: ReactNode | ((message: PerformerMessage) => ReactNode);
}) {
  return (
    <Message action={() => ({ role: "system", content })} deps={[content]}>
      {children}
    </Message>
  );
}
