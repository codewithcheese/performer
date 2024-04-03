import { ReactNode } from "react";
import { useGenerative } from "../hooks/use-generative.js";
import { PerformerMessage } from "../message.js";
import { Message } from "./Message.js";

export function User({
  children,
  className,
}: {
  children?: ReactNode | ((message: PerformerMessage) => ReactNode);
  className?: string;
}) {
  return (
    <Message className={className} action="LISTENER">
      {children}
    </Message>
  );
}
