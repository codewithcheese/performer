import { Divider, Message, ModelSelect, Splash } from "./index.js";
import {
  Component,
  PerformerLifecycleEvent,
  PerformerMessageEvent,
} from "@performer/core";
import { usePerformerClient } from "../hooks/use-performer-client.js";
import { MessageInput } from "./MessageInput.js";

export function ChatWindow({ App }: { App: Component<any> }) {
  const { events, sendMessage } = usePerformerClient(App);

  return (
    <div role="presentation" className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="relative h-full overflow-y-scroll">
          <div className="absolute left-0 right-0">
            <ModelSelect />
            {events.map((event, index) => {
              if (event instanceof PerformerMessageEvent) {
                return <Message key={index} message={event.detail.message} />;
              } else if (event instanceof PerformerLifecycleEvent) {
                return (
                  <Divider
                    key={index}
                    message={`Performer ${event.detail.state}`}
                  />
                );
              }
            })}
          </div>
          <Splash />
        </div>
      </div>
      <div className="w-full pt-2 dark:border-white/20 md:w-[calc(100%-.5rem)] md:border-transparent md:pt-0 md:dark:border-transparent">
        <MessageInput
          disclaimer="AI can make mistakes. Consider checking important information."
          onSubmit={(text) => sendMessage(text)}
        />
      </div>
    </div>
  );
}
