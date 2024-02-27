import { Assistant, Repeat, User, useToolData } from "@performer/core";
import { computed } from "@preact/signals-core";
import { z } from "zod";

export const name = "Chat until goodbye";

const ChatStateSchema = z
  .object({
    hasEnded: z.boolean().default(false),
  })
  .describe(
    "When the the conversation ends, when the user says goodbye or asks to end the chat",
  );

export function App() {
  const [chatState, tool] = useToolData("chatState", ChatStateSchema);
  const stopped = computed(() => chatState.value.hasEnded);
  return () => (
    <>
      <system>Greet the user.</system>
      <Assistant />
      <Repeat stop={stopped}>
        <User />
        <Assistant tools={[tool]} />
      </Repeat>
      <system>Thanks the user for their time, wish them a good day</system>
      <Assistant />
    </>
  );
}
