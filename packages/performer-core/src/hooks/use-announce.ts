import { PerformerEvent } from "../event.js";
import { useRenderScope } from "./use-render-scope.js";

export function useAnnounce() {
  const scope = useRenderScope();
  return (event: PerformerEvent) => scope.performer.announce(event);
}
