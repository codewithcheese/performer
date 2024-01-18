import { useEffect, useState } from "react";
import { Component, isLifecycleEvent, isMessageEvent } from "@performer/core";
import { usePerformerClient } from "./use-performer-client.ts";
import {
  Divider,
  Message,
  MessageInput,
  ModelSelect,
  Splash,
} from "./components";

function Chat({ app }: { app: AppImport }) {
  const { events, sendMessage } = usePerformerClient(app.module.App);

  return (
    <div role="presentation" className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="relative h-full">
          <div className="absolute left-0 right-0">
            <ModelSelect />
            <div className="relative mb-2 flex-shrink-0">
              <div className="flex justify-center py-1">
                <div className="group flex items-center gap-2 text-lg font-medium">
                  <div className="icon-md"></div>
                  <button className="flex items-center gap-2 font-semibold text-gray-700">
                    Preview
                    <div
                      className="text-token-text-primary"
                      data-projection-id="101"
                      style={{ transform: "none" }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="icon-md invisible group-hover:visible"
                      >
                        <path
                          d="M4.5 3.5V8H9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          d="M4.5 7.99645C5.93143 5.3205 8.75312 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.6439 20.5 4.05313 17.2232 3.5582 13"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        ></path>
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            {events.map((event, index) => {
              if (isMessageEvent(event)) {
                return <Message key={index} message={event.payload} />;
              } else if (isLifecycleEvent(event)) {
                return (
                  <Divider
                    key={index}
                    message={`Performer ${event.payload.state}`}
                  />
                );
              }
            })}
          </div>
          <Splash />
        </div>
      </div>
      <div className="w-full pt-2 dark:border-white/20 md:w-[calc(100%-.5rem)] md:border-transparent md:pt-0 md:dark:border-transparent">
        <MessageInput onSubmit={(text) => sendMessage(text)} />
        <div className="relative px-2 py-2 text-center text-xs text-gray-600 dark:text-gray-300 md:px-[60px]">
          <span>
            AI can make mistakes. Consider checking important information.
          </span>
        </div>
      </div>
    </div>
  );
}

type AppImport = {
  name: string;
  path: string;
  module: Record<string, any>;
};

async function importApps(): Promise<AppImport[]> {
  const modules = import.meta.glob("@app/*.(tsx|jsx)");
  const imports: AppImport[] = [];
  for (const [path, loader] of Object.entries(modules)) {
    const module = (await loader()) as Record<string, unknown> & {
      meta?: { name?: string };
      App: Component<any>;
    };
    if (!("App" in module)) {
      console.warn(`No \`App\` export found in ${path}, skipping import`);
      continue;
    }
    let name: string;
    if (
      "meta" in module &&
      module.meta &&
      "name" in module.meta &&
      module.meta.name
    ) {
      name = module.meta.name;
    } else {
      // use filename
      name = path.split("/").pop()!.split(".").shift()!;
    }
    console.log(path, module);
    imports.push({
      name,
      path,
      module: module as Record<string, any>,
    });
  }
  return imports;
}

function App() {
  const [apps, setApps] = useState<AppImport[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppImport | null>(null);
  useEffect(() => {
    importApps().then((apps) => {
      setApps(apps);
      if (apps.length > 0) {
        setSelectedApp(apps[0]);
      }
    });
  }, []);

  return selectedApp ? <Chat app={selectedApp} /> : <div>Loading...</div>;
}

export default App;
