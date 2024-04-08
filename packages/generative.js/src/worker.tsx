import {
  ReactNode,
  ReactPortal,
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { GenerativeProvider } from "./components/index.js";
import { GenerativeMessage } from "./message.js";

/**
 * Uses React Portal to create independent instances of Generative.
 * onFinished callback to receives messages instance has finished.
 * Check worker.test.tsx for usage. Experimental, not great DX yet.
 *
 * @returns [worker, finished] - worker is the React Portal instance, finished is a boolean indicating if the worker has finished.
 */
export function createWorker(
  children: ReactNode,
  key: string,
  options: {
    container?: HTMLElement;
    onFinished?: (messages: GenerativeMessage[]) => void;
  } = {},
): [ReactPortal, boolean] {
  const id = useId();
  const [finished, setFinished] = useState(false);
  const finishHandler = useCallback(
    (messages: GenerativeMessage[]) => {
      setFinished(true);
      options.onFinished && options.onFinished(messages);
    },
    [options.onFinished],
  );
  const worker = useMemo(() => {
    const container = options.container || document.createElement("div");
    container.setAttribute("data-generative-worker-id", id);
    document.body.appendChild(container);
    return createPortal(
      <GenerativeProvider handlers={{ onFinished: finishHandler }}>
        {children}
      </GenerativeProvider>,
      container,
      key,
    );
  }, [key]);

  return [worker, finished];
}
