import { DependencyList, FC, ReactNode, useEffect } from "react";
import { useGenerative } from "../hooks/index.js";
import { AssistantMessage, GenerativeMessage } from "../message.js";
import { GenerativeElement } from "../element.js";

export type MessageRenderFunc<MessageType extends GenerativeMessage> = (
  message: MessageType,
  complete: boolean,
) => ReactNode;

export function Message<MessageType extends GenerativeMessage>({
  type,
  typeName,
  className,
  children,
  deps = [],
  onBeforeResolved,
  onBeforeFinalized,
}: {
  className?: string;
  type: GenerativeElement["type"];
  typeName?: string;
  children?: ReactNode | MessageRenderFunc<MessageType>;
  deps?: DependencyList;
  onBeforeResolved?: (message: MessageType) => void;
  onBeforeFinalized?: (message: MessageType) => void;
}) {
  const { id, ref, status, message, ready, complete } =
    useGenerative<MessageType>({
      type,
      typeName,
      deps,
      onBeforeResolved,
      onBeforeFinalized,
    });

  // const renderCount = useRef(0);
  // useEffect(() => {
  //   renderCount.current++;
  // });
  // console.log(
  //   `Generative id=${id} isPending=${isPending} renderCount=${renderCount.current}`,
  // );

  return (
    <div data-generative-id={id} ref={ref} className={className}>
      {ready &&
        (typeof children === "function"
          ? children(message!, complete)
          : children)}
    </div>
  );
}

/**
 * Wraps a component with a Message component.
 * For when the component should render in turn.
 */
export function withMessage<Props extends Record<string, any>>(
  type: GenerativeElement["type"],
) {
  return function (Component: FC<Props>) {
    return function (props: Props) {
      return (
        <Message type={type}>
          <Component {...props} />
        </Message>
      );
    };
  };
}
