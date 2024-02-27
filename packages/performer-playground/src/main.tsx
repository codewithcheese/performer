import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./index.css";
import { importApps } from "./lib/import.js";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { ChatWindow } from "./components/ChatWindow.js";

if ("VITE_OPENAI_API_KEY" in import.meta.env) {
  // @ts-ignore
  globalThis.process = {
    env: { OPENAI_API_KEY: import.meta.env["VITE_OPENAI_API_KEY"] },
  };
}

const apps = await importApps();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App apps={apps} />,
    children: [
      {
        index: true,
        element: <>{apps.length && <Navigate replace to={apps[0].slug} />}</>,
      },
      ...apps.map((app) => {
        return {
          path: app.slug,
          element: <ChatWindow App={app.module.App} />,
        };
      }),
    ],
  },
]);

console.log("Playground apps loaded...", apps);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />,
);
