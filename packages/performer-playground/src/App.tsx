import { useEffect, useState } from "react";
import { AppImport, importApps } from "./lib/import.js";
import { ChatWindow } from "./components/ChatWindow.js";

function App() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<AppImport[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppImport | null>(null);
  useEffect(() => {
    importApps()
      .then((apps) => {
        setApps(apps);
        if (apps.length > 0) {
          setSelectedApp(apps[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return loading ? (
    <div>Loading...</div>
  ) : selectedApp ? (
    <ChatWindow App={selectedApp.module.App} />
  ) : (
    // todo nice UI with instructions for creating first app
    <div>
      <p>No apps found in {import.meta.env.VITE_PERFORMER_APP_PATH}</p>
      <p>Usage: playground &lt;import-path&gt;</p>
    </div>
  );
}

export default App;
