import { createContext, ReactNode, useContext, useState } from "react";
import { Performer, PerformerOptions } from "../performer.js";

type GenerativeContext = {
  performer: Performer;
  signal: AbortSignal;
};

export const GenerativeContext = createContext<GenerativeContext>(null!);

export function Generative({
  children,
  options = {},
}: {
  children: ReactNode;
  options?: PerformerOptions;
}) {
  const [abortController] = useState(new AbortController());
  const [context] = useState<GenerativeContext>({
    performer: new Performer(options),
    signal: abortController.signal,
  });
  return (
    <GenerativeContext.Provider value={context}>
      {children}
    </GenerativeContext.Provider>
  );
}
