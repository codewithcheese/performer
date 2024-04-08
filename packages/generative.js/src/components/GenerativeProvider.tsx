import { createContext, ReactNode, useState } from "react";
import { Generative, GenerativeOptions } from "../generative.js";
import { GenerativeMessage } from "../message.js";

export type GenerativeContextType = {
  generative: Generative;
  signal: AbortSignal;
};

export const GenerativeContext = createContext<GenerativeContextType>(null!);

export function GenerativeProvider({
  children,
  options = {},
  handlers = {},
}: {
  children?: ReactNode;
  options?: GenerativeOptions;
  handlers?: { onFinished?: (messages: GenerativeMessage[]) => void };
}) {
  const [abortController] = useState(new AbortController());
  const [context] = useState<GenerativeContextType>({
    generative: new Generative(options, handlers),
    signal: abortController.signal,
  });
  return (
    <GenerativeContext.Provider value={context}>
      {children}
    </GenerativeContext.Provider>
  );
}
