import { Generative } from "./Generative.js";
import { ReactNode } from "react";

export function System({
  content,
  children,
}: {
  content: string;
  children?: ReactNode;
}) {
  return (
    <Generative action={() => ({ role: "system", content })}>
      {children}
    </Generative>
  );
}
