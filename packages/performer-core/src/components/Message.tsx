import { DependencyList, ReactNode } from "react";
import { useGenerative } from "../hooks/index.js";
import { PerformerMessage } from "../message.js";
import { PerformerElement } from "../element.js";

export function Message<MessageType extends PerformerMessage>({
  action,
  className,
  children,
  deps = [],
}: {
  className?: string;
  action: PerformerElement["type"];
  children?: ReactNode | ((message: MessageType) => ReactNode);
  deps?: DependencyList;
}) {
  const { id, ref, isPending, message } = useGenerative<MessageType>(
    action,
    deps,
  );

  // const renderCount = useRef(0);
  // useEffect(() => {
  //   renderCount.current++;
  // });
  // console.log(
  //   `Generative id=${id} isPending=${isPending} renderCount=${renderCount.current}`,
  // );

  return (
    <div data-performer-id={id} ref={ref} className={className}>
      {!isPending &&
        (typeof children === "function" ? children(message!) : children)}
    </div>
  );
}
