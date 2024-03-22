import { useRenderScope } from "./use-render-scope.js";
import { logger, toLogFmt } from "../util/log.js";

type Pairs = [string, any][];

export function useLogger() {
  const scope = useRenderScope();
  const format = (message: string | Pairs) => {
    const pairs: [string, any][] = [];
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
      logger.withTag(scope.node._typeName).trace(format(message));
    },
    debug(message: string | Pairs) {
      logger.withTag(scope.node._typeName).debug(format(message));
    },
    info(message: string | Pairs) {
      logger.withTag(scope.node._typeName).info(format(message));
    },
    error(message: string | Pairs) {
      logger.withTag(scope.node._typeName).error(format(message));
    },
    warn(message: string | Pairs) {
      logger.withTag(scope.node._typeName).warn(format(message));
    },
  };
}
