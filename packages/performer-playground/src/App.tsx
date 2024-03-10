import { use } from "react";
import { importApps } from "./lib/import.js";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ChatWindow } from "./components/ChatWindow.js";
import { Root } from "./components/Root.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { Splash } from "./components/Splash.js";

function App() {
  const apps = use(importApps());

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Root apps={apps} />,
      errorElement: <ErrorBoundary />,
      children: [
        {
          index: true,
          element: <Splash />,
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

  return <RouterProvider router={router} />;
}

export default App;
