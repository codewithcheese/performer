import { useContext } from "./use-context.js";
import { routeDataContext } from "../components/index.js";
import { Signal } from "@preact/signals-core";

export function useRouteData<STATE>(): Signal<STATE> {
  return useContext<STATE>(routeDataContext);
}
