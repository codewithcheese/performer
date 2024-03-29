import { ReactNode } from "react";
import { useGenerative } from "../hooks/use-generative.js";

export function User({ children }: { children: ReactNode }) {
  const { id, ref } = useGenerative(() => {});
  return (
    <div data-performer-id={id} ref={ref}>
      {children}
    </div>
  );
}
