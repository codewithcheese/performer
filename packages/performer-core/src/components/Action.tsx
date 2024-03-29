import { ReactNode } from "react";
import { useGenerative } from "../hooks/use-generative.js";
import { Action } from "../action.js";

export function Action({
  action,
  className,
  children,
}: {
  className?: string;
  action: Action;
  children?: ReactNode;
}) {
  const { id, ref, isPending } = useGenerative(action);

  // const renderCount = useRef(0);
  // useEffect(() => {
  //   renderCount.current++;
  // });
  // console.log(
  //   `Generative id=${id} isPending=${isPending} renderCount=${renderCount.current}`,
  // );

  return (
    <div data-performer-id={id} ref={ref} className={className}>
      {!isPending && children}
    </div>
  );
}
