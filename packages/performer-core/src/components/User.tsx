import { ReactNode } from "react";
import { useGenerative } from "../hooks/use-generative.js";
import { PerformerMessage } from "../message.js";
import { Action } from "./Action.js";

export function User({
  children,
  className,
}: {
  children?: ReactNode | ((message: PerformerMessage) => ReactNode);
  className?: string;
}) {
  return (
    <Action className={className} action="LISTENER">
      {children}
    </Action>
  );
}
