import { useContext } from "react";
import { PathContext } from "../components/index.js";

/**
 * Lets you access the route data inside a route component
 *
 * Set route data using navigation components Goto and Append
 *
 * e.g. <Goto path="/example" data={"I am route data"} />
 * e.g. <Append path="/example" data={"more route data"} />
 */
export function useRouteData() {
  return useContext(PathContext).data;
}
