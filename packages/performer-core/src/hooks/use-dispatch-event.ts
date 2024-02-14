import { PerformerEvent } from "../event.js";
import { useRenderScope } from "./use-render-scope.js";

export function useDispatchEvent() {
  const scope = useRenderScope();
  return (event: PerformerEvent) => scope.performer.dispatchEvent(event);
}
