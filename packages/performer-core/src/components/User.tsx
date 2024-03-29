import { ReactNode } from "react";
import { useGenerative } from "../hooks/use-generative.js";

export function User({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { id, ref, isPending } = useGenerative("LISTENER");

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
