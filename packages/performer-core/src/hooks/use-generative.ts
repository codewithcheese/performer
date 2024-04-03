import {
  DependencyList,
  MutableRefObject,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { PerformerElement } from "../element.js";
import { GenerativeContext } from "../index.js";
import { getLogger } from "../util/log.js";
import { PerformerMessage } from "../message.js";

const logger = getLogger("useGenerative");

type AncestorRecord = { id: string; type: "parent" | "sibling" };

export function findDOMAncestor(
  element: HTMLElement,
  attrName: string = "data-performer-id",
): AncestorRecord {
  // Check previous siblings
  let sibling = element.previousElementSibling;
  while (sibling) {
    const id = sibling.getAttribute(attrName);
    if (id != null) {
      return { id, type: "sibling" };
    }
    sibling = sibling.previousElementSibling;
  }

  // Check parent elements
  let parent = element.parentElement;
  while (parent) {
    const id = parent.getAttribute(attrName);
    if (id != null) {
      return { id, type: "parent" };
    }
    parent = parent.parentElement;
  }

  // No matching element found
  return { id: "root", type: "parent" };
}

export function useGenerative(
  type: PerformerElement["type"],
  deps: DependencyList = [],
): {
  id: string;
  ref: MutableRefObject<any>;
  isPending: boolean;
  element: PerformerElement | null;
  messages: PerformerMessage[];
} {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [isPending, setIsPending] = useState(true);
  const [finalize, setFinalize] = useState(false);
  const [ancestor, setAncestor] = useState<AncestorRecord | null>(null);
  const [element, setElement] = useState<PerformerElement | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [_, setNonce] = useState(0);
  const [messages, setMessages] = useState<PerformerMessage[]>([]);
  const context = useContext(GenerativeContext);
  if (!context) {
    throw Error(
      "Generative context not set. Generative components must be wrapped with `<Generative>` provider.",
    );
  }
  const { performer } = context;

  useLayoutEffect(() => {
    setIsPending(true);
    setFinalize(false);
    if (!ref.current) {
      throw Error("usePerformer: ref not set");
    }
    if (!ref.current.getAttribute("data-performer-id")) {
      console.error(
        "usePerformer: data-performer-id attribute not set",
        ref.current,
      );
      throw Error("usePerformer: data-performer-id attribute not set");
    }
    const ancestor = findDOMAncestor(ref.current);
    setAncestor(ancestor);
    const element = performer.upsert({
      id,
      type,
      ancestor,
      onStreaming: () => {
        if (element.node?.state.messages) {
          setMessages(element.node.state.messages);
        }
        // complete pending before finalized
        setIsPending(false);

        // update nonce for rerender on each stream update
        setNonce((n) => n + 1);
      },
      onFinalize: () => {
        logger.info(`onFinalize=${id}`);
        if (element.node?.state.messages) {
          setMessages(element.node.state.messages);
        }
        setIsPending(false);
        setFinalize(true);
      },
      onError: (error: unknown) => {
        if (!error) {
          error = new Error("Undefined error");
        }
        setError(error);
      },
    });
    setElement(element);
    return () => {
      performer.remove(id);
    };
  }, deps);

  // finalize after render
  useLayoutEffect(() => {
    if (finalize) {
      performer.finalize(id);
      setFinalize(false);
    }
  }, [finalize]);

  const renderCount = useRef(0);
  useLayoutEffect(() => {
    if (!ref.current) {
      throw Error("usePerformer: ref not set");
    }
    if (!ancestor) {
      return;
    }
    const currentAncestor = findDOMAncestor(ref.current);
    if (currentAncestor.id !== ancestor.id) {
      setAncestor(currentAncestor);
      performer.updateAncestor(id, currentAncestor, ancestor);
    }
    renderCount.current++;
    // console.log(
    //   `Generative id=${id} ancestorId=${currentAncestor.id} isPending=${isPending} renderCount=${renderCount.current}`,
    // );
  });

  if (error) throw error;

  return { id, ref, isPending, element, messages };
}
