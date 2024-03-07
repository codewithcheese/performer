import { useRenderScope } from "./use-render-scope.js";
import { logger, toLogFmt } from "../util/log.js";

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
      logger.trace(format(message));
    },
    debug(message: string | Pairs) {
      logger.debug(format(message));
    },
    info(message: string | Pairs) {
      logger.info(format(message));
    },
    error(message: string | Pairs) {
      logger.error(format(message));
    },
    warn(message: string | Pairs) {
      logger.warn(format(message));
    },
  };
}
