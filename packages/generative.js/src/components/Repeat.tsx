import { useAfterChildren, useGenerative } from "../hooks/index.js";
import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import { getLogger } from "../util/log.js";

type RepeatProps = {
  limit?: number;
  stopped?: boolean;
  className?: string;
  children?: ReactNode;
};

/**
 *	Repeat the children indefinitely or until stopped or limit is reached if set.
 */
export function Repeat({
  limit,
  stopped = false,
  className,
  children,
}: RepeatProps) {
  const logger = getLogger("Repeat");
  const { id, ref, element, ready, complete } = useGenerative({
    type: "NOOP",
    typeName: "Repeat",
  });
  const [iteration, setIteration] = useState(1);

  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
  });
  logger.debug(
    `id=${id} iteration=${iteration} ready=${ready} complete=${complete} renderCount=${renderCount.current}`,
    Array(iteration).map((_, index) => index),
  );

  useAfterChildren(element, () => {
    if (stopped) {
      return;
    }
    setIteration((i) => {
      if (!limit) {
        return i + 1;
      }
      if (i < limit) {
        logger.debug(`before=${i} after=${i + 1} limit=${limit}`);
        return i + 1;
      } else {
        logger.debug(`i=${i} limit=${limit}`);
        return i;
      }
    });
  });

  return (
    <div data-generative-id={id} ref={ref} className={className}>
      {ready &&
        Array(iteration)
          .fill(true)
          .map((_, index) => {
            logger.debug(`JSX iteration=${index}`);
            return (
              <Fragment key={index}>
                {children}
                {/*{Children.map(children, (child) => cloneElement(child))}*/}
              </Fragment>
            );
          })}
    </div>
  );
}
