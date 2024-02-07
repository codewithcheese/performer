import {
  createContext,
  useContextProvider,
  useContext,
  useState,
  useToolData,
} from "../hooks/index.js";
import { PerformerElement } from "../element.js";
import { batch, Signal } from "@preact/signals-core";
import { Assistant, createTool, Tool } from "./Assistant.js";
import { z } from "zod";

export type Routes = { path: string; component: PerformerElement }[];

export const routesContext = createContext<Routes>("routes");
export const pathContext = createContext<string>("routerPath");
export const routeDataContext = createContext<any>("routeData");

export function Router({ routes }: { routes: Routes }) {
  useContextProvider(routesContext, routes);
  useContextProvider(routeDataContext, undefined);
  const path = useContextProvider(pathContext, "/");

  return () => {
    const route = routes.find((route) => route.path === path.value);
    if (!route) {
      throw Error(`No route found for path ${path}`);
    }
    return route.component;
  };
}

export function Goto({ path, data }: { path: string; data?: any }) {
  // add messages dependency to wait for messages
  const currentPath = useContext(pathContext);
  const currentData = useContext(routeDataContext);

  batch(() => {
    currentPath.value = path;
    currentData.value = data;
  });

  return () => {};
}

export function Append({ path }: { path: string }) {
  const routes = useContext(routesContext);
  return () => {
    const route = routes.value.find((route: any) => route.path === path);
    if (!route) {
      throw Error(`Append route not found for path ${path}`);
    }
    return route.component;
  };
}

function createSelectPathTool(
  decision: Signal<{ reasoning: string; path: string } | null>,
  paths: string[],
) {
  const DecisionSchema = z
    .object({
      reasoning: z
        .string()
        .describe(
          "Use deductive logic to reason about the next path. Think out loud and reason step by step.",
        ),
      path: z.string(),
    })
    .describe(
      "Examine the conversation history and select the next path to take. The possible paths are: " +
        paths.join(", "),
    );
  return createTool("select_path", DecisionSchema, (data) => {
    decision.value = data;
  });
}

export function Decision({
  instruction,
  operation = "append",
}: {
  instruction: string;
  operation?: "append" | "goto";
}) {
  const decision = useState<{ reasoning: string; path: string } | null>(null);
  const next = useState<string | null>(null);
  const routes = useContext(routesContext);

  return () => {
    const paths = routes.value.map((route) => route.path);
    const selectPathTool = createSelectPathTool(decision, paths);

    if (decision.value === null) {
      return (
        <>
          <system>{instruction}</system>
          <Assistant toolChoice={selectPathTool} tools={[selectPathTool]} />
        </>
      );
    } else {
      return (
        <>
          <system>{decision.value.reasoning}</system>
          {operation === "append" ? (
            <Append path={decision.value.path} />
          ) : (
            <Goto path={decision.value.path} />
          )}
        </>
      );
    }
  };
}
