import type { PerformerNode } from "../node.js";
import { Performer } from "../performer.js";

/**
 * Set during node render to give hooks access to session, node and nonce.
 */

export type RenderScope = {
  node: PerformerNode;
  performer: Performer;
  nonce: number;
  abortController: AbortController;
};

let _scope: RenderScope | null = null;

export function useRenderScope(): RenderScope {
  if (_scope == null) {
    throw Error(
      "Hook used outside of render. Hooks must be used before await calls.",
    );
  }
  return _scope;
}

export function setRenderScope(scope: RenderScope) {
  if (_scope != null) {
    throw Error("Render scope already set");
  }
  _scope = scope;
  return _scope;
}

export function clearRenderScope() {
  _scope = null;
}
