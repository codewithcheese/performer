import { Assistant, Repeat, User, useState, type Tool } from "@performer/core";
import { z } from "zod";

export function App() {
  const stopped = useState(false);
  const endChatTool: Tool = {
    id: "end_chat",
    name: "end_chat",
    description:
      "When the the conversation ends, when the user says goodbye or asks to end the chat",
    params: z.object({
      end_chat: z.boolean(),
    }),
    async call({ end_chat }: z.infer<typeof this.params>) {
      stopped.value = end_chat;
      return { role: "tool" };
    },
  };
  return () => (
    <>
      <system>Greet the user.</system>
      <Assistant />
      <Repeat stop={stopped}>
        <User />
        <Assistant tools={[endChatTool]} />
      </Repeat>
      <system>Thanks the user for their time, wish them a good day</system>
      <Assistant />
    </>
  );
}
