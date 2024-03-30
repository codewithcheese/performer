import { PerformerElement } from "../element.js";
import { useContext, useEffect, useState } from "react";
import { GenerativeContext } from "../components/Generative.js";

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
