import { useAfterChildren } from "../hooks/index.js";
import {
  Children,
  cloneElement,
  Fragment,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useGenerative } from "../hooks/use-generative.js";
import { getLogger } from "../util/log.js";

const logger = getLogger("Repeat");

type RepeatProps = {
  limit: number;
  children: ReactNode;
};

/**
 *	Repeat the children indefinitely or until limit is reached if set.
 */
export function Repeat({ limit = 1, children }: RepeatProps) {
  const { id, ref, element, isPending } = useGenerative(() => {});
  const [iteration, setIteration] = useState(1);

  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
  });
  logger.debug(
    `Repeat id=${id} iteration=${iteration} isPending=${isPending} renderCount=${renderCount.current}`,
    Array(iteration).map((_, index) => index),
  );

  useAfterChildren(element, () => {
    setIteration((i) => {
      if (i < limit) {
        logger.debug(
          `Repeat:useAfterChildren before=${i} after=${i + 1} limit=${limit}`,
        );
        return i + 1;
      } else {
        logger.debug(`Repeat:useAfterChildren i=${i} limit=${limit}`);
        return i;
      }
    });
  });

  return (
    <div ref={ref} data-performer-id={id}>
      {!isPending &&
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
