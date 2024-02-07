import {
  createContext,
  useContextProvider,
  useContext,
  useState,
} from "../hooks/index.js";
import { PerformerElement } from "../element.js";
import { batch } from "@preact/signals-core";
import { Assistant, Tool } from "./Assistant.js";
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

export function Decision({
  instruction,
  operation = "append",
}: {
  instruction: string;
  operation?: "append" | "goto";
}) {
  const decision = useState<string>("");
  const next = useState<string | null>(null);
  const routes = useContext(routesContext);

  return () => {
    const paths = routes.value.map((route) => route.path);
    const decisionTool: Tool = {
      id: "decision_tool",
      name: "select_path",
      description:
        "Examine the conversation history and select the next path to take. The possible paths are: " +
        paths.join(", "),
      params: z.object({
        reasoning: z
          .string()
          .describe(
            "Use deductive logic to reason about the next path. Think out loud and reason step by step.",
          ),
        path: z.string(),
      }),
      async call(_, { reasoning, path }: z.infer<typeof this.params>) {
        decision.value = reasoning;
        next.value = path;
      },
    };

    if (next.value === null) {
      return (
        <>
          <system>{instruction}</system>
          <Assistant toolChoice={decisionTool} tools={[decisionTool]} />
        </>
      );
    } else {
      return (
        <>
          <system>{decision.value}</system>
          {operation === "append" ? (
            <Append path={next.value} />
          ) : (
            <Goto path={next.value} />
          )}
        </>
      );
    }
  };
}
