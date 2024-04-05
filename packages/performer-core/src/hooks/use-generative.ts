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
import { GenerativeContext, NodeStatus, PerformerNode } from "../index.js";
import { getLogger } from "../util/log.js";
import { PerformerMessage } from "../message.js";

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

export function useGenerative<MessageType extends PerformerMessage>({
  type,
  deps = [],
  onBeforeResolved,
  onBeforeFinalized,
}: {
  type: PerformerElement["type"];
  deps?: DependencyList;
  onBeforeResolved?: (message: MessageType | null) => void;
  onBeforeFinalized?: (message: MessageType | null) => void;
}): {
  id: string;
  ref: MutableRefObject<any>;
  element: PerformerElement | null;
  message: MessageType | null;
  status: NodeStatus;
  ready: boolean; // message ready for children to consume (streaming|resolved|finalized)
  complete: boolean; // message complete (resolve|finalized)
} {
  const logger = getLogger("useGenerative");
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<NodeStatus>("PENDING");
  const [ancestor, setAncestor] = useState<AncestorRecord | null>(null);
  const [element, setElement] = useState<PerformerElement | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [_, setNonce] = useState(0);
  const [message, setMessage] = useState<MessageType | null>(null);
  const context = useContext(GenerativeContext);
  if (!context) {
    throw Error(
      "Generative context missing. Generative components must be wrapped with `<Generative>` provider.",
    );
  }
  const { performer } = context;

  useLayoutEffect(() => {
    // fixme use internal status
    // if deps change then may need to regenerate node
    setStatus("PENDING");
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
      onStreaming: (node) => {
        if (node.state.message) {
          setMessage(node.state.message as MessageType);
        }
        setStatus(node.status);

        // update nonce for rerender on each stream update
        setNonce((n) => n + 1);
      },
      onResolved: (node) => {
        logger.info(
          `onResolved=${id} message=${JSON.stringify(element?.node?.state.message)}`,
        );
        let message = element.node!.state.message as MessageType;
        if (node.state.message) {
          setMessage(message);
        }
        onBeforeResolved && onBeforeResolved(message);
        setStatus(node.status);
      },
      onError: (error: unknown) => {
        if (!error) {
          error = new Error("Undefined error");
        }
        setStatus("ERROR");
        setError(error);
      },
    });
    setElement(element);
    return () => {
      performer.remove(id);
    };
  }, deps);

  // finalized after render
  useLayoutEffect(() => {
    if (status === "RESOLVED") {
      onBeforeFinalized && onBeforeFinalized(message);
      performer.finalize(id);
      setStatus("FINALIZED");
    }
  }, [status]);

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

  const ready =
    status === "STREAMING" || status === "RESOLVED" || status === "FINALIZED";
  const complete = status === "RESOLVED" || status === "FINALIZED";

  return { id, ref, status, element, message, ready, complete };
}
