import { Action } from "./Action.js";
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
    <Action action={() => ({ role: "system", content })} deps={[content]}>
      {children}
    </Action>
  );
}
