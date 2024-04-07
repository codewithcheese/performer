import { useMemo } from "react";
import { GenerativeElement, GenerativeMessage } from "../index.js";

export function useAfterChildren(
  element: GenerativeElement | null,
  callback: (messages: GenerativeMessage[]) => void,
) {
  useMemo(() => {
    element && (element.props.afterChildren = callback);
  }, [element, callback]);
}
