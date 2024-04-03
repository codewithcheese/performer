import { ReactNode } from "react";
import { UserMessage } from "../message.js";
import { Message } from "./Message.js";

export function User({
  children,
  className,
}: {
  children?: ReactNode | ((message: UserMessage) => ReactNode);
  className?: string;
}) {
  return (
    <Message<UserMessage> className={className} action="LISTENER">
      {children}
    </Message>
  );
}
