import { PerformerElement } from "../element.js";
import { useContext, useEffect, useState } from "react";
import { GenerativeContext } from "../components/Generative.js";

export function useAfterChildren(
  element: PerformerElement | null,
  callback: () => void,
) {
  const [finalize, setFinalize] = useState(false);
  const { performer } = useContext(GenerativeContext);
  useEffect(() => {
    element &&
      (element.props.afterChildren = () => {
        callback();
        setFinalize(true);
      });
  }, [element]);
  // finalize after render
  useEffect(() => {
    if (finalize && element) {
      performer.finalize(element.id);
      setFinalize(false);
    }
  }, [finalize]);
}
