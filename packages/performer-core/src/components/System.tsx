import { Action } from "./Action.js";
import { ReactNode } from "react";

export function System({
  content,
  children,
}: {
  content: string;
  children?: ReactNode;
}) {
  return (
    <Action action={() => ({ role: "system", content })}>{children}</Action>
  );
}
