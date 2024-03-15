import { useContext } from "./use-context.js";
import { routeDataContext } from "../components/index.js";
import { Signal } from "@preact/signals-core";

/**
 * Lets you access the route data inside a route component
 *
 * Set route data using navigation components Goto and Append
 *
 * e.g. <Goto path="/example" data={"I am route data"} />
 * e.g. <Append path="/example" data={"more route data"} />
 *
 * Unwraps the context signal since route data is not reactive.
 * It is set once and used once per route component navigation.
 */
export function useRouteData<STATE>(): STATE {
  const data = useContext<STATE>(routeDataContext);
  return data.value;
}
