import { useContext, useEffect } from "react";
import { GenerativeContext, PerformerElement } from "../index.js";

export function useAfterChildren(
  element: PerformerElement | null,
  callback: () => void,
) {
  const { performer } = useContext(GenerativeContext);
  useEffect(() => {
    element &&
      (element.props.afterChildren = () => {
        callback();
      });
  }, [element]);
}
