import { createContext, ReactNode, useState } from "react";
import { Generative, GenerativeOptions } from "../generative.js";

export type GenerativeContextType = {
  generative: Generative;
  signal: AbortSignal;
};

export const GenerativeContext = createContext<GenerativeContextType>(null!);

export function GenerativeProvider({
  children,
  options = {},
}: {
  children: ReactNode;
  options?: GenerativeOptions;
}) {
  const [abortController] = useState(new AbortController());
  const [context] = useState<GenerativeContextType>({
    generative: new Generative(options),
    signal: abortController.signal,
  });
  return (
    <GenerativeContext.Provider value={context}>
      {children}
    </GenerativeContext.Provider>
  );
}
