import { DependencyList, ReactNode, useEffect } from "react";
import { useGenerative } from "../hooks/index.js";
import { AssistantMessage, PerformerMessage } from "../message.js";
import { PerformerElement } from "../element.js";

export type MessageRenderFunc<MessageType extends PerformerMessage> = (
  message: MessageType,
  complete: boolean,
) => ReactNode;

export function Message<MessageType extends PerformerMessage>({
  type,
  className,
  children,
  deps = [],
  onMessage,
}: {
  className?: string;
  type: PerformerElement["type"];
  children?: ReactNode | MessageRenderFunc<MessageType>;
  deps?: DependencyList;
  onMessage?: (message: MessageType) => void;
}) {
  const { id, ref, status, message, ready, complete } =
    useGenerative<MessageType>(type, deps);

  useEffect(() => {
    if (status === "FINALIZED" && message && onMessage) {
      onMessage(message);
    }
  }, [status]);

  // const renderCount = useRef(0);
  // useEffect(() => {
  //   renderCount.current++;
  // });
  // console.log(
  //   `Generative id=${id} isPending=${isPending} renderCount=${renderCount.current}`,
  // );

  return (
    <div data-performer-id={id} ref={ref} className={className}>
      {ready &&
        (typeof children === "function"
          ? children(message!, complete)
          : children)}
    </div>
  );
}
