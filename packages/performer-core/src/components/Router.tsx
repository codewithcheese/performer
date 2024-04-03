import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Assistant, createTool, System } from "../index.js";
import { z } from "zod";

export type Route = { path: string; component: ReactNode };
export type Routes = Route[];

export type RouterContextValue = {
  routes: Routes;
};
export const RouterContext = createContext<RouterContextValue>(null!);

export type PathContextValue = {
  path: string;
  data: any;
};

export const PathContext = createContext<
  PathContextValue & { update: (value: PathContextValue) => void }
>(null!);

export function Router({ routes }: { routes: Routes }) {
  const [routerValue, setRouterValue] = useState<RouterContextValue>({
    routes,
  });
  const [pathValue, setPathValue] = useState<PathContextValue>({
    path: "/",
    data: null,
  });

  const update = useCallback(
    (value: PathContextValue) => {
      setPathValue(value);
    },
    [setPathValue],
  );

  const path = pathValue.path;
  const route = routerValue.routes.find((route) => route.path === path);
  if (!route) {
    throw Error(`No route found for path ${path}`);
  }

  return (
    <RouterContext.Provider value={{ ...routerValue }}>
      <PathContext.Provider value={{ ...pathValue, update }}>
        {route!.component}
      </PathContext.Provider>
    </RouterContext.Provider>
  );
}

export function Goto({ path, data }: { path: string; data?: any }) {
  const pathContext = useContext(PathContext);

  useEffect(() => {
    pathContext.update({ path, data });
  }, [path, data]);

  return null;
}

export function Append({ path, data }: { path: string; data?: any }) {
  const routerContext = useContext(RouterContext);
  const pathContext = useContext(PathContext);

  useEffect(() => {
    pathContext.update({ path, data });
  }, [path, data]);

  const route = routerContext.routes.find((route: any) => route.path === path);
  if (!route) {
    throw Error(`Append route not found for path ${path}`);
  }

  return route.component;
}

function createSelectPathTool(
  paths: string[],
  currentPath: string,
  callback: (data: {
    reasoning: string;
    nextPath: string;
    currentPath: string;
  }) => void,
) {
  const DecisionSchema = z
    .object({
      reasoning: z
        .string()
        .describe(
          "Use deductive logic to reason about the next path. Think out loud and reason step by step.",
        ),
      nextPath: z.string(),
      currentPath: z.literal(currentPath),
    })
    .describe(
      `Examine the conversation history and select the next path to take. The possible paths are: ${paths.join(", ")}. If unsure select the current path.`,
    );
  return createTool("select_path", DecisionSchema, callback);
}

export function Decision({
  instruction,
  operation = "append",
}: {
  instruction: string;
  operation?: "append" | "goto";
}) {
  const [decision, setDecision] = useState<{
    reasoning: string;
    nextPath: string;
  } | null>(null);
  const pathContext = useContext(PathContext);
  const routerContext = useContext(RouterContext);

  const paths = routerContext.routes.map((route) => route.path);
  const selectPathTool = createSelectPathTool(
    paths,
    pathContext.path,
    (data) => {
      setDecision(data);
    },
  );

  if (!decision) {
    return (
      <>
        <System content={instruction} />
        <Assistant toolChoice={selectPathTool} tools={[selectPathTool]} />
      </>
    );
  } else {
    return (
      <>
        <System content={decision.reasoning} />
        {operation === "append" ? (
          <Append path={decision.nextPath} />
        ) : (
          <Goto path={decision.nextPath} />
        )}
      </>
    );
  }
}
