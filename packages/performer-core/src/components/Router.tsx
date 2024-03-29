// import {
//   createContext,
//   useContext,
//   useContextProvider,
//   useState,
// } from "../hooks/index.js";
// import { PerformerElement } from "../element.js";
// import { batch, Signal } from "@preact/signals-core";
// import { Assistant } from "./Assistant.js";
// import { z } from "zod";
// import { createTool } from "../tool.js";
//
// export type Route = { path: string; component: PerformerElement };
// export type Routes = Route[];
//
// export const routesContext = createContext<Routes>("routes");
// export const pathContext = createContext<string>("routerPath");
// export const routeDataContext = createContext<any>("routeData");
//
// export function Router({ routes }: { routes: Routes }) {
//   useContextProvider(routesContext, routes);
//   useContextProvider(routeDataContext, undefined);
//   const path = useContextProvider(pathContext, "/");
//
//   return () => {
//     const route = routes.find((route) => route.path === path.value);
//     if (!route) {
//       throw Error(`No route found for path ${path}`);
//     }
//     return route.component;
//   };
// }
//
// export function Goto({ path, data }: { path: string; data?: any }) {
//   const currentPath = useContext(pathContext);
//   const currentData = useContext(routeDataContext);
//
//   batch(() => {
//     currentPath.value = path;
//     currentData.value = data;
//   });
//
//   return () => {};
// }
//
// export function Append({ path, data }: { path: string; data?: any }) {
//   const routes = useContext(routesContext);
//   const currentData = useContext(routeDataContext);
//   currentData.value = data;
//
//   return () => {
//     const route = routes.value.find((route: any) => route.path === path);
//     if (!route) {
//       throw Error(`Append route not found for path ${path}`);
//     }
//     return route.component;
//   };
// }
//
// function createSelectPathTool(
//   decision: Signal<{ reasoning: string; nextPath: string } | null>,
//   paths: string[],
//   currentPath: string,
// ) {
//   const DecisionSchema = z
//     .object({
//       reasoning: z
//         .string()
//         .describe(
//           "Use deductive logic to reason about the next path. Think out loud and reason step by step.",
//         ),
//       nextPath: z.string(),
//       currentPath: z.literal(currentPath),
//     })
//     .describe(
//       `Examine the conversation history and select the next path to take. The possible paths are: ${paths.join(", ")}. If unsure select the current path.`,
//     );
//   return createTool("select_path", DecisionSchema, (data) => {
//     decision.value = data;
//   });
// }
//
// export function Decision({
//   instruction,
//   operation = "append",
// }: {
//   instruction: string;
//   operation?: "append" | "goto";
// }) {
//   const decision = useState<{ reasoning: string; nextPath: string } | null>(
//     null,
//   );
//   const currentPath = useContext(pathContext);
//   const routes = useContext(routesContext);
//
//   return () => {
//     const paths = routes.value.map((route) => route.path);
//     const selectPathTool = createSelectPathTool(
//       decision,
//       paths,
//       currentPath.value,
//     );
//
//     if (decision.value === null) {
//       return (
//         <>
//           <system>{instruction}</system>
//           <Assistant toolChoice={selectPathTool} tools={[selectPathTool]} />
//         </>
//       );
//     } else {
//       return (
//         <>
//           <system>{decision.value.reasoning}</system>
//           {operation === "append" ? (
//             <Append path={decision.value.nextPath} />
//           ) : (
//             <Goto path={decision.value.nextPath} />
//           )}
//         </>
//       );
//     }
//   };
// }
