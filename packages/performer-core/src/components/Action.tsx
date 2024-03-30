import { ReactNode } from "react";
import { useGenerative } from "../hooks/use-generative.js";
import { ActionType } from "../action.js";
import { PerformerMessage } from "../message.js";
import { PerformerElement } from "../element.js";

export function Action({
  action,
  className,
  children,
}: {
  className?: string;
  action: PerformerElement["type"];
  children?: ReactNode | ((message: PerformerMessage) => ReactNode);
}) {
  const { id, ref, isPending, messages } = useGenerative(action);

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
        (typeof children === "function" ? messages.map(children) : children)}
    </div>
  );
}
