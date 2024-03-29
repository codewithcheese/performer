import {
  MutableRefObject,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { PerformerElement } from "../element.js";
import { GenerativeContext } from "../components/Generative.js";
import { Action } from "../action.js";
import { getLogger } from "../util/log.js";
import { PerformerMessage } from "../message.js";

const logger = getLogger("useGenerative");

export function findPreviousElement(
  element: HTMLElement,
  attrName: string = "data-performer-id",
): { id: string; type: "parent" | "sibling" } | null {
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
  return null;
}

export function useGenerative(type: PerformerElement["type"]): {
  id: string;
  ref: MutableRefObject<any>;
  isPending: boolean;
  element: PerformerElement | null;
} {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [isPending, setIsPending] = useState(true);
  const [finalize, setFinalize] = useState(false);
  const [element, setElement] = useState<PerformerElement | null>(null);
  const { performer } = useContext(GenerativeContext);

  useEffect(() => {
    // setIsPending(true);
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
    const previous = findPreviousElement(ref.current);
    const element = performer.insert({
      id,
      type,
      previous,
      notify: () => {
        setFinalize(true);
        setIsPending(false);
      },
    });
    setElement(element);
    return () => {
      // performer.remove();
    };
  }, []);

  // finalize after render
  useEffect(() => {
    if (finalize) {
      performer.finalize(id);
      setFinalize(false);
    }
  }, [finalize]);

  return { id, ref, isPending, element };
}
