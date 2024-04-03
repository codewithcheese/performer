import { resolveMessages } from "../render.js";
import { useContext } from "react";
import { GenerativeContext } from "../components/index.js";

export function useMessages() {
  const context = useContext(GenerativeContext);
  return resolveMessages(context.performer.root, scope.node);
}
