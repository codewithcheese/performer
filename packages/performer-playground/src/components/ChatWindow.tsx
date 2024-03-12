import { Component } from "@performer/core";
import { usePerformerClient } from "../hooks/use-performer-client.js";
import { MessageInput } from "./MessageInput.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.js";
import { MessageList } from "./MessageList.js";

export function ChatWindow({ App }: { App: Component<any> }) {
  const { events, sendMessage } = usePerformerClient(App);

  return (
    <div role="presentation" className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="relative h-full overflow-y-scroll">
          <div className="absolute left-0 right-0 mt-4">
            <Tabs defaultValue="chat">
              <TabsList className="m-auto grid w-[400px] grid-cols-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="all">All messages</TabsTrigger>
              </TabsList>
              <TabsContent value="chat">
                <MessageList events={events} filter="chat" />
              </TabsContent>
              <TabsContent value="all">
                <MessageList events={events} filter="all" />
              </TabsContent>
            </Tabs>
          </div>
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
