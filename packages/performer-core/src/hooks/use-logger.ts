import { useRenderScope } from "./use-render-scope.js";
import log from "loglevel";
import { toLogFmt } from "../util/log.js";

type Pairs = [string, any][];

export function useLogger() {
  const scope = useRenderScope();
  const format = (message: string | Pairs) => {
    const pairs: [string, any][] = [["component", scope.node._typeName]];
    if (Array.isArray(message)) {
      pairs.push(...message);
    } else {
      pairs.push(["message", message]);
    }
    pairs.push(["threadId", scope.node.threadId]);
    return toLogFmt(pairs);
  };
  return {
    trace(message: string | Pairs) {
      log.trace(format(message));
    },
    debug(message: string | Pairs) {
      log.debug(format(message));
    },
    info(message: string | Pairs) {
      log.info(format(message));
    },
    error(message: string | Pairs) {
      log.error(format(message));
    },
    warn(message: string | Pairs) {
      log.warn(format(message));
    },
  };
}
